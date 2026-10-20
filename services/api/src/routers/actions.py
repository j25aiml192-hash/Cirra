from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from src.core.database import get_db_session
from src.models import Action
from src.schemas import ActionResponse

router = APIRouter()


class ApproveActionRequest(BaseModel):
    actionId: str


@router.get("", response_model=List[ActionResponse])
async def list_actions(
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    stmt = select(Action).where(Action.tenant_id == tenant_id).order_by(Action.created_at.desc())
    result = await db.execute(stmt)
    actions = result.scalars().all()

    return [
        ActionResponse(
            id=str(a.id),
            tenantId=str(a.tenant_id),
            title=a.title,
            description=a.description,
            provider=a.provider,
            actionType=a.action_type,
            estimatedMonthlySavings=float(a.estimated_monthly_savings),
            status=a.status,
            proposedBy=a.proposed_by,
            approvedBy=a.approved_by,
            executedAt=a.executed_at,
            createdAt=a.created_at,
        )
        for a in actions
    ]


@router.post("/approve", response_model=ActionResponse)
async def approve_action(
    payload: ApproveActionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session),
):
    """
    CRITICAL SAFETY CONSTRAINT:
    LLM never executes actions — only human owners/admins can approve action execution.
    """
    tenant_id = getattr(request.state, "tenant_id", None)
    user_role = getattr(request.state, "user_role", "viewer")
    user_id = getattr(request.state, "user_id", "admin")

    # Strict RBAC check
    if user_role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only Owners and Admins may approve actions")

    stmt = select(Action).where(Action.id == payload.actionId, Action.tenant_id == tenant_id)
    result = await db.execute(stmt)
    action = result.scalar_one_or_none()

    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    action.status = "approved"
    action.approved_by = user_id
    await db.commit()
    await db.refresh(action)

    return ActionResponse(
        id=str(action.id),
        tenantId=str(action.tenant_id),
        title=action.title,
        description=action.description,
        provider=action.provider,
        actionType=action.action_type,
        estimatedMonthlySavings=float(action.estimated_monthly_savings),
        status=action.status,
        proposedBy=action.proposed_by,
        approvedBy=action.approved_by,
        executedAt=action.executed_at,
        createdAt=action.created_at,
    )
