import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import httpx
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.security import decode_cirra_token

logger = logging.getLogger("cirra.api.ask")

router = APIRouter(tags=["ask"])
security_bearer = HTTPBearer(auto_error=False)


class AskProxyRequest(BaseModel):
    question: str = Field(..., description="Natural language question about cloud/AI spend")
    tenant_id: Optional[str] = Field(None, description="Tenant UUID. Inferred from auth token if omitted.")
    conversation_history: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list,
        description="Previous conversation turns for context",
    )


class AskProxyResponse(BaseModel):
    answer: str
    sql_used: str
    row_count: int
    columns: List[str]
    rows: List[List[Any]]
    injected_tenant_filter: bool
    execution_time_ms: float


@router.post("/ask", response_model=AskProxyResponse)
async def proxy_ask(
    body: AskProxyRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
):
    """
    Proxy endpoint forwarding natural language cost questions to the Ask Cirra Investigator service.
    Enforces tenant context from JWT claims when authenticated, or allows explicit tenant_id in request.
    """
    tenant_id = body.tenant_id

    # If auth credentials provided, enforce tenant_id from claims
    if credentials:
        try:
            payload = decode_cirra_token(credentials.credentials)
            token_tenant_id = payload.get("tenant_id")
            if token_tenant_id:
                tenant_id = token_tenant_id
        except Exception as e:
            logger.debug(f"Could not parse token in proxy_ask: {e}")

    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id is required either in request body or via authentication token.",
        )

    investigator_endpoint = f"{settings.INVESTIGATOR_URL.rstrip('/')}/ask"
    payload = {
        "question": body.question,
        "tenant_id": tenant_id,
        "conversation_history": body.conversation_history or [],
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(investigator_endpoint, json=payload)
    except httpx.RequestError as exc:
        logger.error(f"Failed to communicate with investigator service at {investigator_endpoint}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Investigator service is currently unavailable at {settings.INVESTIGATOR_URL}",
        )

    if resp.status_code != 200:
        logger.warning(f"Investigator service returned HTTP {resp.status_code}: {resp.text}")
        raise HTTPException(
            status_code=resp.status_code,
            detail=resp.json() if resp.headers.get("content-type") == "application/json" else resp.text,
        )

    return resp.json()
