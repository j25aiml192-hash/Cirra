from typing import List
from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db_session
from src.models import Anomaly
from src.schemas import AnomalyResponse

router = APIRouter()


@router.get("", response_model=List[AnomalyResponse])
async def list_anomalies(
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    stmt = select(Anomaly).where(Anomaly.tenant_id == tenant_id).order_by(Anomaly.detected_at.desc())
    result = await db.execute(stmt)
    anomalies = result.scalars().all()

    return [
        AnomalyResponse(
            id=str(a.id),
            tenantId=str(a.tenant_id),
            serviceName=a.service_name,
            provider=a.provider,
            detectedAt=a.detected_at,
            severity=a.severity,
            status=a.status,
            baselineSpend=float(a.baseline_spend),
            actualSpend=float(a.actual_spend),
            spikePercentage=float(a.spike_percentage),
            explanation=a.explanation,
            rootCauseCandidate=a.root_cause_candidate,
        )
        for a in anomalies
    ]
