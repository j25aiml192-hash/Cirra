import os
import uuid
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgrespassword@localhost:5432/cirra"
)

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

SENSITIVE_PATTERNS = [
    re.compile(r"sk-[a-zA-Z0-9_\-]{20,}", re.IGNORECASE),
    re.compile(r"AKIA[0-9A-Z]{16}", re.IGNORECASE),
    re.compile(r"bearer\s+[a-zA-Z0-9_\-\.]+", re.IGNORECASE),
    re.compile(r"password['\"]?\s*[:=]\s*['\"]?[^\s'\"]+", re.IGNORECASE),
]


def sanitize_error_message(error: Optional[str]) -> Optional[str]:
    """Sanitize error messages to ensure no credentials, tokens, or raw secrets are stored in last_error."""
    if not error:
        return None
    msg = str(error)
    for pat in SENSITIVE_PATTERNS:
        msg = pat.sub("[REDACTED_CREDENTIAL]", msg)
    # Truncate to reasonable safe summary (avoid storing full HTML/provider dump)
    if len(msg) > 500:
        msg = msg[:497] + "..."
    return msg


async def get_connection_by_id(connection_id: str) -> Optional[Dict[str, Any]]:
    """Fetch connection row by ID. Strictly resolves tenant_id from database row."""
    try:
        conn_uuid = uuid.UUID(str(connection_id))
    except ValueError:
        return None

    query = text("""
        SELECT id, tenant_id, provider, name, credentials_encrypted, status, last_synced_at, last_error
        FROM connections
        WHERE id = :connection_id
    """)

    async with async_session() as session:
        result = await session.execute(query, {"connection_id": conn_uuid})
        row = result.fetchone()
        if not row:
            return None
        return {
            "id": str(row[0]),
            "tenant_id": str(row[1]),
            "provider": row[2],
            "name": row[3],
            "credentials_encrypted": row[4],
            "status": row[5],
            "last_synced_at": row[6],
            "last_error": row[7],
        }


async def update_connection_status(
    connection_id: str,
    status: str,
    last_synced_at: Optional[datetime] = None,
    last_error: Optional[str] = None,
) -> None:
    """Update connection status, last_synced_at, and sanitized last_error."""
    try:
        conn_uuid = uuid.UUID(str(connection_id))
    except ValueError:
        return

    safe_error = sanitize_error_message(last_error)

    query = text("""
        UPDATE connections
        SET status = :status,
            last_synced_at = COALESCE(:last_synced_at, last_synced_at),
            last_error = :last_error
        WHERE id = :connection_id
    """)

    async with async_session() as session:
        await session.execute(
            query,
            {
                "connection_id": conn_uuid,
                "status": status,
                "last_synced_at": last_synced_at,
                "last_error": safe_error,
            }
        )
        await session.commit()


async def get_all_active_connections() -> List[Dict[str, Any]]:
    """Retrieve all connections for periodic sync scheduling."""
    query = text("""
        SELECT id, tenant_id, provider, status
        FROM connections
        WHERE status != 'disabled'
    """)

    async with async_session() as session:
        result = await session.execute(query)
        rows = result.fetchall()
        return [
            {"id": str(r[0]), "tenant_id": str(r[1]), "provider": r[2], "status": r[3]}
            for r in rows
        ]
