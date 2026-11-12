from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.deps import get_current_user_claims, get_db_tenant_session
from app.schemas.onboarding import (
    OnboardingStateResponse,
    Step1CompanyRequest,
    Step2ConnectRequest,
    Step2ConnectResponse,
    Step3ConfigureRequest,
    Step4VerifyResponse,
    CompleteWizardResponse,
    ResetWizardResponse,
)
from app.services.onboarding_service import onboarding_service

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.get("/status", response_model=OnboardingStateResponse)
async def get_wizard_status(
    claims: Dict[str, Any] = Depends(get_current_user_claims),
    db: AsyncSession = Depends(get_db_tenant_session),
):
    """Retrieve current wizard onboarding state for the authenticated tenant."""
    tenant_id = claims["tenant_id"]
    state = await onboarding_service.get_or_create_wizard(tenant_id=tenant_id, conn=db)
    return state


@router.post("/step/1", response_model=OnboardingStateResponse)
async def post_step1_company(
    body: Step1CompanyRequest,
    claims: Dict[str, Any] = Depends(get_current_user_claims),
    db: AsyncSession = Depends(get_db_tenant_session),
):
    """Step 1: Set company name, size, and primary use case."""
    tenant_id = claims["tenant_id"]
    try:
        state = await onboarding_service.complete_step1_company(
            tenant_id=tenant_id,
            company_name=body.company_name,
            company_size=body.company_size,
            primary_use_case=body.primary_use_case,
            conn=db,
        )
        return state
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/step/2", response_model=Step2ConnectResponse)
async def post_step2_connect(
    body: Step2ConnectRequest,
    claims: Dict[str, Any] = Depends(get_current_user_claims),
    db: AsyncSession = Depends(get_db_tenant_session),
):
    """Step 2: Connect external API providers with Fernet encryption."""
    tenant_id = claims["tenant_id"]
    try:
        connections = [c.model_dump() for c in body.connections]
        res = await onboarding_service.complete_step2_connect(
            tenant_id=tenant_id,
            connections=connections,
            conn=db,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/step/3", response_model=OnboardingStateResponse)
async def post_step3_configure(
    body: Step3ConfigureRequest,
    claims: Dict[str, Any] = Depends(get_current_user_claims),
    db: AsyncSession = Depends(get_db_tenant_session),
):
    """Step 3: Configure alert phone, Slack/ntfy webhooks, spend cap, quiet hours."""
    tenant_id = claims["tenant_id"]
    try:
        state = await onboarding_service.complete_step3_configure(
            tenant_id=tenant_id,
            alert_phone=body.alert_phone,
            slack_webhook=body.slack_webhook,
            ntfy_topic=body.ntfy_topic,
            spend_cap_usd=body.spend_cap_usd,
            quiet_hours_start=body.quiet_hours_start,
            quiet_hours_end=body.quiet_hours_end,
            conn=db,
        )
        return state
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/step/4", response_model=Step4VerifyResponse)
async def post_step4_verify(
    claims: Dict[str, Any] = Depends(get_current_user_claims),
    db: AsyncSession = Depends(get_db_tenant_session),
):
    """Step 4: Verify connectivity across keys, Slack, and alert phone."""
    tenant_id = claims["tenant_id"]
    res = await onboarding_service.complete_step4_verify(
        tenant_id=tenant_id,
        conn=db,
    )
    return res


@router.post("/complete", response_model=CompleteWizardResponse)
async def post_complete_wizard(
    claims: Dict[str, Any] = Depends(get_current_user_claims),
    db: AsyncSession = Depends(get_db_tenant_session),
):
    """Complete onboarding wizard and enable tenant monitoring."""
    tenant_id = claims["tenant_id"]
    res = await onboarding_service.complete_wizard(
        tenant_id=tenant_id,
        conn=db,
    )
    return res


@router.post("/reset", response_model=ResetWizardResponse)
async def post_reset_wizard(
    claims: Dict[str, Any] = Depends(get_current_user_claims),
    db: AsyncSession = Depends(get_db_tenant_session),
):
    """Reset onboarding wizard state for tenant (development only)."""
    if settings.ENVIRONMENT == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Resetting the onboarding wizard is disabled in production",
        )
    tenant_id = claims["tenant_id"]
    try:
        res = await onboarding_service.reset_wizard(
            tenant_id=tenant_id,
            conn=db,
        )
        return res
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
