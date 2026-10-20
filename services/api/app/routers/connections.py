import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_db_tenant_session, require_role, check_rate_limit
from app.models.connection import Connection
from app.schemas.connection import (
    CreateConnectionRequest,
    ConnectionResponse,
    ConnectionTestResponse,
)
from app.core.encryption import encrypt_credentials, decrypt_credentials
from app.middleware.audit import log_audit_event
from app.services.tester import ProviderTester

router = APIRouter(prefix="/connections", tags=["connections"])


@router.get("", response_model=List[ConnectionResponse])
async def list_connections(
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """List connections for current tenant. Never returns credentials."""
    tenant_id = uuid.UUID(claims["tenant_id"])
    stmt = (
        select(Connection)
        .where(Connection.tenant_id == tenant_id)
        .order_by(Connection.created_at.desc())
    )
    result = await db.execute(stmt)
    connections = result.scalars().all()

    return [
        ConnectionResponse(
            id=str(c.id),
            tenant_id=str(c.tenant_id),
            name=c.name,
            provider=c.provider,
            status=c.status,
            last_synced_at=c.last_synced_at,
            last_error=c.last_error,
            created_at=c.created_at,
        )
        for c in connections
    ]


@router.get("/{connection_id}", response_model=ConnectionResponse)
async def get_connection(
    connection_id: str,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """Retrieve single connection by ID with strict tenant isolation."""
    try:
        conn_uuid = uuid.UUID(connection_id)
        tenant_id = uuid.UUID(claims["tenant_id"])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_UUID", "message": "Invalid connection ID format"}
        )

    stmt = select(Connection).where(
        Connection.id == conn_uuid,
        Connection.tenant_id == tenant_id
    )
    result = await db.execute(stmt)
    conn = result.scalar_one_or_none()

    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Connection not found"}
        )

    return ConnectionResponse(
        id=str(conn.id),
        tenant_id=str(conn.tenant_id),
        name=conn.name,
        provider=conn.provider,
        status=conn.status,
        last_synced_at=conn.last_synced_at,
        last_error=conn.last_error,
        created_at=conn.created_at,
    )


@router.post("", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_connection(
    payload: CreateConnectionRequest,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Create encrypted connection (admin only)."""
    tenant_id = uuid.UUID(claims["tenant_id"])
    encrypted_creds = encrypt_credentials(payload.credentials)

    new_conn = Connection(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        name=payload.name,
        provider=payload.provider.lower(),
        credentials_encrypted=encrypted_creds,
        status="pending",
    )
    db.add(new_conn)
    await db.flush()

    # Audit log creation without credentials
    log_audit_event(
        action="connection_create",
        tenant_id=claims["tenant_id"],
        user_id=claims["user_id"],
        resource_type="connection",
        resource_id=str(new_conn.id),
        metadata={"name": new_conn.name, "provider": new_conn.provider},
    )

    return ConnectionResponse(
        id=str(new_conn.id),
        tenant_id=str(new_conn.tenant_id),
        name=new_conn.name,
        provider=new_conn.provider,
        status=new_conn.status,
        last_synced_at=new_conn.last_synced_at,
        last_error=new_conn.last_error,
        created_at=new_conn.created_at,
    )


@router.post("/{connection_id}/test", response_model=ConnectionTestResponse)
async def test_connection(
    connection_id: str,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Test connection credentials and update status."""
    try:
        conn_uuid = uuid.UUID(connection_id)
        tenant_id = uuid.UUID(claims["tenant_id"])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_UUID", "message": "Invalid connection ID format"}
        )

    stmt = select(Connection).where(
        Connection.id == conn_uuid,
        Connection.tenant_id == tenant_id
    )
    result = await db.execute(stmt)
    conn = result.scalar_one_or_none()

    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Connection not found"}
        )

    # Decrypt credentials in memory only
    creds = decrypt_credentials(conn.credentials_encrypted)
    test_result = await ProviderTester.test(conn.provider, creds)

    conn.last_synced_at = datetime.now(timezone.utc)
    if test_result["ok"]:
        conn.status = "connected"
        conn.last_error = None
    else:
        conn.status = "error"
        conn.last_error = test_result.get("error")

    # Audit log test event
    log_audit_event(
        action="connection_test",
        tenant_id=claims["tenant_id"],
        user_id=claims["user_id"],
        resource_type="connection",
        resource_id=str(conn.id),
        metadata={"ok": test_result["ok"], "error": test_result.get("error")},
    )

    return ConnectionTestResponse(
        ok=test_result["ok"],
        error=test_result.get("error"),
    )


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(
    connection_id: str,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Delete a connection (admin only)."""
    try:
        conn_uuid = uuid.UUID(connection_id)
        tenant_id = uuid.UUID(claims["tenant_id"])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_UUID", "message": "Invalid connection ID format"}
        )

    stmt = select(Connection).where(
        Connection.id == conn_uuid,
        Connection.tenant_id == tenant_id
    )
    result = await db.execute(stmt)
    conn = result.scalar_one_or_none()

    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Connection not found"}
        )

    await db.delete(conn)

    log_audit_event(
        action="connection_delete",
        tenant_id=claims["tenant_id"],
        user_id=claims["user_id"],
        resource_type="connection",
        resource_id=str(conn.id),
        metadata={"name": conn.name, "provider": conn.provider},
    )

    return None
