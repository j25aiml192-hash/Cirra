from typing import List
from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db_session
from src.models import SavingsEntry
from src.schemas import SavingsEntryResponse

router = APIRouter()


@router.get("", response_model=List[SavingsEntryResponse])
async def list_savings(
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    stmt = select(SavingsEntry).where(SavingsEntry.tenant_id == tenant_id)
    result = await db.execute(stmt)
    entries = result.scalars().all()

    return [
        SavingsEntryResponse(
            id=str(s.id),
            tenantId=str(s.tenant_id),
            category=s.category,
            title=s.title,
            description=s.description,
            potentialMonthlySavingsUsd=float(s.potential_monthly_savings_usd),
            realizedMonthlySavingsUsd=float(s.realized_monthly_savings_usd),
            effort=s.effort,
            status=s.status,
            detectedAt=s.detected_at,
        )
        for s in entries
    ]
