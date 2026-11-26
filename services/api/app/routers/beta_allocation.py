import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db_tenant_session, require_role, check_rate_limit
from app.models.smart_rule import SmartRule
from app.services.allocation.recommender import (
    AllocationRecommender,
    ModelSwapRecommendation,
    ScalingRecommendation,
)
from app.services.allocation.rules_engine import (
    SmartRulesEngine,
    SMART_RULE_TEMPLATES,
    RuleEvaluation,
)


def verify_smart_allocation_enabled() -> None:
    if os.getenv("ENABLE_SMART_ALLOCATION", "").lower() != "true":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Smart Allocation is disabled.",
        )


router = APIRouter(
    prefix="/beta/allocation",
    tags=["beta-allocation"],
    dependencies=[Depends(verify_smart_allocation_enabled)],
)

recommender = AllocationRecommender()
rules_engine = SmartRulesEngine()


# ── Pydantic Request & Response Models ──────────────────────────

class CreateSmartRuleRequest(BaseModel):
    name: str = Field(..., min_length=1)
    condition_type: str = Field(...)
    threshold_value: Optional[float] = None
    unit: Optional[str] = None
    scope: Optional[str] = "per_model"
    is_active: bool = True


class UpdateSmartRuleRequest(BaseModel):
    name: Optional[str] = None
    threshold_value: Optional[float] = None
    is_active: Optional[bool] = None


class SmartRuleResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    condition_type: str
    threshold_value: Optional[float] = None
    unit: Optional[str] = None
    scope: Optional[str] = None
    is_active: bool
    last_evaluation_status: Optional[str] = None
    last_evaluation_message: Optional[str] = None
    last_evaluated_at: Optional[str] = None
    created_at: Optional[str] = None


class RecommendationsResponse(BaseModel):
    model_swaps: List[ModelSwapRecommendation]
    scaling: List[ScalingRecommendation]
    total_potential_monthly_savings: float
    generated_at: str


class RuleEvaluationResponse(BaseModel):
    rule_id: Optional[str] = None
    rule_name: str
    condition: str
    actual_value: Any = None
    threshold_value: Any = None
    triggered: bool
    action_recommended: str


# ── Route Handlers ──────────────────────────────────────────────

@router.get("/recommendations", response_model=RecommendationsResponse)
async def get_allocation_recommendations(
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """
    Returns AI model swap optimizations and cost-scaling growth alerts.
    """
    tenant_id = claims["tenant_id"]

    model_swaps = await recommender.generate_model_swap_recommendations(
        tenant_id=tenant_id, lookback_days=30
    )
    scaling = await recommender.generate_scaling_recommendations(
        tenant_id=tenant_id, lookback_days=30
    )

    total_swap_savings = sum(r.monthly_savings for r in model_swaps)
    total_scaling_savings = sum(s.estimated_monthly_impact for s in scaling)
    total_savings = round(total_swap_savings + total_scaling_savings, 2)

    return RecommendationsResponse(
        model_swaps=model_swaps,
        scaling=scaling,
        total_potential_monthly_savings=total_savings,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/rule-templates", response_model=List[Dict[str, Any]])
async def get_rule_templates(
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """
    Returns the catalog of 5 smart spend guardrail templates.
    """
    return rules_engine.get_rule_templates()


@router.post(
    "/smart-rules",
    response_model=SmartRuleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_smart_rule(
    payload: CreateSmartRuleRequest,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("member")),
    _: None = Depends(check_rate_limit),
):
    """
    Creates a smart rule scoped to the authenticated tenant.
    Validates condition_type against templates.
    """
    tenant_id = uuid.UUID(claims["tenant_id"])
    valid_conditions = {t["condition_type"] for t in SMART_RULE_TEMPLATES}
    if payload.condition_type not in valid_conditions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid condition_type '{payload.condition_type}'. Must be one of {valid_conditions}",
        )

    # Determine default unit if omitted
    template = next((t for t in SMART_RULE_TEMPLATES if t["condition_type"] == payload.condition_type), None)
    unit = payload.unit or (template.get("unit") if template else None)

    rule = SmartRule(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        name=payload.name,
        condition_type=payload.condition_type,
        threshold_value=payload.threshold_value,
        unit=unit,
        scope=payload.scope or (template.get("scope") if template else "per_model"),
        is_active=payload.is_active,
        last_evaluation_status="not_triggered",
        last_evaluation_message="Rule created; awaiting first evaluation cycle.",
    )
    db.add(rule)
    await db.flush()

    return SmartRuleResponse(
        id=str(rule.id),
        tenant_id=str(rule.tenant_id),
        name=rule.name,
        condition_type=rule.condition_type,
        threshold_value=rule.threshold_value,
        unit=rule.unit,
        scope=rule.scope,
        is_active=rule.is_active,
        last_evaluation_status=rule.last_evaluation_status,
        last_evaluation_message=rule.last_evaluation_message,
        last_evaluated_at=rule.last_evaluated_at.isoformat() if rule.last_evaluated_at else None,
        created_at=rule.created_at.isoformat() if rule.created_at else None,
    )


@router.get("/smart-rules", response_model=List[SmartRuleResponse])
async def list_smart_rules(
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """
    Returns all active and configured smart rules for tenant.
    """
    tenant_id = uuid.UUID(claims["tenant_id"])
    stmt = (
        select(SmartRule)
        .where(SmartRule.tenant_id == tenant_id)
        .order_by(SmartRule.created_at.desc())
    )
    res = await db.execute(stmt)
    rules = res.scalars().all()

    return [
        SmartRuleResponse(
            id=str(r.id),
            tenant_id=str(r.tenant_id),
            name=r.name,
            condition_type=r.condition_type,
            threshold_value=r.threshold_value,
            unit=r.unit,
            scope=r.scope,
            is_active=r.is_active,
            last_evaluation_status=r.last_evaluation_status,
            last_evaluation_message=r.last_evaluation_message,
            last_evaluated_at=r.last_evaluated_at.isoformat() if r.last_evaluated_at else None,
            created_at=r.created_at.isoformat() if r.created_at else None,
        )
        for r in rules
    ]


@router.post("/evaluate-rules", response_model=List[RuleEvaluationResponse])
async def evaluate_smart_rules(
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """
    Fetches real-time metrics and evaluates all tenant smart rules.
    Persists evaluation outcome to the rules table.
    """
    tenant_id = uuid.UUID(claims["tenant_id"])
    stmt = select(SmartRule).where(
        SmartRule.tenant_id == tenant_id,
        SmartRule.is_active == True,
    )
    res = await db.execute(stmt)
    rules = res.scalars().all()

    # If no active rules yet, evaluate against default templates to give instant preview
    if not rules:
        templates = rules_engine.get_rule_templates()
        preview_rules = [
            {
                "id": None,
                "name": t["name"],
                "condition_type": t["condition_type"],
                "threshold_value": t["default_value"],
            }
            for t in templates
        ]
        evals = rules_engine.evaluate_rules(str(tenant_id), preview_rules)
        return [
            RuleEvaluationResponse(
                rule_id=e.rule_id,
                rule_name=e.rule_name,
                condition=e.condition,
                actual_value=e.actual_value,
                threshold_value=e.threshold_value,
                triggered=e.triggered,
                action_recommended=e.action_recommended,
            )
            for e in evals
        ]

    evals = rules_engine.evaluate_rules(str(tenant_id), rules)
    eval_map = {e.rule_id: e for e in evals if e.rule_id}

    now = datetime.now(timezone.utc)
    for r in rules:
        e = eval_map.get(str(r.id))
        if e:
            r.last_evaluation_status = "triggered" if e.triggered else "not_triggered"
            r.last_evaluation_message = e.action_recommended
            r.last_evaluated_at = now

    await db.flush()

    return [
        RuleEvaluationResponse(
            rule_id=e.rule_id,
            rule_name=e.rule_name,
            condition=e.condition,
            actual_value=e.actual_value,
            threshold_value=e.threshold_value,
            triggered=e.triggered,
            action_recommended=e.action_recommended,
        )
        for e in evals
    ]


@router.patch("/smart-rules/{rule_id}", response_model=SmartRuleResponse)
async def update_smart_rule(
    rule_id: str,
    payload: UpdateSmartRuleRequest,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("member")),
    _: None = Depends(check_rate_limit),
):
    """
    Updates or toggles an active smart rule.
    """
    try:
        rule_uuid = uuid.UUID(rule_id)
        tenant_id = uuid.UUID(claims["tenant_id"])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid rule ID format",
        )

    stmt = select(SmartRule).where(
        SmartRule.id == rule_uuid,
        SmartRule.tenant_id == tenant_id,
    )
    res = await db.execute(stmt)
    rule = res.scalar_one_or_none()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Smart rule not found",
        )

    if payload.name is not None:
        rule.name = payload.name
    if payload.threshold_value is not None:
        rule.threshold_value = payload.threshold_value
    if payload.is_active is not None:
        rule.is_active = payload.is_active

    await db.flush()

    return SmartRuleResponse(
        id=str(rule.id),
        tenant_id=str(rule.tenant_id),
        name=rule.name,
        condition_type=rule.condition_type,
        threshold_value=rule.threshold_value,
        unit=rule.unit,
        scope=rule.scope,
        is_active=rule.is_active,
        last_evaluation_status=rule.last_evaluation_status,
        last_evaluation_message=rule.last_evaluation_message,
        last_evaluated_at=rule.last_evaluated_at.isoformat() if rule.last_evaluated_at else None,
        created_at=rule.created_at.isoformat() if rule.created_at else None,
    )


@router.delete("/smart-rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_smart_rule(
    rule_id: str,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("member")),
    _: None = Depends(check_rate_limit),
):
    """
    Deletes a smart rule.
    """
    try:
        rule_uuid = uuid.UUID(rule_id)
        tenant_id = uuid.UUID(claims["tenant_id"])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid rule ID format",
        )

    stmt = select(SmartRule).where(
        SmartRule.id == rule_uuid,
        SmartRule.tenant_id == tenant_id,
    )
    res = await db.execute(stmt)
    rule = res.scalar_one_or_none()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Smart rule not found",
        )

    await db.delete(rule)
    return None

