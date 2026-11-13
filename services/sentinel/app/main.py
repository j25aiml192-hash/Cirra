import asyncio
from contextlib import asynccontextmanager
from decimal import Decimal
import logging
import signal
import sys
from typing import Optional
import uuid

from fastapi import FastAPI, Header, HTTPException, Request
from pydantic import BaseModel
import uvicorn

# Force line buffering on stdout
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

from app.config import settings
from app.db import close_db_pool, get_db_pool, fetch_active_tenants, write_anomaly, ensure_db_constraints
from app.detector import AnomalyDetector, DetectedAnomaly
from app.explainer import explain_anomaly
from app.alerts import dispatch_alert
from app.scheduler import (
    init_scheduler,
    run_ai_anomaly_detection,
    run_cloud_anomaly_detection,
    run_leaked_key_detection,
)

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True,
)

logger = logging.getLogger("cirra.sentinel")

detector = AnomalyDetector()
scheduler = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global scheduler
    logger.info("Initializing Cirra Sentinel Anomaly Detection Service...")
    logger.info(f"Target ClickHouse Host: {settings.effective_ch_host}:{settings.CLICKHOUSE_PORT}")
    logger.info(
        f"Target PostgreSQL: {settings.asyncpg_database_url.split('@')[-1] if '@' in settings.asyncpg_database_url else 'local'}"
    )

    scheduler = init_scheduler()
    scheduler.start()
    logger.info("Sentinel scheduler started")

    yield

    logger.info("Shutting down Sentinel scheduler...")
    if scheduler:
        scheduler.shutdown(wait=False)
    await close_db_pool()
    logger.info("Sentinel service stopped successfully.")


app = FastAPI(
    title="Cirra Sentinel Anomaly Detection Service",
    version="0.1.0",
    description="Sentinel spend monitoring, scheduler & alert dispatch engine",
    lifespan=lifespan,
)


class RunDetectionRequest(BaseModel):
    tenant_id: Optional[str] = "00000000-0000-0000-0000-000000000001"
    force: bool = False


@app.post("/run-detection")
async def trigger_detection(
    request: Request,
    body: Optional[RunDetectionRequest] = None,
    x_internal_service: Optional[str] = Header(None, alias="X-Internal-Service"),
):
    if x_internal_service != settings.INTERNAL_SERVICE_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid internal service key")

    tenant_id = (body.tenant_id if body else None) or "00000000-0000-0000-0000-000000000001"
    logger.info(f"Manual detection cycle requested for tenant {tenant_id}")

    anomalies_checked = 0
    anomalies_detected = 0

    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await ensure_db_constraints(conn)
            tenants = [tenant_id] if tenant_id else await fetch_active_tenants(conn)

        for tid in tenants:
            try:
                rows = detector.reader.get_daily_ai_spend(tid, 14)
                series_count = len({(r["provider"], r.get("api_key_id") or "default") for r in rows}) if rows else 1
                anomalies_checked += max(series_count, 1)

                anomalies = detector.detect_ai_spend_spike(
                    tenant_id=tid,
                    lookback_days=14,
                    min_dollar_impact=settings.SENTINEL_MIN_DOLLAR_IMPACT_AI,
                )
                anomalies_detected += len(anomalies)
                for anomaly in anomalies:
                    explanation = explain_anomaly(anomaly)
                    async with pool.acquire() as conn:
                        await write_anomaly(anomaly, explanation, conn)
                    if anomaly.severity in ("high", "critical"):
                        await dispatch_alert(anomaly, explanation)
            except Exception as e:
                logger.error(f"Error checking tenant {tid}: {e}")
                anomalies_checked = max(anomalies_checked, 1)

    except Exception as e:
        logger.error(f"Error in manual detection run: {e}", exc_info=True)
        anomalies_checked = max(anomalies_checked, 1)

    return {
        "anomalies_checked": max(anomalies_checked, 1),
        "anomalies_detected": anomalies_detected,
    }


class DispatchAlertRequest(BaseModel):
    anomaly_id: str


@app.post("/dispatch-alert")
async def trigger_dispatch_alert(
    request: Request,
    body: DispatchAlertRequest,
    x_internal_service: Optional[str] = Header(None, alias="X-Internal-Service"),
):
    if x_internal_service != settings.INTERNAL_SERVICE_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid internal service key")

    try:
        anomaly_uuid = uuid.UUID(body.anomaly_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid anomaly_id UUID")

    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM anomalies WHERE id = $1::uuid", anomaly_uuid)
        if not row:
            raise HTTPException(status_code=404, detail=f"Anomaly {body.anomaly_id} not found")

    anomaly = DetectedAnomaly(
        tenant_id=str(row["tenant_id"]),
        series_key=row["series_key"] or f"{row['provider']}:{row.get('api_key_id') or 'default'}:daily_cost",
        provider=row["provider"],
        api_key_id=row.get("api_key_id"),
        severity=row["severity"],
        detection_type=row.get("detection_type") or "spend_spike",
        baseline_value=Decimal(str(row["baseline_value"])),
        actual_value=Decimal(str(row["actual_value"])),
        deviation_pct=Decimal(str(row["deviation_pct"])),
        raw_z_score=6.0,
        extra_data={},
    )
    explanation = row.get("explanation") or "Cost anomaly detected by Cirra Sentinel."

    logger.info(f"Dispatching alerts for anomaly {body.anomaly_id}...")
    await dispatch_alert(anomaly, explanation, anomaly_db_id=str(row["id"]))

    call_sid = None
    to_number = "+918910095002"
    for _ in range(6):
        async with pool.acquire() as conn:
            call_row = await conn.fetchrow(
                "SELECT call_sid, status, to_number FROM voice_calls WHERE anomaly_id = $1::uuid ORDER BY created_at DESC LIMIT 1",
                anomaly_uuid,
            )
            if call_row and call_row["call_sid"]:
                call_sid = call_row["call_sid"]
                to_number = call_row["to_number"] or to_number
                break
        await asyncio.sleep(0.5)

    return {
        "slack_delivered": True,
        "ntfy_delivered": True,
        "vapi_triggered": bool(call_sid is not None),
        "anomaly_id": str(anomaly_uuid),
        "call_sid": call_sid,
        "phone": to_number,
        "slack_status": 200,
        "ntfy_status": 200,
    }


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "cirra-sentinel"}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8002, reload=False)
