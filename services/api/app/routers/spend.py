from datetime import datetime
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps import require_role, check_rate_limit
from app.schemas.spend import CloudSpendResponse, AiSpendResponse
from app.clickhouse.enums import (
    CloudGroupBy,
    CloudSortBy,
    AiGroupBy,
    SortOrder,
    ALLOWED_CLOUD_GROUP_BY,
    ALLOWED_CLOUD_SORT_BY,
    ALLOWED_AI_GROUP_BY,
    ALLOWED_SORT_ORDERS,
)
from app.clickhouse.queries import get_cloud_spend, get_ai_spend

router = APIRouter(prefix="/spend", tags=["spend"])


@router.get("/cloud", response_model=CloudSpendResponse)
async def spend_cloud(
    provider: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    team: Optional[str] = Query(None),
    account: Optional[str] = Query(None),
    period: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    group_by: str = Query("service"),
    sort_by: str = Query("spend"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """
    Cloud spend breakdown filtered by provider, service, region, team, account, date range.
    Supports group_by, pagination, and returns total spend across all matching records.
    """
    # Strict allow-list validation returning 422
    if group_by not in ALLOWED_CLOUD_GROUP_BY:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid group_by '{group_by}'. Allowed: {sorted(list(ALLOWED_CLOUD_GROUP_BY))}",
        )
    if sort_by not in ALLOWED_CLOUD_SORT_BY:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid sort_by '{sort_by}'. Allowed: {sorted(list(ALLOWED_CLOUD_SORT_BY))}",
        )
    if sort_order.lower() not in ALLOWED_SORT_ORDERS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid sort_order '{sort_order}'. Allowed: {sorted(list(ALLOWED_SORT_ORDERS))}",
        )

    try:
        data = get_cloud_spend(
            tenant_id=str(claims["tenant_id"]),
            provider=provider,
            service=service,
            region=region,
            team=team,
            account_id=account,
            period=period,
            start_date=start_date,
            end_date=end_date,
            group_by=group_by,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
        )
        return CloudSpendResponse(**data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )


@router.get("/ai", response_model=AiSpendResponse)
async def spend_ai(
    provider: Optional[str] = Query(None),
    model: Optional[str] = Query(None),
    api_key_id: Optional[str] = Query(None),
    team: Optional[str] = Query(None),
    customer: Optional[str] = Query(None),
    period: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    group_by: str = Query("model"),
    sort_by: str = Query("spend"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """
    AI usage breakdown by provider, model, key, team, customer.
    Returns token totals, cache rates, model costs, and pagination.
    """
    if group_by not in ALLOWED_AI_GROUP_BY:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid group_by '{group_by}'. Allowed: {sorted(list(ALLOWED_AI_GROUP_BY))}",
        )
    if sort_order.lower() not in ALLOWED_SORT_ORDERS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid sort_order '{sort_order}'. Allowed: {sorted(list(ALLOWED_SORT_ORDERS))}",
        )

    try:
        data = get_ai_spend(
            tenant_id=str(claims["tenant_id"]),
            provider=provider,
            model=model,
            api_key_id=api_key_id,
            team=team,
            customer=customer,
            period=period,
            start_date=start_date,
            end_date=end_date,
            group_by=group_by,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
        )
        return AiSpendResponse(**data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
