import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import httpx
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.security import decode_cirra_token

logger = logging.getLogger("cirra.api.actions")

router = APIRouter(prefix="/actions", tags=["actions"])
security_bearer = HTTPBearer(auto_error=False)


class ProposeActionProxyRequest(BaseModel):
    anomaly_id: Optional[str] = Field(None, description="Linked anomaly UUID")
    action_type: str = Field(..., description="Action type: kill_switch, spend_cap, github_pr, scheduled_shutdown")
    provider: Optional[str] = Field(None, description="Provider name (e.g. openai, anthropic, groq, gemini)")
    target_key_id: Optional[str] = Field(None, description="Target API key ID or resource")
    tenant_id: Optional[str] = Field(None, description="Tenant UUID. Inferred from auth token if omitted.")
    proposal_details: Optional[Dict[str, Any]] = Field(None, description="Extra context for proposal")


class ApproveActionProxyRequest(BaseModel):
    approved_by_user_id: Optional[str] = Field(None, description="User UUID. Inferred from auth token if omitted.")


class RollbackActionProxyRequest(BaseModel):
    reason: Optional[str] = Field("Manual rollback requested", description="Reason for rollback")


def _get_tenant_and_user_from_auth(
    credentials: Optional[HTTPAuthorizationCredentials],
) -> tuple[Optional[str], Optional[str]]:
    if not credentials:
        return None, None
    try:
        payload = decode_cirra_token(credentials.credentials)
        return payload.get("tenant_id"), payload.get("user_id")
    except Exception as e:
        logger.debug("Could not parse token claims: %s", e)
        return None, None


@router.post("/propose", status_code=status.HTTP_201_CREATED)
async def proxy_propose_action(
    body: ProposeActionProxyRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
):
    """Propose an action and run dry-run simulation via Action Engine."""
    tenant_id, _ = _get_tenant_and_user_from_auth(credentials)
    target_tenant_id = body.tenant_id or tenant_id
    if not target_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id is required either in request body or via authentication token.",
        )

    payload = body.model_dump()
    payload["tenant_id"] = target_tenant_id

    endpoint = f"{settings.ACTION_ENGINE_URL.rstrip('/')}/actions/propose"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(endpoint, json=payload)
    except httpx.RequestError as exc:
        logger.error("Failed to connect to Action Engine at %s: %s", endpoint, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Action Engine service is currently unavailable at {settings.ACTION_ENGINE_URL}",
        )

    if resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=resp.status_code,
            detail=resp.json() if resp.headers.get("content-type") == "application/json" else resp.text,
        )
    return resp.json()


@router.post("/{action_id}/approve")
async def proxy_approve_action(
    action_id: str,
    body: Optional[ApproveActionProxyRequest] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
):
    """Approve and immediately execute an action via Action Engine."""
    _, user_id = _get_tenant_and_user_from_auth(credentials)
    approver_id = (body.approved_by_user_id if body else None) or user_id
    if not approver_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="approved_by_user_id is required either in request body or via authentication token.",
        )

    payload = {"approved_by_user_id": approver_id}
    endpoint = f"{settings.ACTION_ENGINE_URL.rstrip('/')}/actions/{action_id}/approve"

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(endpoint, json=payload)
    except httpx.RequestError as exc:
        logger.error("Failed to connect to Action Engine at %s: %s", endpoint, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Action Engine service is currently unavailable at {settings.ACTION_ENGINE_URL}",
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=resp.json() if resp.headers.get("content-type") == "application/json" else resp.text,
        )
    return resp.json()


@router.post("/{action_id}/rollback")
async def proxy_rollback_action(
    action_id: str,
    body: Optional[RollbackActionProxyRequest] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
):
    """Roll back an action via Action Engine."""
    payload = {"reason": body.reason if body else "Manual rollback requested"}
    endpoint = f"{settings.ACTION_ENGINE_URL.rstrip('/')}/actions/{action_id}/rollback"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(endpoint, json=payload)
    except httpx.RequestError as exc:
        logger.error("Failed to connect to Action Engine at %s: %s", endpoint, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Action Engine service is currently unavailable at {settings.ACTION_ENGINE_URL}",
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=resp.json() if resp.headers.get("content-type") == "application/json" else resp.text,
        )
    return resp.json()


@router.get("")
async def proxy_list_actions(
    tenant_id: Optional[str] = Query(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
):
    """List all actions for a tenant via Action Engine."""
    auth_tenant_id, _ = _get_tenant_and_user_from_auth(credentials)
    target_tenant_id = tenant_id or auth_tenant_id
    if not target_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id is required either in query params or via authentication token.",
        )

    endpoint = f"{settings.ACTION_ENGINE_URL.rstrip('/')}/actions"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(endpoint, params={"tenant_id": target_tenant_id})
    except httpx.RequestError as exc:
        logger.error("Failed to connect to Action Engine at %s: %s", endpoint, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Action Engine service is currently unavailable at {settings.ACTION_ENGINE_URL}",
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=resp.json() if resp.headers.get("content-type") == "application/json" else resp.text,
        )
    return resp.json()
