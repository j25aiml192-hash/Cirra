import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db_tenant_session, require_role, check_rate_limit
from app.models.connection import Connection
from app.schemas.dashboard import DashboardSummaryResponse
from app.clickhouse.queries import get_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
async def dashboard_summary(
    period: str = Query("30d", pattern="^(30d|90d|6m|12m)$"),
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """
    Get dashboard summary metrics:
    total spend, MoM change, AI spend, top 5 services, top AI keys,
    coverage score, unallocated %, daily velocity, and connection status.
    """
    tenant_id_str = str(claims["tenant_id"])
    tenant_uuid = uuid.UUID(tenant_id_str)

    # Fetch last_synced_at and active connection count from Postgres
    stmt = (
        select(
            func.max(Connection.last_synced_at),
            func.count(Connection.id)
        )
        .where(Connection.tenant_id == tenant_uuid)
    )
    res = await db.execute(stmt)
    row = res.fetchone()
    last_synced = row[0].isoformat() if row and row[0] else None
    active_conns = int(row[1]) if row and row[1] else 0

    summary_data = await get_dashboard_summary(
        tenant_id=tenant_id_str,
        period=period,
        last_synced_at=last_synced,
        active_connections=active_conns,
    )

    return DashboardSummaryResponse(**summary_data)
