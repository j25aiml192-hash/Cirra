import json
import logging
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, List, Optional, Tuple
import asyncpg
import httpx

from app.core.config import settings
from app.integrations.telephony.base import CallRequest, CallResult
from app.integrations.telephony.mock_provider import MockTelephonyProvider
from app.integrations.telephony.twilio_provider import TwilioProvider
from app.services.twiml_builder import TwiMLBuilder

INVESTIGATOR_URL = os.getenv("INVESTIGATOR_URL", "http://localhost:8001")

logger = logging.getLogger("cirra.voice.alert_service")

FALLBACK_CALL_SCRIPT = (
    "Alert. This is an automated message from Cirra. "
    "A cost anomaly has been detected on your account. "
    "Please check your Cirra dashboard immediately "
    "for details and required actions. "
    "This call was generated automatically."
)

CIRRA_CALL_SYSTEM_PROMPT = """You are Cirra's AI monitoring assistant on a phone call with a user whose API key is behaving abnormally.

You have already explained the anomaly. The user has just responded. Your job is to reply conversationally in 2-3 sentences maximum.

Rules:
- Never invent numbers. All financial figures were already stated in the opening message.
- If user says acknowledge/yes/ok: confirm you have recorded their acknowledgement and tell them to visit the Cirra dashboard to approve any actions.
- If user says options/help: list three options:
  1. Visit dashboard to approve a kill switch.
  2. Rotate the key manually at the provider console.
  3. Set a spend cap in Cirra.
- If user says disable key/kill switch: explain that for security, kill switch requires approval in the Cirra dashboard. You cannot execute it on a call.
- If user says repeat: tell them to check their Cirra dashboard for the full report.
- If user says stop/no/goodbye: thank them and end politely.
- Keep responses under 40 words.
- Never say you are an AI unless directly asked.
- Speak naturally, not robotically.
"""


def _decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, uuid.UUID) or "UUID" in type(obj).__name__:
        return str(obj)
    return str(obj)


async def _call_llm_router(
    messages: list[dict],
    temperature: float = 0.3,
    max_tokens: int = 300,
) -> str:
    """
    Calls investigator's LLM router for call script
    generation. Falls back to empty string on failure
    so voice calls still fire even if LLM is down.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{INVESTIGATOR_URL.rstrip('/')}/llm/complete",
                headers={"X-Internal-Service": "internal-dev-key"},
                json={
                    "task_type": "call_script_generation",
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data.get("text") or data.get("content") or ""
    except Exception as e:
        logger.warning(
            f"LLM router unavailable for call script: {e}. "
            f"Using fallback script."
        )
        return ""  # caller uses hardcoded fallback


async def generate_call_script(anomaly: dict) -> str:
    """
    Generate call script for voice alerts. Uses LLM router with fallback script.
    """
    provider = anomaly.get("provider", "cloud")
    dev_pct = anomaly.get("deviation_pct", 300)
    messages = [
        {
            "role": "system",
            "content": "You generate urgent but professional AI voice call scripts. Under 60 words.",
        },
        {
            "role": "user",
            "content": f"Generate a call script for: {provider} spend is {dev_pct}% above baseline. Possible runaway process. Immediate action needed.",
        },
    ]
    script = await _call_llm_router(messages, temperature=0.3, max_tokens=150)
    if not script.strip():
        script = FALLBACK_CALL_SCRIPT
    return script


async def generate_llm_explanation(
    anomaly: dict, 
    groq_client: Optional[Any] = None,
) -> str:
    """
    Generates a 1-2 sentence natural language explanation of the anomaly.
    Routes through the unified LLM router with fallback.
    """
    provider = anomaly.get("provider", "cloud")
    dev_pct = anomaly.get("deviation_pct", 300)
    time_of_day = datetime.now(timezone.utc).strftime("%H:%M UTC")

    prompt = (
        f"In 1-2 sentences, explain why a {dev_pct}% spend spike on {provider} at {time_of_day} is suspicious. "
        "Do not include dollar amounts (they are stated separately). Be direct and factual. Max 30 words."
    )

    messages = [
        {"role": "system", "content": "You are Cirra's cloud cost analyst. Return only the requested explanation."},
        {"role": "user", "content": prompt},
    ]

    script = await _call_llm_router(messages, temperature=0.2, max_tokens=60)
    if script and script.strip():
        return script.strip().replace('"', "")

    # Fallback deterministic explanation
    return f"This sudden {dev_pct}% surge on {provider} deviates drastically from your 7-day median baseline and indicates possible credential leakage or runaway loops."


async def generate_turn_response(
    speech_result: str,
    anomaly_snapshot: dict,
    turn_history: list,
    groq_client: Optional[Any] = None,
) -> Tuple[str, str]:
    """
    Sends user speech transcript to LLM router with full context.
    Returns (reply_text, detected_outcome).
    """
    text_clean = (speech_result or "").strip().lower()

    # Rule-based outcome classification
    if not text_clean:
        return "I didn't catch that. Could you please repeat?", "no-response"

    if any(k in text_clean for k in ("acknowledge", "acknowledged", "yes", "i confirm", "got it", "noted")):
        outcome = "acknowledged"
    elif any(k in text_clean for k in ("disable", "kill", "switch", "shut down", "block")):
        outcome = "escalated"
    elif any(k in text_clean for k in ("stop", "no", "bye", "goodbye", "end")):
        outcome = "completed"
    else:
        outcome = "continuing"

    provider = anomaly_snapshot.get("provider", "cloud")

    messages = [
        {"role": "system", "content": CIRRA_CALL_SYSTEM_PROMPT},
        {
            "role": "assistant",
            "content": f"Alert: We detected an anomaly on your {provider} account. Would you like to acknowledge or hear options?",
        },
    ]

    for turn in turn_history:
        if isinstance(turn, dict) and "role" in turn and "text" in turn:
            messages.append({"role": turn["role"], "content": turn["text"]})

    messages.append({"role": "user", "content": speech_result})

    reply = await _call_llm_router(messages, temperature=0.3, max_tokens=100)
    if reply and reply.strip():
        return reply.strip(), outcome

    # Fallback conversational responses
    if outcome == "acknowledged":
        return "I have recorded your acknowledgement. Please visit your Cirra dashboard to review and approve actions.", outcome
    elif outcome == "escalated":
        return "For security, key disablement must be approved directly in your Cirra dashboard. I have queued the recommendation.", outcome
    elif outcome == "completed":
        return "Thank you. Please check your dashboard for further updates.", outcome
    else:
        return "You can visit the Cirra dashboard to approve a kill switch, rotate your key, or set a spend cap.", outcome


class VoiceAlertService:
    """
    Coordinates telephony calls, LLM speech generation, and state management.
    """

    def __init__(self, force_mock: bool = False):
        import os
        is_testing = bool(os.environ.get("PYTEST_CURRENT_TEST") or settings.ENVIRONMENT == "test" or settings.INGEST_MOCK or force_mock)
        has_twilio = bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN)
        if not is_testing and has_twilio:
            self.provider = TwilioProvider()
        else:
            self.provider = MockTelephonyProvider()

        self.twiml = TwiMLBuilder(webhook_base_url=settings.PUBLIC_WEBHOOK_URL)
        self.groq = None

    async def trigger_alert_call(
        self,
        anomaly: dict,
        tenant_id: str,
        conn: asyncpg.Connection,
    ) -> str:
        """
        Idempotently initiates an AI phone call for a high or critical anomaly.
        """
        anomaly_id = str(anomaly["id"]) if anomaly.get("id") else None

        # 1. Check idempotency: avoid placing duplicate active calls for the same anomaly
        if anomaly_id and not anomaly.get("is_test"):
            existing_call_id = await conn.fetchval(
                """
                SELECT id::text FROM voice_calls 
                WHERE anomaly_id = $1::uuid 
                  AND status NOT IN ('failed', 'no-answer', 'busy')
                ORDER BY initiated_at DESC
                LIMIT 1
                """,
                anomaly_id,
            )
            if existing_call_id:
                logger.info(f"Call already placed for anomaly {anomaly_id}. Reusing call ID: {existing_call_id}")
                return existing_call_id

        to_num = anomaly.get("to_number") or settings.VAPI_ALERT_PHONE_NUMBER or "+918910095002"
        from_num = settings.TWILIO_FROM_NUMBER or "+17372508034"
        snapshot_json = json.dumps(anomaly, default=_decimal_default)

        # 2. Create voice_call record in DB
        anomaly_uuid = uuid.UUID(anomaly_id) if anomaly_id else None
        voice_call_id = await conn.fetchval(
            """
            INSERT INTO voice_calls (
                id, tenant_id, anomaly_id, to_number, from_number,
                anomaly_snapshot, status, initiated_at, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), $1::uuid, $2, $3, $4,
                $5::jsonb, 'initiated', now(), now(), now()
            )
            RETURNING id::text
            """,
            tenant_id,
            anomaly_uuid,
            to_num,
            from_num,
            snapshot_json,
        )

        logger.info(f"Created voice_call record: id={voice_call_id} for anomaly={anomaly_id}")

        # 3. Generate LLM explanation
        explanation = await generate_llm_explanation(anomaly, self.groq)

        # 4. Initiate call via telephony provider
        call_req = CallRequest(
            to_number=to_num,
            from_number=from_num,
            webhook_url=settings.PUBLIC_WEBHOOK_URL,
            anomaly_snapshot=anomaly,
            tenant_id=tenant_id,
            anomaly_id=anomaly_id or "test-anomaly",
            voice_call_db_id=voice_call_id,
        )

        call_res: CallResult = await self.provider.initiate_call(call_req)

        # 5. Update DB with call result
        if call_res.success:
            await conn.execute(
                """
                UPDATE voice_calls 
                SET call_sid = $1, status = 'ringing', updated_at = now()
                WHERE id = $2::uuid
                """,
                call_res.call_sid,
                voice_call_id,
            )
            logger.info(f"Voice call {voice_call_id} ringing (CallSid={call_res.call_sid})")
        else:
            await conn.execute(
                """
                UPDATE voice_calls 
                SET status = 'failed', error_message = $1, updated_at = now()
                WHERE id = $2::uuid
                """,
                call_res.error,
                voice_call_id,
            )
            logger.error(f"Voice call {voice_call_id} failed to initiate: {call_res.error}")

        return voice_call_id
