import json
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Form, Query, Response, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from groq import AsyncGroq

from app.core.config import settings
from app.core.database import get_db
from app.services.twiml_builder import TwiMLBuilder
from app.services.voice_alert_service import (
    generate_llm_explanation,
    generate_turn_response,
)

logger = logging.getLogger("cirra.voice.webhooks")
router = APIRouter(prefix="/api/v1/voice/webhooks", tags=["Voice Webhooks"])

twiml_builder = TwiMLBuilder()


def get_groq_client() -> Optional[AsyncGroq]:
    if settings.GROQ_API_KEY:
        return AsyncGroq(api_key=settings.GROQ_API_KEY)
    return None


@router.api_route("/twilio/twiml", methods=["GET", "POST"])
async def serve_opening_twiml(
    voice_call_id: str = Query(...),
    tenant_id: Optional[str] = Query(None),
    anomaly_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Twilio fetches this URL when the outbound call connects.
    Delivers opening speech with real financial values from DB and initiates speech gathering.
    """
    logger.info(f"Serving opening TwiML for voice_call_id={voice_call_id}, tenant_id={tenant_id}, anomaly_id={anomaly_id}")

    try:
        effective_tenant = tenant_id or "00000000-0000-0000-0000-000000000001"
        await db.execute(text("SELECT set_config('app.tenant_id', :tenant_id, true)"), {"tenant_id": effective_tenant})

        res = await db.execute(
            text("SELECT id, tenant_id, anomaly_snapshot, status FROM voice_calls WHERE id = CAST(:id AS UUID)"),
            {"id": voice_call_id},
        )
        row = res.mappings().fetchone()
        if not row:
            logger.error(f"Voice call record {voice_call_id} not found in DB")
            return Response(
                content=twiml_builder.build_error_twiml(),
                media_type="application/xml",
            )

        resolved_tenant_id = str(row["tenant_id"])
        if resolved_tenant_id != effective_tenant:
            await db.execute(text("SELECT set_config('app.tenant_id', :tenant_id, true)"), {"tenant_id": resolved_tenant_id})

        anomaly_snapshot = row["anomaly_snapshot"] or {}
        if isinstance(anomaly_snapshot, str):
            try:
                anomaly_snapshot = json.loads(anomaly_snapshot)
            except Exception:
                anomaly_snapshot = {}

        # Generate or retrieve LLM explanation
        groq_client = get_groq_client()
        llm_explanation = await generate_llm_explanation(anomaly_snapshot, groq_client)

        # Build TwiML
        twiml_str = twiml_builder.build_opening(
            anomaly_snapshot=anomaly_snapshot,
            voice_call_id=voice_call_id,
            llm_explanation=llm_explanation,
            tenant_id=resolved_tenant_id,
        )

        # Update call status to in-progress
        await db.execute(
            text(
                """
                UPDATE voice_calls 
                SET status = 'in-progress', answered_at = now(), updated_at = now() 
                WHERE id = CAST(:id AS UUID)
                """
            ),
            {"id": voice_call_id},
        )
        await db.commit()

        return Response(content=twiml_str, media_type="application/xml")
    except Exception as e:
        logger.exception(f"Error serving opening TwiML: {e}")
        return Response(
            content=twiml_builder.build_error_twiml(),
            media_type="application/xml",
        )


@router.post("/twilio/respond")
async def handle_speech_response(
    voice_call_id: str = Query(...),
    turn: int = Query(1),
    tenant_id: Optional[str] = Query(None),
    SpeechResult: str = Form(default=""),
    CallSid: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
):
    """
    Twilio posts here when user speech is transcribed.
    Groq classifies user intent and returns next conversational turn.
    """
    logger.info(
        f"Received speech response for voice_call_id={voice_call_id}, turn={turn}, tenant_id={tenant_id}, "
        f"CallSid={CallSid}, SpeechResult='{SpeechResult}'"
    )

    try:
        effective_tenant = tenant_id or "00000000-0000-0000-0000-000000000001"
        await db.execute(text("SELECT set_config('app.tenant_id', :tenant_id, true)"), {"tenant_id": effective_tenant})

        res = await db.execute(
            text("SELECT id, tenant_id, anomaly_snapshot, transcript, turn_count FROM voice_calls WHERE id = CAST(:id AS UUID)"),
            {"id": voice_call_id},
        )
        row = res.mappings().fetchone()
        if not row:
            logger.error(f"Voice call record {voice_call_id} not found")
            return Response(content=twiml_builder.build_error_twiml(), media_type="application/xml")

        resolved_tenant_id = str(row["tenant_id"])
        if resolved_tenant_id != effective_tenant:
            await db.execute(text("SELECT set_config('app.tenant_id', :tenant_id, true)"), {"tenant_id": resolved_tenant_id})

        anomaly_snapshot = row["anomaly_snapshot"] or {}
        if isinstance(anomaly_snapshot, str):
            try:
                anomaly_snapshot = json.loads(anomaly_snapshot)
            except Exception:
                anomaly_snapshot = {}

        transcript = row["transcript"] or []
        if isinstance(transcript, str):
            try:
                transcript = json.loads(transcript)
            except Exception:
                transcript = []

        now_iso = datetime.now(timezone.utc).isoformat()

        # Handle empty speech
        if not SpeechResult.strip():
            if turn >= 2:
                twiml_err = twiml_builder.build_turn_response(
                    groq_reply="We did not hear a response. Please check your Cirra dashboard.",
                    voice_call_id=voice_call_id,
                    turn_number=turn,
                    is_final=True,
                )
                await db.execute(
                    text("UPDATE voice_calls SET status = 'completed', outcome = 'no-response', ended_at = now(), updated_at = now() WHERE id = CAST(:id AS UUID)"),
                    {"id": voice_call_id},
                )
                await db.commit()
                return Response(content=twiml_err, media_type="application/xml")
            else:
                # Re-serve opening prompt as repeat
                groq_client = get_groq_client()
                llm_explanation = await generate_llm_explanation(anomaly_snapshot, groq_client)
                twiml_repeat = twiml_builder.build_opening(anomaly_snapshot, voice_call_id, llm_explanation)
                return Response(content=twiml_repeat, media_type="application/xml")

        # Record user turn in transcript
        transcript.append({"role": "user", "text": SpeechResult.strip(), "timestamp": now_iso})

        # Generate Groq response
        groq_client = get_groq_client()
        reply_text, outcome = await generate_turn_response(
            speech_result=SpeechResult,
            anomaly_snapshot=anomaly_snapshot,
            turn_history=transcript,
            groq_client=groq_client,
        )

        # Record assistant response
        transcript.append({"role": "assistant", "text": reply_text, "timestamp": datetime.now(timezone.utc).isoformat()})

        is_final = turn >= 3 or outcome in ("acknowledged", "completed", "escalated")

        # Update record in DB
        if is_final:
            await db.execute(
                text(
                    """
                    UPDATE voice_calls 
                    SET transcript = CAST(:transcript AS JSONB),
                        turn_count = :turn_count,
                        status = 'completed',
                        outcome = :outcome,
                        ended_at = now(),
                        updated_at = now()
                    WHERE id = CAST(:id AS UUID)
                    """
                ),
                {
                    "transcript": json.dumps(transcript),
                    "turn_count": turn,
                    "outcome": outcome,
                    "id": voice_call_id,
                },
            )
        else:
            await db.execute(
                text(
                    """
                    UPDATE voice_calls 
                    SET transcript = CAST(:transcript AS JSONB),
                        turn_count = :turn_count,
                        outcome = :outcome,
                        updated_at = now()
                    WHERE id = CAST(:id AS UUID)
                    """
                ),
                {
                    "transcript": json.dumps(transcript),
                    "turn_count": turn,
                    "outcome": outcome,
                    "id": voice_call_id,
                },
            )
        await db.commit()

        twiml = twiml_builder.build_turn_response(
            groq_reply=reply_text,
            voice_call_id=voice_call_id,
            turn_number=turn,
            is_final=is_final,
            tenant_id=resolved_tenant_id,
        )
        return Response(content=twiml, media_type="application/xml")
    except Exception as e:
        logger.exception(f"Error handling speech response: {e}")
        return Response(content=twiml_builder.build_error_twiml(), media_type="application/xml")


@router.post("/twilio/status")
async def handle_status_callback(
    CallSid: str = Form(...),
    CallStatus: str = Form(...),
    CallDuration: Optional[str] = Form(default=None),
    AnsweredBy: Optional[str] = Form(default=None),
    tenant_id: Optional[str] = Query(None),
    voice_call_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Receives Twilio call lifecycle status events (initiated, ringing, answered, completed).
    """
    logger.info(
        f"Twilio status event: CallSid={CallSid}, CallStatus={CallStatus}, "
        f"Duration={CallDuration}, AnsweredBy={AnsweredBy}, tenant_id={tenant_id}"
    )

    status_map = {
        "initiated": "initiated",
        "queued": "initiated",
        "ringing": "ringing",
        "in-progress": "in-progress",
        "answered": "in-progress",
        "completed": "completed",
        "failed": "failed",
        "no-answer": "no-answer",
        "busy": "failed",
        "canceled": "failed",
    }
    mapped_status = status_map.get(CallStatus.lower(), CallStatus.lower())

    duration_sec = None
    if CallDuration and CallDuration.isdigit():
        duration_sec = int(CallDuration)

    try:
        effective_tenant = tenant_id or "00000000-0000-0000-0000-000000000001"
        await db.execute(text("SELECT set_config('app.tenant_id', :tenant_id, true)"), {"tenant_id": effective_tenant})
        is_terminal = mapped_status in ("completed", "failed", "no-answer")
        if is_terminal:
            await db.execute(
                text(
                    """
                    UPDATE voice_calls 
                    SET status = :status,
                        duration_seconds = COALESCE(:duration, duration_seconds),
                        ended_at = COALESCE(ended_at, now()),
                        updated_at = now()
                    WHERE call_sid = :call_sid
                    """
                ),
                {
                    "status": mapped_status,
                    "duration": duration_sec,
                    "call_sid": CallSid,
                },
            )
        else:
            await db.execute(
                text(
                    """
                    UPDATE voice_calls 
                    SET status = :status,
                        duration_seconds = COALESCE(:duration, duration_seconds),
                        updated_at = now()
                    WHERE call_sid = :call_sid
                    """
                ),
                {
                    "status": mapped_status,
                    "duration": duration_sec,
                    "call_sid": CallSid,
                },
            )
        await db.commit()
    except Exception as e:
        logger.error(f"Error updating status callback for CallSid={CallSid}: {e}")

    return {"received": True}
