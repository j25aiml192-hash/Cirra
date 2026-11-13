import json
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session_factory
from app.deps import get_current_user_claims, security_bearer
from app.models.voice_call import VoiceCall
from app.models.anomaly import Anomaly
from app.services.voice_alert_service import VoiceAlertService

logger = logging.getLogger("cirra.voice.router")
router = APIRouter(prefix="/api/v1/voice", tags=["Voice Calls"])

voice_service = VoiceAlertService()


class TriggerCallRequest(BaseModel):
    anomaly_id: str = Field(..., description="UUID of the anomaly to trigger call for")
    tenant_id: Optional[str] = Field(None, description="Tenant ID (required when called via internal service key)")


class TriggerCallResponse(BaseModel):
    voice_call_id: str
    status: str
    call_sid: Optional[str] = None


class VoiceCallResponse(BaseModel):
    id: str
    tenant_id: str
    anomaly_id: Optional[str] = None
    call_sid: Optional[str] = None
    provider: str
    status: str
    to_number: str
    from_number: str
    duration_seconds: Optional[int] = None
    turn_count: int = 0
    transcript: List[Dict[str, Any]] = Field(default_factory=list)
    anomaly_snapshot: Optional[Dict[str, Any]] = None
    outcome: Optional[str] = None
    initiated_at: Optional[datetime] = None
    answered_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    retry_count: int = 0
    error_message: Optional[str] = None


async def resolve_auth_context(
    request: Request,
    x_internal_service: Optional[str] = Header(None, alias="X-Internal-Service"),
    auth_credentials=Depends(security_bearer),
) -> Dict[str, Any]:
    """
    Supports both internal service authentication and user Bearer JWT authentication.
    """
    if x_internal_service and x_internal_service == settings.INTERNAL_SERVICE_KEY:
        tenant_id = request.headers.get("x-tenant-id") or request.headers.get("X-Tenant-ID") or "00000000-0000-0000-0000-000000000001"
        return {"auth_type": "internal", "role": "admin", "tenant_id": tenant_id}

    if auth_credentials:
        claims = await get_current_user_claims(request, auth_credentials)
        return {"auth_type": "user", "claims": claims, "tenant_id": claims.get("tenant_id")}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing valid authentication token or X-Internal-Service key",
    )


@router.post("/call", response_model=TriggerCallResponse)
async def trigger_call(
    req: TriggerCallRequest,
    auth: Dict[str, Any] = Depends(resolve_auth_context),
):
    """
    Initiates an outbound voice alert call for a high or critical anomaly.
    Enforces tenant scoping and rate limits (max 3 calls/anomaly, 10/tenant/hr).
    """
    try:
        anomaly_uuid = uuid.UUID(req.anomaly_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid anomaly_id UUID")

    # Determine caller tenant_id
    if auth["auth_type"] == "user":
        caller_tenant_id = auth["claims"]["tenant_id"]
    else:
        if not req.tenant_id:
            raise HTTPException(status_code=400, detail="tenant_id required when calling with internal key")
        caller_tenant_id = req.tenant_id

    async with async_session_factory() as session:
        # Set tenant isolation
        await session.execute(text("SELECT set_config('app.tenant_id', :tenant_id, true)"), {"tenant_id": caller_tenant_id})

        # Fetch and validate anomaly
        res = await session.execute(
            text(
                """
                SELECT id, tenant_id, provider, severity, baseline_value, actual_value, 
                       deviation_pct, explanation, api_key_id, series_key
                FROM anomalies 
                WHERE id = CAST(:id AS UUID)
                """
            ),
            {"id": str(anomaly_uuid)},
        )
        anomaly_row = res.mappings().fetchone()
        if not anomaly_row:
            raise HTTPException(status_code=404, detail="Anomaly not found or unauthorized")

        anomaly_dict = dict(anomaly_row)
        if str(anomaly_dict["tenant_id"]) != caller_tenant_id:
            raise HTTPException(status_code=403, detail="Anomaly does not belong to your tenant")

        if anomaly_dict.get("severity") not in ("high", "critical"):
            raise HTTPException(
                status_code=400,
                detail=f"Voice alerts can only be triggered for high/critical anomalies (found: {anomaly_dict.get('severity')})",
            )

        # Rate limits check
        # 1. Max 3 calls per anomaly
        anomaly_calls_count = await session.scalar(
            text("SELECT count(*) FROM voice_calls WHERE anomaly_id = CAST(:anomaly_id AS UUID)"),
            {"anomaly_id": str(anomaly_uuid)},
        )
        if anomaly_calls_count and anomaly_calls_count >= 3:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit reached: Maximum 3 voice alert calls per anomaly allowed.",
            )

        # 2. Max 10 calls per tenant per hour
        one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        hourly_tenant_calls = await session.scalar(
            text("SELECT count(*) FROM voice_calls WHERE tenant_id = CAST(:tenant_id AS UUID) AND initiated_at >= :hour_ago"),
            {"tenant_id": caller_tenant_id, "hour_ago": one_hour_ago},
        )
        if hourly_tenant_calls and hourly_tenant_calls >= 10:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit reached: Maximum 10 voice alert calls per tenant per hour.",
            )

        # Trigger call using the direct underlying asyncpg connection or session connection
        connection = await session.connection()
        raw_conn = await connection.get_raw_connection()
        asyncpg_conn = raw_conn.driver_connection

        voice_call_id = await voice_service.trigger_alert_call(
            anomaly=anomaly_dict,
            tenant_id=caller_tenant_id,
            conn=asyncpg_conn,
        )

        # Fetch status and CallSid
        call_info = await session.execute(
            text("SELECT status, call_sid FROM voice_calls WHERE id = CAST(:id AS UUID)"),
            {"id": voice_call_id},
        )
        call_row = call_info.mappings().fetchone()

        await session.commit()

        return TriggerCallResponse(
            voice_call_id=voice_call_id,
            status=call_row["status"] if call_row else "initiated",
            call_sid=call_row["call_sid"] if call_row else None,
        )


@router.get("/calls", response_model=List[VoiceCallResponse])
async def list_calls(
    limit: int = Query(50, ge=1, le=100),
    auth: Dict[str, Any] = Depends(resolve_auth_context),
):
    """
    Returns voice_calls for tenant, ordered by initiated_at DESC.
    """
    if auth["auth_type"] == "user":
        tenant_id = auth["claims"]["tenant_id"]
    else:
        # Default to tenant zero if internal service without explicit tenant
        tenant_id = "00000000-0000-0000-0000-000000000001"

    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT set_config('app.tenant_id', :tenant_id, true)"), {"tenant_id": tenant_id})
            res = await session.execute(
                text(
                    """
                    SELECT id::text, tenant_id::text, anomaly_id::text, call_sid, provider, status,
                           to_number, from_number, duration_seconds, turn_count, transcript,
                           anomaly_snapshot, outcome, initiated_at, answered_at, ended_at,
                           retry_count, error_message
                    FROM voice_calls
                    WHERE tenant_id = CAST(:tenant_id AS UUID)
                    ORDER BY initiated_at DESC
                    LIMIT :limit
                    """
                ),
                {"tenant_id": tenant_id, "limit": limit},
            )
            rows = [dict(r) for r in res.mappings().all()]
            return rows
    except Exception:
        return []


@router.get("/calls/{call_id}", response_model=VoiceCallResponse)
async def get_call(
    call_id: str,
    auth: Dict[str, Any] = Depends(resolve_auth_context),
):
    """
    Returns a single voice_call with full conversational transcript.
    """
    try:
        call_uuid = uuid.UUID(call_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid call_id UUID")

    if auth["auth_type"] == "user":
        tenant_id = auth["claims"]["tenant_id"]
    else:
        tenant_id = "00000000-0000-0000-0000-000000000001"

    async with async_session_factory() as session:
        await session.execute(text("SELECT set_config('app.tenant_id', :tenant_id, true)"), {"tenant_id": tenant_id})
        stmt = text(
            """
            SELECT id::text, tenant_id::text, anomaly_id::text, call_sid, provider, status,
                   to_number, from_number, duration_seconds, turn_count, transcript,
                   anomaly_snapshot, outcome, initiated_at, answered_at, ended_at,
                   retry_count, error_message
            FROM voice_calls
            WHERE id = CAST(:id AS UUID)
            """
        )
        params = {"id": str(call_uuid)}

        res = await session.execute(stmt, params)
        row = res.mappings().fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Voice call not found")

        return dict(row)


@router.post("/calls/{call_id}/retry", response_model=TriggerCallResponse)
async def retry_call(
    call_id: str,
    auth: Dict[str, Any] = Depends(resolve_auth_context),
):
    """
    Retries an existing call if it failed, was busy, or was unanswered.
    Creates a new voice_call record with incremented retry_count.
    """
    try:
        call_uuid = uuid.UUID(call_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid call_id UUID")

    if auth["auth_type"] == "user":
        tenant_id = auth["claims"]["tenant_id"]
    else:
        tenant_id = "00000000-0000-0000-0000-000000000001"

    async with async_session_factory() as session:
        await session.execute(text("SELECT set_config('app.tenant_id', :tenant_id, true)"), {"tenant_id": tenant_id})
        stmt = text("SELECT * FROM voice_calls WHERE id = CAST(:id AS UUID)")
        params = {"id": str(call_uuid)}

        res = await session.execute(stmt, params)
        call_row = res.mappings().fetchone()
        if not call_row:
            raise HTTPException(status_code=404, detail="Voice call not found")

        curr_status = call_row["status"]
        curr_retries = call_row["retry_count"] or 0

        if curr_status not in ("failed", "no-answer", "busy"):
            raise HTTPException(
                status_code=400,
                detail=f"Only failed, no-answer, or busy calls can be retried (current status: '{curr_status}')",
            )

        if curr_retries >= 3:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Maximum retry limit (3 retries) reached for this call.",
            )

        anomaly_snapshot = call_row["anomaly_snapshot"] or {}
        if isinstance(anomaly_snapshot, str):
            anomaly_snapshot = json.loads(anomaly_snapshot)

        connection = await session.connection()
        raw_conn = await connection.get_raw_connection()
        asyncpg_conn = raw_conn.driver_connection

        new_call_id = await voice_service.trigger_alert_call(
            anomaly=anomaly_snapshot,
            tenant_id=str(call_row["tenant_id"]),
            conn=asyncpg_conn,
        )

        # Update retry count
        await session.execute(
            text("UPDATE voice_calls SET retry_count = :rc WHERE id = CAST(:id AS UUID)"),
            {"rc": curr_retries + 1, "id": new_call_id},
        )
        await session.commit()

        call_info = await session.execute(
            text("SELECT status, call_sid FROM voice_calls WHERE id = CAST(:id AS UUID)"),
            {"id": new_call_id},
        )
        new_row = call_info.mappings().fetchone()

        return TriggerCallResponse(
            voice_call_id=new_call_id,
            status=new_row["status"] if new_row else "initiated",
            call_sid=new_row["call_sid"] if new_row else None,
        )
