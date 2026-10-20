from typing import List
from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db_session
from src.models import AllocationRule
from src.schemas import AllocationRuleResponse

router = APIRouter()


@router.get("/rules", response_model=List[AllocationRuleResponse])
async def list_allocation_rules(
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    stmt = select(AllocationRule).where(AllocationRule.tenant_id == tenant_id).order_by(AllocationRule.priority)
    result = await db.execute(stmt)
    rules = result.scalars().all()

    return [
        AllocationRuleResponse(
            id=str(r.id),
            tenantId=str(r.tenant_id),
            name=r.name,
            priority=r.priority,
            method=r.method,
            tagKey=r.tag_key,
            targetDimension=r.target_dimension,
            targetValue=r.target_value,
            filterConditions=r.filter_conditions or {},
            createdAt=r.created_at,
            updatedAt=r.updated_at,
        )
        for r in rules
    ]
