import hashlib
import logging
import os
import random
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text

from app.clickhouse.client import clickhouse_reader, clickhouse_writer
from app.core.config import settings
from app.core.database import async_session_factory

SENTINEL_URL = os.getenv("SENTINEL_URL", "http://localhost:8002")

logger = logging.getLogger("cirra.api.inject")

router = APIRouter(tags=["inject"])

TENANT_ZERO_ID = "00000000-0000-0000-0000-000000000001"


async def _trigger_sentinel_run_now() -> bool:
    """Trigger Sentinel on-demand detection cycle."""
    sentinel_url = (getattr(settings, "SENTINEL_URL", None) or SENTINEL_URL).rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{sentinel_url}/detect/run-now")
            if resp.status_code in (200, 201, 202):
                logger.info("Triggered Sentinel /detect/run-now successfully.")
                return True
            else:
                logger.warning("Sentinel /detect/run-now returned HTTP %s: %s", resp.status_code, resp.text)
                return False
    except Exception as exc:
        logger.warning("Could not reach Sentinel /detect/run-now: %s", exc)
        return False


# ─── SCENARIO A: API Key Leaked ───────────────────────────────────────────────

@router.post("/leaked-key")
async def inject_leaked_key():
    """
    Simulates: A dormant API key suddenly made 847 requests in the last 2 hours.
    This is the '$30K weekend' catastrophic pattern.
    """
    now = datetime.now(timezone.utc)
    tenant_id = TENANT_ZERO_ID
    provider = "openai"
    model = "gpt-4o"
    api_key_id = "demo_leaked_key_exposed_001"

    total_cost = Decimal("0.0")
    ai_facts_rows = []

    for i in range(847):
        cost_val = Decimal(str(round(random.uniform(0.80, 1.20), 4)))
        total_cost += cost_val
        mins_ago = random.uniform(1.0, 120.0)
        ts = now - timedelta(minutes=mins_ago)
        row_hash = hashlib.sha256(
            f"{tenant_id}:{provider}:{api_key_id}:{ts.isoformat()}:{i}:{uuid.uuid4()}".encode()
        ).hexdigest()[:32]

        ai_facts_rows.append([
            tenant_id,
            ts,
            provider,
            model,
            api_key_id,
            random.randint(800, 1500),  # input_tokens
            random.randint(200, 500),   # output_tokens
            0,                          # cached_tokens
            cost_val,                   # cost_usd
            "security_demo",            # team_tag
            "prod_app",                 # customer_tag
            "leaked_key_scenario",      # feature_tag
            row_hash,
            1,                          # version
            now,                        # inserted_at
        ])

    ai_columns = [
        "tenant_id", "ts", "provider", "model", "api_key_id",
        "input_tokens", "output_tokens", "cached_tokens", "cost_usd",
        "team_tag", "customer_tag", "feature_tag", "row_hash",
        "version", "inserted_at",
    ]

    # Batch insert 100 at a time into ClickHouse
    batch_size = 100
    for b_start in range(0, len(ai_facts_rows), batch_size):
        batch = ai_facts_rows[b_start : b_start + batch_size]
        clickhouse_writer.insert("ai_usage_facts", batch, column_names=ai_columns)

    logger.info("Inserted %d rows into ClickHouse ai_usage_facts for %s", len(ai_facts_rows), api_key_id)

    # Update or insert into Postgres api_keys table if present
    try:
        async with async_session_factory() as session:
            await session.execute(
                text("SELECT set_config('app.tenant_id', :tenant_id, true)"),
                {"tenant_id": tenant_id},
            )
            await session.execute(
                text("""
                    INSERT INTO api_keys (
                        id, tenant_id, provider, label, is_monitored, status, name, key_hash, prefix, created_at
                    ) VALUES (
                        gen_random_uuid(), CAST(:tenant_id AS uuid), 'openai', 'Exposed Production Key',
                        true, 'active', :api_key_id, 'hash_demo_leak_001', 'sk-demo', now() - interval '30 days'
                    )
                    ON CONFLICT DO NOTHING;
                """),
                {"tenant_id": tenant_id, "api_key_id": api_key_id},
            )
            await session.commit()
    except Exception as exc:
        logger.warning("Postgres api_keys note: %s", exc)

    detection_triggered = await _trigger_sentinel_run_now()

    return {
        "scenario": "leaked_key",
        "injected_rows": 847,
        "total_cost_injected": float(round(total_cost, 2)),
        "api_key_id": api_key_id,
        "detection_triggered": detection_triggered,
        "message": "Data injected. Sentinel will detect this within 30 seconds and fire all channels.",
    }


# ─── SCENARIO B: Runaway Process ─────────────────────────────────────────────

@router.post("/runaway-process")
async def inject_runaway_process():
    """
    Simulates: OpenAI GPT-4o spend suddenly 341% above baseline at 2AM.
    Classic infinite loop pattern across the last 3 hours.
    """
    now = datetime.now(timezone.utc)
    tenant_id = TENANT_ZERO_ID
    provider = "openai"
    model = "gpt-4o"
    api_key_id = "demo_key_sk_prod_001"

    # Distribution across last 3 hours:
    # Hour -3 to -2: ~$18/hr
    # Hour -2 to -1: ~$36/hr
    # Hour -1 to now: ~$72/hr
    hourly_configs = [
        {"start_min": 120, "end_min": 180, "target_total": 18.0, "row_count": 60},
        {"start_min": 60, "end_min": 120, "target_total": 36.0, "row_count": 80},
        {"start_min": 0, "end_min": 60, "target_total": 72.0, "row_count": 120},
    ]

    ai_facts_rows = []
    total_injected = Decimal("0.0")
    row_idx = 0

    for cfg in hourly_configs:
        rows_in_hour = cfg["row_count"]
        target_cost = Decimal(str(cfg["target_total"]))
        base_cost_per_row = target_cost / Decimal(str(rows_in_hour))

        for _ in range(rows_in_hour):
            # Add ±15% variance per row
            variance = Decimal(str(round(random.uniform(0.85, 1.15), 4)))
            cost_val = base_cost_per_row * variance
            total_injected += cost_val

            mins_ago = random.uniform(float(cfg["start_min"]), float(cfg["end_min"]))
            ts = now - timedelta(minutes=mins_ago)
            row_hash = hashlib.sha256(
                f"{tenant_id}:{provider}:{api_key_id}:{ts.isoformat()}:{row_idx}:{uuid.uuid4()}".encode()
            ).hexdigest()[:32]
            row_idx += 1

            ai_facts_rows.append([
                tenant_id,
                ts,
                provider,
                model,
                api_key_id,
                random.randint(1200, 2400), # input_tokens
                random.randint(300, 800),   # output_tokens
                0,
                cost_val,
                "data_engineering",
                "worker_pool",
                "runaway_loop",
                row_hash,
                1,
                now,
            ])

    ai_columns = [
        "tenant_id", "ts", "provider", "model", "api_key_id",
        "input_tokens", "output_tokens", "cached_tokens", "cost_usd",
        "team_tag", "customer_tag", "feature_tag", "row_hash",
        "version", "inserted_at",
    ]

    batch_size = 100
    for b_start in range(0, len(ai_facts_rows), batch_size):
        batch = ai_facts_rows[b_start : b_start + batch_size]
        clickhouse_writer.insert("ai_usage_facts", batch, column_names=ai_columns)

    logger.info("Inserted %d runaway rows for %s into ClickHouse", len(ai_facts_rows), api_key_id)

    detection_triggered = await _trigger_sentinel_run_now()

    return {
        "scenario": "runaway_process",
        "injected_rows": len(ai_facts_rows),
        "baseline_per_hour": 18.00,
        "peak_per_hour": 72.00,
        "deviation_pct": 300.0,
        "detection_triggered": detection_triggered,
        "message": "Runaway pattern injected. Sentinel detecting...",
    }


# ─── SCENARIO C: Sudden Bill Spike ───────────────────────────────────────────

@router.post("/bill-spike")
async def inject_bill_spike():
    """
    Simulates: Vercel bandwidth + compute costs doubled overnight after
    a large accidental deployment to production.
    """
    now = datetime.now(timezone.utc)
    tenant_id = TENANT_ZERO_ID
    provider = "vercel"
    service_name = "Vercel Edge & Functions"
    api_key_id = "demo_vercel_key_001"

    # Insert ~$14.50 worth distributed over 6 hours (doubling the ~$14/day baseline)
    cost_facts_rows = []
    total_cost = Decimal("14.50")
    intervals = 6  # 1 per hour over 6 hours

    cost_per_interval = total_cost / Decimal(str(intervals))

    for h in range(intervals):
        p_start = now - timedelta(hours=h + 1)
        p_end = now - timedelta(hours=h)
        row_hash = hashlib.sha256(
            f"{tenant_id}:{provider}:{service_name}:{p_start.isoformat()}:{uuid.uuid4()}".encode()
        ).hexdigest()[:32]

        cost_facts_rows.append([
            tenant_id,
            p_start,
            p_end,
            cost_per_interval,
            cost_per_interval,
            "USD",
            provider,
            service_name,
            "compute",
            "us-east-1",
            api_key_id,               # resource_id holds key id
            "bandwidth",              # sku_id
            {"key": api_key_id, "cost_type": "bandwidth"},
            "frontend",
            "production",
            "deployment_surge",
            "direct",
            row_hash,
            1,
            now,
        ])

    cost_columns = [
        "tenant_id", "charge_period_start", "charge_period_end",
        "billed_cost", "effective_cost", "currency", "provider",
        "service_name", "service_category", "region", "resource_id",
        "sku_id", "tags", "allocated_team", "allocated_customer",
        "allocated_feature", "allocation_method", "row_hash",
        "version", "inserted_at",
    ]

    clickhouse_writer.insert("cost_facts", cost_facts_rows, column_names=cost_columns)
    logger.info("Inserted %d bill spike rows for %s into ClickHouse cost_facts", len(cost_facts_rows), provider)

    detection_triggered = await _trigger_sentinel_run_now()

    return {
        "scenario": "bill_spike",
        "injected_rows": len(cost_facts_rows),
        "provider": provider,
        "injected_cost": 14.50,
        "detection_triggered": detection_triggered,
        "message": "Bill spike injected. Sentinel detecting...",
    }


# ─── TASK 3: Cleanup Endpoint ────────────────────────────────────────────────

@router.post("/cleanup")
async def inject_cleanup():
    """
    Removes ALL injected demo data from ClickHouse and Postgres so scenarios
    can be re-run cleanly.
    """
    tenant_id = TENANT_ZERO_ID
    demo_keys = ["demo_leaked_key_exposed_001", "demo_key_sk_prod_001", "demo_vercel_key_001"]

    # 1. ClickHouse cleanup
    try:
        ch = clickhouse_writer.get_client()
        # Delete ai_usage_facts
        ch.command(f"""
            ALTER TABLE ai_usage_facts DELETE
            WHERE tenant_id = '{tenant_id}'
              AND api_key_id IN ('demo_leaked_key_exposed_001', 'demo_key_sk_prod_001', 'demo_vercel_key_001')
              AND ts >= now() - INTERVAL 24 HOUR
        """)

        # Delete cost_facts
        ch.command(f"""
            ALTER TABLE cost_facts DELETE
            WHERE tenant_id = '{tenant_id}'
              AND (
                resource_id IN ('demo_vercel_key_001')
                OR tags['key'] = 'demo_vercel_key_001'
                OR (provider = 'vercel' AND charge_period_start >= now() - INTERVAL 24 HOUR)
              )
        """)
        logger.info("Cleaned ClickHouse rows for demo keys")
    except Exception as exc:
        logger.warning("ClickHouse cleanup warning: %s", exc)

    # 2. Postgres cleanup
    rows_removed = 0
    try:
        async with async_session_factory() as session:
            await session.execute(
                text("SELECT set_config('app.tenant_id', :tenant_id, true)"),
                {"tenant_id": tenant_id},
            )
            # Find anomaly IDs
            res = await session.execute(
                text("""
                    SELECT id::text FROM anomalies
                    WHERE tenant_id = CAST(:tenant_id AS uuid)
                      AND (
                        api_key_id IN ('demo_leaked_key_exposed_001', 'demo_key_sk_prod_001', 'demo_vercel_key_001')
                        OR series_key LIKE '%demo_leaked_key_exposed_001%'
                        OR series_key LIKE '%demo_key_sk_prod_001%'
                        OR series_key LIKE '%demo_vercel_key_001%'
                        OR (provider = 'vercel' AND detected_at >= now() - interval '24 hours')
                      )
                      AND detected_at >= now() - interval '24 hours'
                """),
                {"tenant_id": tenant_id},
            )
            anomaly_ids = [r[0] for r in res.fetchall()]
            rows_removed = len(anomaly_ids)

            for aid in anomaly_ids:
                await session.execute(text("DELETE FROM actions WHERE anomaly_id = CAST(:aid AS uuid)"), {"aid": aid})
                await session.execute(text("DELETE FROM savings_entries WHERE anomaly_id = CAST(:aid AS uuid)"), {"aid": aid})
                await session.execute(text("DELETE FROM voice_calls WHERE anomaly_id = CAST(:aid AS uuid)"), {"aid": aid})
                await session.execute(text("DELETE FROM anomalies WHERE id = CAST(:aid AS uuid)"), {"aid": aid})

            await session.commit()
            logger.info("Cleaned %d anomalies and related actions from Postgres", rows_removed)
    except Exception as exc:
        logger.error("Postgres cleanup error: %s", exc)

    return {
        "cleaned": True,
        "rows_removed": rows_removed,
    }

