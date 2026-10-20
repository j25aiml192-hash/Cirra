from typing import List, Dict, Any
from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db_session
from src.models import Budget

router = APIRouter()


@router.get("")
async def list_budgets(
    request: Request,
    db: AsyncSession = Depends(get_db_session)
) -> List[Dict[str, Any]]:
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    stmt = select(Budget).where(Budget.tenant_id == tenant_id)
    result = await db.execute(stmt)
    budgets = result.scalars().all()

    return [
        {
            "id": str(b.id),
            "tenantId": str(b.tenant_id),
            "name": b.name,
            "amountLimit": float(b.amount_limit),
            "currency": b.currency,
            "period": b.period,
            "alertThresholdPct": b.alert_threshold_pct,
            "createdAt": b.created_at.isoformat(),
        }
        for b in budgets
    ]
