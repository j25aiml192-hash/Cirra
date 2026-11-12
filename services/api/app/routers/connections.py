import logging
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db_tenant_session, require_role, check_rate_limit
from app.schemas.connection import (
    CreateConnectionRequest,
    UpdateConnectionRequest,
    ConnectionResponse,
    ConnectionTestResponse,
)
from app.services.connections_service import ConnectionsService
from app.middleware.audit import log_audit_event

logger = logging.getLogger("cirra.api.connections")
router = APIRouter(prefix="/connections", tags=["connections"])
connections_service = ConnectionsService()


@router.get("", response_model=List[ConnectionResponse])
async def list_connections(
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """List connections for current tenant. Never returns encrypted_key or key_hash."""
    tenant_id = claims["tenant_id"]
    return await connections_service.list_connections(tenant_id, db)


@router.get("/{connection_id}", response_model=ConnectionResponse)
async def get_connection(
    connection_id: str,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """Retrieve single connection by ID with strict tenant isolation."""
    tenant_id = claims["tenant_id"]
    conns = await connections_service.list_connections(tenant_id, db)
    for c in conns:
        if c["id"] == str(connection_id):
            return c

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": "Connection not found"},
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_connection(
    payload: CreateConnectionRequest,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Create encrypted connection (admin only)."""
    tenant_id = claims["tenant_id"]

    # Extract api_key from payload or credentials dict
    api_key = payload.api_key
    if not api_key and payload.credentials:
        api_key = (
            payload.credentials.get("api_key")
            or payload.credentials.get("access_key_id")
            or payload.credentials.get("token")
            or payload.credentials.get("key")
        )

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "MISSING_KEY", "message": "api_key or valid credentials required"},
        )

    label = payload.label or payload.name or f"{payload.provider.title()} Key"

    try:
        res = await connections_service.add_connection(
            tenant_id=tenant_id,
            provider=payload.provider,
            api_key=api_key,
            label=label,
            monthly_spend_cap=payload.monthly_spend_cap,
            conn=db,
        )
    except ValueError as e:
        err_msg = str(e)
        if "already exists" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "DUPLICATE_KEY", "message": err_msg},
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_CONNECTION", "message": err_msg},
        )

    log_audit_event(
        action="connection_create",
        tenant_id=tenant_id,
        user_id=claims["user_id"],
        resource_type="connection",
        resource_id=res["connection_id"],
        metadata={"provider": res["provider"], "label": res["label"]},
    )

    return res


@router.post("/{connection_id}/test", response_model=ConnectionTestResponse)
async def test_connection_endpoint(
    connection_id: str,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Test connection credentials and return test status."""
    tenant_id = claims["tenant_id"]
    try:
        test_res = await connections_service.test_connection(connection_id, tenant_id, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        )

    log_audit_event(
        action="connection_test",
        tenant_id=tenant_id,
        user_id=claims["user_id"],
        resource_type="connection",
        resource_id=str(connection_id),
        metadata={"status": test_res["status"], "http_code": test_res.get("http_code")},
    )

    return ConnectionTestResponse(
        status=test_res["status"],
        ok=(test_res["status"] == "ok"),
        http_code=test_res.get("http_code"),
        latency_ms=test_res.get("latency_ms"),
        tested_at=test_res.get("tested_at"),
        error=test_res.get("error"),
    )


@router.patch("/{connection_id}", response_model=ConnectionResponse)
async def update_connection_endpoint(
    connection_id: str,
    payload: UpdateConnectionRequest,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Update connection metadata (admin only)."""
    tenant_id = claims["tenant_id"]
    try:
        updated = await connections_service.update_connection(
            api_key_id=connection_id,
            tenant_id=tenant_id,
            label=payload.label,
            monthly_spend_cap=payload.monthly_spend_cap,
            is_monitored=payload.is_monitored,
            conn=db,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        )

    log_audit_event(
        action="connection_update",
        tenant_id=tenant_id,
        user_id=claims["user_id"],
        resource_type="connection",
        resource_id=str(connection_id),
        metadata={"label": payload.label, "monthly_spend_cap": payload.monthly_spend_cap},
    )

    return updated


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection_endpoint(
    connection_id: str,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Soft delete connection (admin only)."""
    tenant_id = claims["tenant_id"]
    success = await connections_service.delete_connection(connection_id, tenant_id, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Connection not found"},
        )

    log_audit_event(
        action="connection_delete",
        tenant_id=tenant_id,
        user_id=claims["user_id"],
        resource_type="connection",
        resource_id=str(connection_id),
        metadata={},
    )
    return None
