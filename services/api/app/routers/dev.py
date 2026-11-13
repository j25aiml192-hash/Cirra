import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.clickhouse.client import clickhouse_reader, clickhouse_writer
from app.deps import get_current_user_claims

logger = logging.getLogger("cirra.api.dev")

router = APIRouter(prefix="/dev", tags=["dev"])

DEFAULT_BASELINES: Dict[str, float] = {
    "openai": 55.0,
    "groq": 11.5,
    "anthropic": 28.0,
    "vercel": 14.0,
    "render": 33.0,
    "github": 6.0,
}

PROVIDER_META: Dict[str, Dict[str, str]] = {
    "openai": {
        "service_name": "OpenAI API",
        "service_category": "ai",
        "region": "us-east-1",
        "res_id": "res_openai_api",
        "sku": "sku_openai_gpt4o",
        "model": "gpt-4o",
        "api_key_id": "demo_key_sk_prod_001",
        "cost_per_tok": "0.000008",
    },
    "groq": {
        "service_name": "Groq Cloud",
        "service_category": "ai",
        "region": "us-west-2",
        "res_id": "res_groq_lpu",
        "sku": "sku_groq_70b",
        "model": "llama-3.1-70b",
        "api_key_id": "demo_key_groq_prod",
        "cost_per_tok": "0.00000080",
    },
    "anthropic": {
        "service_name": "Anthropic API",
        "service_category": "ai",
        "region": "us-east-1",
        "res_id": "res_anthropic_api",
        "sku": "sku_claude_35_sonnet",
        "model": "claude-3-5-sonnet",
        "api_key_id": "demo_key_ant_prod",
        "cost_per_tok": "0.000006",
    },
    "vercel": {
        "service_name": "Vercel Edge & Compute",
        "service_category": "cloud",
        "region": "global",
        "res_id": "res_vercel_deployments",
        "sku": "sku_vercel_functions",
    },
    "render": {
        "service_name": "Render Cloud Services",
        "service_category": "cloud",
        "region": "us-east-ohio",
        "res_id": "res_render_web_workers",
        "sku": "sku_render_instance",
    },
    "github": {
        "service_name": "GitHub Actions",
        "service_category": "cloud",
        "region": "global",
        "res_id": "res_github_runners",
        "sku": "sku_actions_linux",
    },
}


class SpikeRequest(BaseModel):
    provider: str = Field(default="openai")
    multiplier: float = Field(default=4.5)
    duration_hours: int = Field(default=3)
    tenant_id: Optional[str] = Field(default="00000000-0000-0000-0000-000000000001")


@router.post("/spike")
async def generate_spike(
    payload: SpikeRequest,
    claims: Dict[str, Any] = Depends(get_current_user_claims),
):
    """
    Simulates a sudden cloud or AI billing spike by injecting realistic
    high-spend facts into ClickHouse and triggering Sentinel's detection cycle.
    """
    if str(settings.ENVIRONMENT).lower() == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dev endpoint disabled in production",
        )

    tenant_id = payload.tenant_id or claims.get("tenant_id") or "00000000-0000-0000-0000-000000000001"
    provider = payload.provider.lower().strip()
    multiplier = float(payload.multiplier)
    duration_hours = max(1, int(payload.duration_hours))

    # Determine baseline daily cost
    baseline_daily = DEFAULT_BASELINES.get(provider, 20.0)
    try:
        ch = clickhouse_reader.get_client()
        query = """
        SELECT avg(daily_sum) FROM (
            SELECT toDate(charge_period_start) as d, sum(billed_cost) as daily_sum
            FROM cost_facts
            WHERE tenant_id = %(tenant_id)s AND provider = %(provider)s
              AND charge_period_start >= now() - INTERVAL 14 DAY
            GROUP BY d
        )
        """
        res = ch.query(query, parameters={"tenant_id": tenant_id, "provider": provider})
        if res.result_rows and res.result_rows[0][0] is not None and float(res.result_rows[0][0]) > 0:
            baseline_daily = float(res.result_rows[0][0])
    except Exception as e:
        logger.warning("Failed to calculate live baseline from ClickHouse: %s", e)

    hourly_baseline = baseline_daily / 24.0
    hourly_spike = hourly_baseline * multiplier
    total_baseline = hourly_baseline * duration_hours
    total_spike = hourly_spike * duration_hours

    now = datetime.now(timezone.utc)
    meta = PROVIDER_META.get(
        provider,
        {
            "service_name": f"{provider.capitalize()} Service",
            "service_category": "cloud",
            "region": "us-east-1",
            "res_id": f"res_{provider}_dev",
            "sku": f"sku_{provider}_standard",
        },
    )

    cost_facts_rows = []
    ai_facts_rows = []

    for i in range(duration_hours):
        p_start = now - timedelta(hours=duration_hours - i)
        p_end = p_start + timedelta(hours=1)
        cost_val = Decimal(str(round(hourly_spike, 6)))
        row_hash = f"spike_cf_{tenant_id[:8]}_{provider}_{int(p_start.timestamp())}_{i}"

        cost_facts_rows.append([
            tenant_id,
            p_start,
            p_end,
            cost_val,
            cost_val,
            "USD",
            provider,
            meta.get("service_name", "Service"),
            meta.get("service_category", "cloud"),
            meta.get("region", "us-east-1"),
            meta.get("res_id", "res_spike"),
            meta.get("sku", "sku_spike"),
            {"spike_generated": "true", "note": "spike_generated=true"},
            "engineering",
            "core_app",
            "spike_test",
            "allocated",
            row_hash,
            1,
            now,
        ])

        if provider in ("openai", "groq", "anthropic"):
            model = meta.get("model", "default-model")
            key_id = meta.get("api_key_id", "demo_key")
            cost_per_tok = float(meta.get("cost_per_tok", "0.000002"))
            total_tokens = int(float(cost_val) / cost_per_tok) if cost_per_tok > 0 else 10000
            in_tok = int(total_tokens * 0.75)
            out_tok = int(total_tokens * 0.25)
            ai_row_hash = f"spike_ai_{tenant_id[:8]}_{provider}_{int(p_start.timestamp())}_{i}"

            ai_facts_rows.append([
                tenant_id,
                p_start,
                provider,
                model,
                key_id,
                in_tok,
                out_tok,
                0,
                cost_val,
                "engineering",
                "core_app",
                "spike_test",
                ai_row_hash,
                1,
                now,
            ])

    # Insert into ClickHouse
    cost_columns = [
        "tenant_id", "charge_period_start", "charge_period_end",
        "billed_cost", "effective_cost", "currency", "provider",
        "service_name", "service_category", "region", "resource_id",
        "sku_id", "tags", "allocated_team", "allocated_customer",
        "allocated_feature", "allocation_method", "row_hash",
        "version", "inserted_at",
    ]
    clickhouse_writer.insert("cost_facts", cost_facts_rows, column_names=cost_columns)

    if ai_facts_rows:
        ai_columns = [
            "tenant_id", "ts", "provider", "model", "api_key_id",
            "input_tokens", "output_tokens", "cached_tokens", "cost_usd",
            "team_tag", "customer_tag", "feature_tag", "row_hash",
            "version", "inserted_at",
        ]
        clickhouse_writer.insert("ai_usage_facts", ai_facts_rows, column_names=ai_columns)

    # Trigger Sentinel immediate anomaly detection
    detection_triggered = False
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{settings.SENTINEL_URL}/run-detection",
                headers={"X-Internal-Service": settings.INTERNAL_SERVICE_KEY},
                json={"tenant_id": tenant_id, "force": True},
            )
            if resp.status_code in (200, 201, 202):
                detection_triggered = True
    except Exception as e:
        logger.warning("Could not trigger Sentinel detection: %s", e)

    return {
        "rows_inserted": duration_hours,
        "spike_cost_usd": round(total_spike, 2),
        "baseline_cost_usd": round(total_baseline, 2),
        "multiplier": multiplier,
        "detection_triggered": detection_triggered,
        "message": "Spike generated. Anomaly detection running.",
    }


@router.get("/spike/providers")
async def get_spike_providers(
    claims: Dict[str, Any] = Depends(get_current_user_claims),
):
    """
    Returns available providers with their live baseline daily spend.
    """
    if str(settings.ENVIRONMENT).lower() == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dev endpoint disabled in production",
        )

    tenant_id = claims.get("tenant_id") or "00000000-0000-0000-0000-000000000001"
    baselines: Dict[str, float] = dict(DEFAULT_BASELINES)

    try:
        ch = clickhouse_reader.get_client()
        query = """
        SELECT provider, round(avg(daily_cost), 2) as avg_daily
        FROM (
            SELECT provider, toDate(charge_period_start) as d, sum(billed_cost) as daily_cost
            FROM cost_facts
            WHERE tenant_id = %(tenant_id)s
              AND charge_period_start >= now() - INTERVAL 14 DAY
            GROUP BY provider, d
        )
        GROUP BY provider
        """
        res = ch.query(query, parameters={"tenant_id": tenant_id})
        for row in res.result_rows:
            p = str(row[0]).lower()
            val = float(row[1]) if row[1] is not None else DEFAULT_BASELINES.get(p, 20.0)
            baselines[p] = val
    except Exception as e:
        logger.warning("Failed to fetch live provider baselines: %s", e)

    result_list = [
        {"name": name, "baseline_daily_usd": round(baselines[name], 2)}
        for name in DEFAULT_BASELINES.keys()
    ]

    return {"providers": result_list}

