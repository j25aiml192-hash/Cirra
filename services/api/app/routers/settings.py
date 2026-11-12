import logging
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db_tenant_session, require_role, check_rate_limit
from app.schemas.settings import (
    UpdateSettingsRequest,
    SettingsResponse,
    TestWebhookResponse,
    TestCallResponse,
)
from app.services.settings_service import SettingsService
from app.middleware.audit import log_audit_event

logger = logging.getLogger("cirra.api.settings")
router = APIRouter(prefix="/settings", tags=["settings"])
settings_service = SettingsService()


@router.get("", response_model=SettingsResponse)
async def get_settings_endpoint(
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """Retrieve tenant settings with masked webhook URLs."""
    tenant_id = claims["tenant_id"]
    return await settings_service.get_settings(tenant_id, db, mask_urls=True)


@router.patch("", response_model=SettingsResponse)
async def update_settings_endpoint(
    payload: UpdateSettingsRequest,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Update tenant settings (admin only)."""
    tenant_id = claims["tenant_id"]
    # Only include fields explicitly set in payload
    updates = payload.model_dump(exclude_unset=True)

    try:
        updated = await settings_service.update_settings(tenant_id, updates, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_SETTINGS", "message": str(e)},
        )

    log_audit_event(
        action="settings_update",
        tenant_id=tenant_id,
        user_id=claims["user_id"],
        resource_type="tenant_settings",
        resource_id=str(updated.get("id")),
        metadata={"fields_updated": list(updates.keys())},
    )

    return updated


@router.post("/test/slack", response_model=TestWebhookResponse)
async def test_slack_endpoint(
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Test Slack webhook URL integration."""
    tenant_id = claims["tenant_id"]
    try:
        res = await settings_service.test_slack(tenant_id, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_CONFIGURATION", "message": str(e)},
        )
    return res


@router.post("/test/ntfy", response_model=TestWebhookResponse)
async def test_ntfy_endpoint(
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Test ntfy topic URL integration."""
    tenant_id = claims["tenant_id"]
    try:
        res = await settings_service.test_ntfy(tenant_id, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_CONFIGURATION", "message": str(e)},
        )
    return res


@router.post("/test/call", response_model=TestCallResponse)
async def test_call_endpoint(
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Trigger a test voice alert call."""
    tenant_id = claims["tenant_id"]
    try:
        res = await settings_service.trigger_test_call(tenant_id, db)
    except Exception as e:
        logger.error(f"Failed to trigger test voice call: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "CALL_TRIGGER_FAILED", "message": str(e)},
        )
    return res
