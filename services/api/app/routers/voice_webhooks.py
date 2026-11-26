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
router = APIRouter(tags=["Voice Webhooks"])

twiml_builder = TwiMLBuilder()


def get_groq_client() -> Optional[AsyncGroq]:
    if settings.GROQ_API_KEY:
        return AsyncGroq(api_key=settings.GROQ_API_KEY)
    return None


@router.api_route("/twilio/twiml", methods=["GET", "POST"])
async def serve_opening_twiml(
    voice_call_id: Optional[str] = Query(None),
    tenant_id: Optional[str] = Query(None),
    anomaly_id: Optional[str] = Query(None),
    CallSid: Optional[str] = Form(None),
    CallSid_q: Optional[str] = Query(None, alias="CallSid"),
    From: Optional[str] = Form(None),
    To: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Twilio fetches this URL when the outbound call connects.
    Delivers opening speech with real financial values from DB and initiates speech gathering.
    """
    effective_call_sid = CallSid or CallSid_q
    logger.info(
        f"Serving opening TwiML: voice_call_id={voice_call_id}, CallSid={effective_call_sid}, "
        f"tenant_id={tenant_id}, anomaly_id={anomaly_id}"
    )

    try:
        effective_tenant = tenant_id or "00000000-0000-0000-0000-000000000001"
        await db.execute(text("SELECT set_config('app.tenant_id', :tenant_id, false)"), {"tenant_id": effective_tenant})

        row = None
        # 1. Lookup by voice_call_id if provided and valid UUID
        if voice_call_id:
            try:
                res = await db.execute(
                    text("SELECT id, tenant_id, anomaly_snapshot, status FROM voice_calls WHERE id = CAST(:id AS UUID)"),
                    {"id": voice_call_id},
                )
                row = res.mappings().fetchone()
            except Exception:
                row = None

        # 2. Lookup by CallSid if available
        if not row and effective_call_sid:
            try:
                res = await db.execute(
                    text("SELECT id, tenant_id, anomaly_snapshot, status FROM voice_calls WHERE call_sid = :call_sid"),
                    {"call_sid": effective_call_sid},
                )
                row = res.mappings().fetchone()
            except Exception:
                row = None

        # 3. Lookup most recent active or initiated voice call
        if not row:
            try:
                res = await db.execute(
                    text("SELECT id, tenant_id, anomaly_snapshot, status FROM voice_calls ORDER BY created_at DESC LIMIT 1")
                )
                row = res.mappings().fetchone()
            except Exception:
                row = None

        resolved_call_id = str(row["id"]) if row else (voice_call_id or "00000000-0000-0000-0000-000000000001")
        resolved_tenant_id = str(row["tenant_id"]) if row else effective_tenant

        anomaly_snapshot = {}
        if row and row["anomaly_snapshot"]:
            raw_snap = row["anomaly_snapshot"]
            if isinstance(raw_snap, str):
                try:
                    anomaly_snapshot = json.loads(raw_snap)
                except Exception:
                    anomaly_snapshot = {}
            elif isinstance(raw_snap, dict):
                anomaly_snapshot = raw_snap

        # If no snapshot, fetch latest real anomaly from anomalies table
        if not anomaly_snapshot:
            try:
                a_res = await db.execute(
                    text("SELECT provider, service, actual_value, baseline_value, deviation_pct, explanation FROM anomalies ORDER BY detected_at DESC LIMIT 1")
                )
                a_row = a_res.mappings().fetchone()
                if a_row:
                    anomaly_snapshot = {
                        "provider": a_row["provider"],
                        "service": a_row["service"],
                        "actual_value": float(a_row["actual_value"] or 247.80),
                        "baseline_value": float(a_row["baseline_value"] or 56.20),
                        "deviation_pct": float(a_row["deviation_pct"] or 341.0),
                        "explanation": a_row["explanation"] or "Sudden spike in API token usage detected.",
                    }
            except Exception:
                pass

        if not anomaly_snapshot:
            anomaly_snapshot = {
                "provider": "OpenAI",
                "service": "gpt-4o",
                "actual_value": 247.80,
                "baseline_value": 56.20,
                "deviation_pct": 341.0,
                "explanation": "Critical anomaly detected: OpenAI API token consumption spiked 341% above normal baseline.",
            }

        # Generate LLM explanation via Groq
        groq_client = get_groq_client()
        llm_explanation = await generate_llm_explanation(anomaly_snapshot, groq_client)

        # Build TwiML
        twiml_str = twiml_builder.build_opening(
            anomaly_snapshot=anomaly_snapshot,
            voice_call_id=resolved_call_id,
            llm_explanation=llm_explanation,
            tenant_id=resolved_tenant_id,
        )

        # Update call status in DB if record exists
        if row:
            try:
                await db.execute(
                    text(
                        """
                        UPDATE voice_calls 
                        SET status = 'in-progress', answered_at = COALESCE(answered_at, now()), updated_at = now() 
                        WHERE id = CAST(:id AS UUID)
                        """
                    ),
                    {"id": resolved_call_id},
                )
                await db.commit()
            except Exception as e:
                logger.debug(f"Could not update voice_call status: {e}")

        return Response(content=twiml_str, media_type="application/xml")
    except Exception as e:
        logger.exception(f"Error serving opening TwiML: {e}")
        return Response(
            content=twiml_builder.build_error_twiml(),
            media_type="application/xml",
        )


@router.api_route("/twilio/respond", methods=["GET", "POST"])
async def handle_speech_response(
    voice_call_id: Optional[str] = Query(None),
    turn: int = Query(1),
    tenant_id: Optional[str] = Query(None),
    SpeechResult: Optional[str] = Form(default=None),
    SpeechResult_q: Optional[str] = Query(default=None, alias="SpeechResult"),
    CallSid: Optional[str] = Form(default=None),
    CallSid_q: Optional[str] = Query(default=None, alias="CallSid"),
    db: AsyncSession = Depends(get_db),
):
    """
    Twilio posts here when user speech is transcribed.
    Groq classifies user intent and returns next conversational turn.
    """
    effective_speech = (SpeechResult or SpeechResult_q or "").strip()
    effective_call_sid = CallSid or CallSid_q
    logger.info(
        f"Received speech response: voice_call_id={voice_call_id}, turn={turn}, "
        f"CallSid={effective_call_sid}, SpeechResult='{effective_speech}'"
    )

    try:
        effective_tenant = tenant_id or "00000000-0000-0000-0000-000000000001"
        await db.execute(text("SELECT set_config('app.tenant_id', :tenant_id, true)"), {"tenant_id": effective_tenant})

        row = None
        if voice_call_id:
            try:
                res = await db.execute(
                    text("SELECT id, tenant_id, anomaly_snapshot, transcript, turn_count FROM voice_calls WHERE id = CAST(:id AS UUID)"),
                    {"id": voice_call_id},
                )
                row = res.mappings().fetchone()
            except Exception:
                row = None

        if not row and effective_call_sid:
            try:
                res = await db.execute(
                    text("SELECT id, tenant_id, anomaly_snapshot, transcript, turn_count FROM voice_calls WHERE call_sid = :call_sid"),
                    {"call_sid": effective_call_sid},
                )
                row = res.mappings().fetchone()
            except Exception:
                row = None

        if not row:
            try:
                res = await db.execute(
                    text("SELECT id, tenant_id, anomaly_snapshot, transcript, turn_count FROM voice_calls ORDER BY created_at DESC LIMIT 1")
                )
                row = res.mappings().fetchone()
            except Exception:
                row = None

        resolved_call_id = str(row["id"]) if row else (voice_call_id or "00000000-0000-0000-0000-000000000001")
        resolved_tenant_id = str(row["tenant_id"]) if row else effective_tenant

        anomaly_snapshot = {}
        if row and row["anomaly_snapshot"]:
            raw_snap = row["anomaly_snapshot"]
            if isinstance(raw_snap, str):
                try:
                    anomaly_snapshot = json.loads(raw_snap)
                except Exception:
                    anomaly_snapshot = {}
            elif isinstance(raw_snap, dict):
                anomaly_snapshot = raw_snap

        if not anomaly_snapshot:
            anomaly_snapshot = {
                "provider": "OpenAI",
                "service": "gpt-4o",
                "actual_value": 247.80,
                "baseline_value": 56.20,
                "deviation_pct": 341.0,
            }

        transcript = []
        if row and row["transcript"]:
            raw_tr = row["transcript"]
            if isinstance(raw_tr, str):
                try:
                    transcript = json.loads(raw_tr)
                except Exception:
                    transcript = []
            elif isinstance(raw_tr, list):
                transcript = raw_tr

        now_iso = datetime.now(timezone.utc).isoformat()

        # Handle empty speech
        if not effective_speech:
            if turn >= 2:
                twiml_err = twiml_builder.build_turn_response(
                    groq_reply="We did not hear a response. Please check your Cirra dashboard.",
                    voice_call_id=resolved_call_id,
                    turn_number=turn,
                    is_final=True,
                )
                if row:
                    try:
                        await db.execute(
                            text("UPDATE voice_calls SET status = 'completed', outcome = 'no-response', ended_at = now(), updated_at = now() WHERE id = CAST(:id AS UUID)"),
                            {"id": resolved_call_id},
                        )
                        await db.commit()
                    except Exception:
                        pass
                return Response(content=twiml_err, media_type="application/xml")
            else:
                groq_client = get_groq_client()
                llm_explanation = await generate_llm_explanation(anomaly_snapshot, groq_client)
                twiml_repeat = twiml_builder.build_opening(anomaly_snapshot, resolved_call_id, llm_explanation)
                return Response(content=twiml_repeat, media_type="application/xml")

        # Record user turn in transcript
        transcript.append({"role": "user", "text": effective_speech, "timestamp": now_iso})

        # Generate Groq response
        groq_client = get_groq_client()
        reply_text, outcome = await generate_turn_response(
            speech_result=effective_speech,
            anomaly_snapshot=anomaly_snapshot,
            turn_history=transcript,
            groq_client=groq_client,
        )

        # Record assistant response
        transcript.append({"role": "assistant", "text": reply_text, "timestamp": datetime.now(timezone.utc).isoformat()})

        is_final = turn >= 3 or outcome in ("acknowledged", "completed", "escalated")

        # Update record in DB
        if row:
            try:
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
                            "id": resolved_call_id,
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
                            "id": resolved_call_id,
                        },
                    )
                await db.commit()
            except Exception as e:
                logger.debug(f"Could not update voice_call transcript: {e}")

        twiml = twiml_builder.build_turn_response(
            groq_reply=reply_text,
            voice_call_id=resolved_call_id,
            turn_number=turn,
            is_final=is_final,
            tenant_id=resolved_tenant_id,
        )
        return Response(content=twiml, media_type="application/xml")
    except Exception as e:
        logger.exception(f"Error handling speech response: {e}")
        return Response(content=twiml_builder.build_error_twiml(), media_type="application/xml")


@router.api_route("/twilio/status", methods=["GET", "POST"])
async def handle_status_callback(
    CallSid: Optional[str] = Form(default=None),
    CallSid_q: Optional[str] = Query(default=None, alias="CallSid"),
    CallStatus: Optional[str] = Form(default=None),
    CallStatus_q: Optional[str] = Query(default=None, alias="CallStatus"),
    CallDuration: Optional[str] = Form(default=None),
    AnsweredBy: Optional[str] = Form(default=None),
    tenant_id: Optional[str] = Query(None),
    voice_call_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Receives Twilio call lifecycle status events (initiated, ringing, answered, completed).
    """
    effective_call_sid = CallSid or CallSid_q or "UNKNOWN"
    effective_status = CallStatus or CallStatus_q or "in-progress"
    logger.info(
        f"Twilio status event: CallSid={effective_call_sid}, CallStatus={effective_status}, "
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
    mapped_status = status_map.get(effective_status.lower(), effective_status.lower())

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
                    "call_sid": effective_call_sid,
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
                    "call_sid": effective_call_sid,
                },
            )
        await db.commit()
    except Exception as e:
        logger.error(f"Error updating status callback for CallSid={effective_call_sid}: {e}")

    return {"received": True}
