import re
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db_tenant_session, require_role, check_rate_limit
from app.models.allocation_rule import AllocationRule
from app.schemas.allocation import (
    AllocationRuleResponse,
    CreateAllocationRuleRequest,
    UpdateAllocationRuleRequest,
    PreviewAllocationRuleRequest,
    PreviewAllocationRuleResponse,
    AllocationCoverageResponse,
    SuggestedRuleResponse,
)
from app.middleware.audit import log_audit_event
from app.services.ingest_dispatcher import dispatch_reallocation
from app.clickhouse.queries import get_allocation_coverage, preview_allocation_rule

router = APIRouter(prefix="/allocation", tags=["allocation"])

MAX_REGEX_LEN = 100
DANGEROUS_PATTERNS = [
    re.compile(r"\(.*\+.*\)\+"),
    re.compile(r"\(.*\*.*\)\*"),
    re.compile(r"\(\.\*\)\+"),
]


def validate_rule_pattern(match_type: str, match_value: str) -> None:
    if len(match_value) > MAX_REGEX_LEN:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Pattern length exceeds maximum allowed limit of {MAX_REGEX_LEN} characters.",
        )
    if match_type.lower() in ("regex", "name_regex"):
        for dang in DANGEROUS_PATTERNS:
            if dang.search(match_value):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Rejected potentially catastrophic regex pattern (ReDoS risk).",
                )
        try:
            re.compile(match_value)
        except re.error as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid regular expression syntax: {e}",
            )


@router.get("/rules", response_model=List[AllocationRuleResponse])
async def list_allocation_rules(
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """List allocation rules for current tenant ordered by priority ASC."""
    tenant_id = uuid.UUID(claims["tenant_id"])
    stmt = (
        select(AllocationRule)
        .where(AllocationRule.tenant_id == tenant_id)
        .order_by(AllocationRule.priority.asc())
    )
    result = await db.execute(stmt)
    rules = result.scalars().all()

    return [
        AllocationRuleResponse(
            id=str(r.id),
            priority=r.priority,
            name=r.name,
            match_type=r.match_type,
            match_value=r.match_value,
            assign_team=r.assign_team,
            assign_customer=r.assign_customer,
            assign_feature=r.assign_feature,
            spendAttributed=0.0,
            created_at=r.created_at.isoformat() if r.created_at else None,
        )
        for r in rules
    ]


@router.post("/rules", response_model=AllocationRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_allocation_rule(
    payload: CreateAllocationRuleRequest,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("member")),
    _: None = Depends(check_rate_limit),
):
    """Create allocation rule (admin or member)."""
    tenant_id = uuid.UUID(claims["tenant_id"])
    validate_rule_pattern(payload.match_type, payload.match_value)

    new_rule = AllocationRule(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        priority=payload.priority,
        name=payload.name,
        match_type=payload.match_type,
        match_value=payload.match_value,
        assign_team=payload.assign_team,
        assign_customer=payload.assign_customer,
        assign_feature=payload.assign_feature,
    )
    db.add(new_rule)
    await db.flush()

    log_audit_event(
        action="allocation_rule_create",
        tenant_id=claims["tenant_id"],
        user_id=claims["user_id"],
        resource_type="allocation_rule",
        resource_id=str(new_rule.id),
        metadata={"priority": new_rule.priority, "match_type": new_rule.match_type},
    )

    # Trigger background spend reallocation
    dispatch_reallocation(str(tenant_id))

    return AllocationRuleResponse(
        id=str(new_rule.id),
        priority=new_rule.priority,
        name=new_rule.name,
        match_type=new_rule.match_type,
        match_value=new_rule.match_value,
        assign_team=new_rule.assign_team,
        assign_customer=new_rule.assign_customer,
        assign_feature=new_rule.assign_feature,
        spendAttributed=0.0,
        created_at=new_rule.created_at.isoformat() if new_rule.created_at else None,
    )


@router.patch("/rules/{rule_id}", response_model=AllocationRuleResponse)
async def update_allocation_rule(
    rule_id: str,
    payload: UpdateAllocationRuleRequest,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("member")),
    _: None = Depends(check_rate_limit),
):
    """Update allocation rule (admin or member)."""
    try:
        rule_uuid = uuid.UUID(rule_id)
        tenant_id = uuid.UUID(claims["tenant_id"])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_UUID", "message": "Invalid rule ID format"},
        )

    stmt = select(AllocationRule).where(
        AllocationRule.id == rule_uuid,
        AllocationRule.tenant_id == tenant_id,
    )
    res = await db.execute(stmt)
    rule = res.scalar_one_or_none()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Allocation rule not found"},
        )

    if payload.match_value is not None or payload.match_type is not None:
        m_type = payload.match_type or rule.match_type
        m_val = payload.match_value or rule.match_value
        validate_rule_pattern(m_type, m_val)

    if payload.priority is not None:
        rule.priority = payload.priority
    if payload.name is not None:
        rule.name = payload.name
    if payload.match_type is not None:
        rule.match_type = payload.match_type
    if payload.match_value is not None:
        rule.match_value = payload.match_value
    if payload.assign_team is not None:
        rule.assign_team = payload.assign_team
    if payload.assign_customer is not None:
        rule.assign_customer = payload.assign_customer
    if payload.assign_feature is not None:
        rule.assign_feature = payload.assign_feature

    log_audit_event(
        action="allocation_rule_update",
        tenant_id=claims["tenant_id"],
        user_id=claims["user_id"],
        resource_type="allocation_rule",
        resource_id=str(rule.id),
        metadata={"priority": rule.priority, "match_type": rule.match_type},
    )

    dispatch_reallocation(str(tenant_id))

    return AllocationRuleResponse(
        id=str(rule.id),
        priority=rule.priority,
        name=rule.name,
        match_type=rule.match_type,
        match_value=rule.match_value,
        assign_team=rule.assign_team,
        assign_customer=rule.assign_customer,
        assign_feature=rule.assign_feature,
        spendAttributed=0.0,
        created_at=rule.created_at.isoformat() if rule.created_at else None,
    )


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_allocation_rule(
    rule_id: str,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Delete allocation rule (admin only)."""
    try:
        rule_uuid = uuid.UUID(rule_id)
        tenant_id = uuid.UUID(claims["tenant_id"])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_UUID", "message": "Invalid rule ID format"},
        )

    stmt = select(AllocationRule).where(
        AllocationRule.id == rule_uuid,
        AllocationRule.tenant_id == tenant_id,
    )
    res = await db.execute(stmt)
    rule = res.scalar_one_or_none()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Allocation rule not found"},
        )

    await db.delete(rule)

    log_audit_event(
        action="allocation_rule_delete",
        tenant_id=claims["tenant_id"],
        user_id=claims["user_id"],
        resource_type="allocation_rule",
        resource_id=str(rule_uuid),
        metadata={},
    )

    dispatch_reallocation(str(tenant_id))
    return None


@router.post("/rules/preview", response_model=PreviewAllocationRuleResponse)
async def preview_rule(
    payload: PreviewAllocationRuleRequest,
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """Preview rule match against unallocated facts without writing."""
    validate_rule_pattern(payload.match_type, payload.match_value)
    data = preview_allocation_rule(
        tenant_id=str(claims["tenant_id"]),
        match_type=payload.match_type,
        match_value=payload.match_value,
    )
    return PreviewAllocationRuleResponse(**data)


@router.get("/coverage", response_model=AllocationCoverageResponse)
async def coverage_overview(
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """Attribution coverage percentage by cost, breakdown, and top unallocated services."""
    data = get_allocation_coverage(tenant_id=str(claims["tenant_id"]))
    return AllocationCoverageResponse(**data)


@router.get("/suggestions", response_model=List[SuggestedRuleResponse])
async def list_suggestions(
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """Stub returning empty list of ML suggestions (ML comes in a later sprint)."""
    return []
