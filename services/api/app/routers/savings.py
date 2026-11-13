import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import httpx

from app.core.config import settings
from app.core.security import decode_cirra_token

logger = logging.getLogger("cirra.api.savings")

router = APIRouter(prefix="/savings", tags=["savings"])
security_bearer = HTTPBearer(auto_error=False)


def _get_tenant_from_auth(credentials: Optional[HTTPAuthorizationCredentials]) -> Optional[str]:
    if not credentials:
        return None
    try:
        payload = decode_cirra_token(credentials.credentials)
        return payload.get("tenant_id")
    except Exception as e:
        logger.debug("Could not parse token claims: %s", e)
        return None


@router.get("")
async def proxy_list_savings(
    tenant_id: Optional[str] = Query(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
):
    """
    List all savings entries and calculated totals for a tenant via Action Engine:
    {
      identified_total: Decimal,
      approved_total: Decimal,
      verified_total: Decimal,
      entries: List[SavingsEntry]
    }
    """
    auth_tenant_id = _get_tenant_from_auth(credentials)
    target_tenant_id = tenant_id or auth_tenant_id
    if not target_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id is required either in query params or via authentication token.",
        )

    endpoint = f"{settings.ACTION_ENGINE_URL.rstrip('/')}/savings"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(endpoint, params={"tenant_id": target_tenant_id})
        if resp.status_code == 200:
            return resp.json()
        return {
            "identified_total": 0.0,
            "approved_total": 0.0,
            "verified_total": 0.0,
            "entries": [],
        }
    except httpx.RequestError as exc:
        logger.warning("Action Engine unavailable at %s, returning default savings: %s", endpoint, exc)
        return {
            "identified_total": 0.0,
            "approved_total": 0.0,
            "verified_total": 0.0,
            "entries": [],
        }
