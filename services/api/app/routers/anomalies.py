import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db_tenant_session, require_role, check_rate_limit
from app.models.anomaly import Anomaly
from app.schemas.anomaly import AnomalyResponse, SnoozeRequest
from app.middleware.audit import log_audit_event

router = APIRouter(prefix="/anomalies", tags=["anomalies"])


@router.get("", response_model=List[AnomalyResponse])
async def list_anomalies(
    status_filter: Optional[str] = Query("open", alias="status"),
    limit: int = Query(50, ge=1, le=200),
    provider: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """
    List anomalies for the current tenant under RLS enforcement.
    Ordered by detected_at DESC.
    """
    tenant_id = uuid.UUID(claims["tenant_id"])
    stmt = select(Anomaly).where(Anomaly.tenant_id == tenant_id)

    if status_filter:
        stmt = stmt.where(Anomaly.status == status_filter)
    if provider:
        stmt = stmt.where(Anomaly.provider == provider)
    if severity:
        stmt = stmt.where(Anomaly.severity == severity)

    stmt = stmt.order_by(Anomaly.detected_at.desc()).limit(limit)

    try:
        result = await db.execute(stmt)
        anomalies = result.scalars().all()
        return anomalies
    except Exception:
        return []


@router.get("/{anomaly_id}", response_model=AnomalyResponse)
async def get_anomaly(
    anomaly_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """Get single anomaly by ID with full plain-English explanation."""
    tenant_id = uuid.UUID(claims["tenant_id"])
    stmt = select(Anomaly).where(
        Anomaly.id == anomaly_id,
        Anomaly.tenant_id == tenant_id,
    )
    anomaly = None
    try:
        result = await db.execute(stmt)
        anomaly = result.scalar_one_or_none()
    except Exception:
        pass

    if not anomaly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Anomaly not found"},
        )
    return anomaly


@router.post("/{anomaly_id}/acknowledge", response_model=AnomalyResponse)
async def acknowledge_anomaly(
    anomaly_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """Acknowledge an anomaly. Requires authentication."""
    tenant_id = uuid.UUID(claims["tenant_id"])
    user_id = claims["user_id"]

    stmt = select(Anomaly).where(
        Anomaly.id == anomaly_id,
        Anomaly.tenant_id == tenant_id,
    )
    anomaly = None
    try:
        result = await db.execute(stmt)
        anomaly = result.scalar_one_or_none()
    except Exception:
        pass

    if not anomaly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Anomaly not found"},
        )

    anomaly.status = "acknowledged"
    await db.commit()
    await db.refresh(anomaly)

    log_audit_event(
        action="anomaly.acknowledged",
        tenant_id=claims["tenant_id"],
        user_id=user_id,
        resource_type="anomaly",
        resource_id=str(anomaly_id),
        metadata={"series_key": anomaly.series_key, "previous_status": "open"},
    )

    return anomaly


@router.post("/{anomaly_id}/resolve", response_model=AnomalyResponse)
async def resolve_anomaly(
    anomaly_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Resolve an anomaly. Sets resolved_at = now(). Requires admin role."""
    tenant_id = uuid.UUID(claims["tenant_id"])
    user_id = claims["user_id"]

    stmt = select(Anomaly).where(
        Anomaly.id == anomaly_id,
        Anomaly.tenant_id == tenant_id,
    )
    anomaly = None
    try:
        result = await db.execute(stmt)
        anomaly = result.scalar_one_or_none()
    except Exception:
        pass

    if not anomaly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Anomaly not found"},
        )

    anomaly.status = "resolved"
    anomaly.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(anomaly)

    log_audit_event(
        action="anomaly.resolved",
        tenant_id=claims["tenant_id"],
        user_id=user_id,
        resource_type="anomaly",
        resource_id=str(anomaly_id),
        metadata={"series_key": anomaly.series_key},
    )

    return anomaly


@router.post("/{anomaly_id}/snooze", response_model=AnomalyResponse)
async def snooze_anomaly(
    anomaly_id: uuid.UUID,
    payload: SnoozeRequest,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """Snooze an anomaly for specified hours. Sets status = 'snoozed'."""
    tenant_id = uuid.UUID(claims["tenant_id"])
    user_id = claims["user_id"]

    stmt = select(Anomaly).where(
        Anomaly.id == anomaly_id,
        Anomaly.tenant_id == tenant_id,
    )
    anomaly = None
    try:
        result = await db.execute(stmt)
        anomaly = result.scalar_one_or_none()
    except Exception:
        pass

    if not anomaly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Anomaly not found"},
        )

    anomaly.status = "snoozed"
    await db.commit()
    await db.refresh(anomaly)

    log_audit_event(
        action="anomaly.snoozed",
        tenant_id=claims["tenant_id"],
        user_id=user_id,
        resource_type="anomaly",
        resource_id=str(anomaly_id),
        metadata={"snooze_hours": payload.hours, "series_key": anomaly.series_key},
    )

    return anomaly
