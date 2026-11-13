import logging
import asyncio
from typing import Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.detector import AnomalyDetector
from app.explainer import explain_anomaly
from app.db import get_db_pool, fetch_active_tenants, write_anomaly, ensure_db_constraints
from app.alerts import dispatch_alert, dispatch_tiered_alert

logger = logging.getLogger("cirra.sentinel.scheduler")

scheduler: Optional[AsyncIOScheduler] = None
detector = AnomalyDetector()


async def run_detection_for_tenant(
    tenant_id: str = "00000000-0000-0000-0000-000000000001",
) -> dict:
    """
    On-demand or scheduled detection cycle for a single tenant.
    Pulls recent spend from ClickHouse (last 24h), compares against
    each key's 7-day baseline, creates anomalies, and calls
    dispatch_tiered_alert() across all alert channels.
    """
    logger.info(f"Running detection cycle for tenant {tenant_id}...")
    total_flagged = 0
    flagged_series = []

    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await ensure_db_constraints(conn)

        # 1. Leaked Key Detection
        try:
            leaked_anomalies = detector.detect_leaked_key(tenant_id=tenant_id)
            for anomaly in leaked_anomalies:
                explanation = explain_anomaly(anomaly)
                async with pool.acquire() as conn:
                    aid = await write_anomaly(anomaly, explanation, conn)
                total_flagged += 1
                flagged_series.append(anomaly.series_key)
                logger.warning(
                    f"CRITICAL: Detected suspicious key: tenant={tenant_id} key={anomaly.api_key_id} "
                    f"provider={anomaly.provider}"
                )
                await dispatch_tiered_alert(anomaly, explanation, anomaly_db_id=str(aid) if aid else "")
        except Exception as e:
            logger.error(f"Error in leaked key detection for tenant {tenant_id}: {e}", exc_info=True)

        # 2. AI Spend Detection
        try:
            ai_anomalies = detector.detect_ai_spend_spike(
                tenant_id=tenant_id,
                lookback_days=14,
                min_dollar_impact=settings.SENTINEL_MIN_DOLLAR_IMPACT_AI,
            )
            for anomaly in ai_anomalies:
                explanation = explain_anomaly(anomaly)
                async with pool.acquire() as conn:
                    aid = await write_anomaly(anomaly, explanation, conn)
                total_flagged += 1
                flagged_series.append(anomaly.series_key)
                logger.info(
                    f"Detected AI spend spike: tenant={tenant_id} series={anomaly.series_key} "
                    f"severity={anomaly.severity} actual={anomaly.actual_value} baseline={anomaly.baseline_value}"
                )
                await dispatch_tiered_alert(anomaly, explanation, anomaly_db_id=str(aid) if aid else "")
        except Exception as e:
            logger.error(f"Error in AI spend detection for tenant {tenant_id}: {e}", exc_info=True)

        # 3. Cloud Spend Detection
        try:
            cloud_anomalies = detector.detect_cloud_spend_spike(
                tenant_id=tenant_id,
                lookback_days=14,
                min_dollar_impact=5.0,  # sensitive enough for Vercel demo spike
            )
            for anomaly in cloud_anomalies:
                if anomaly.provider == "vercel" and not anomaly.api_key_id:
                    anomaly.api_key_id = "demo_vercel_key_001"
                explanation = explain_anomaly(anomaly)
                async with pool.acquire() as conn:
                    aid = await write_anomaly(anomaly, explanation, conn)
                total_flagged += 1
                flagged_series.append(anomaly.series_key)
                logger.info(
                    f"Detected Cloud spend spike: tenant={tenant_id} series={anomaly.series_key} "
                    f"severity={anomaly.severity} actual={anomaly.actual_value} baseline={anomaly.baseline_value}"
                )
                await dispatch_tiered_alert(anomaly, explanation, anomaly_db_id=str(aid) if aid else "")
        except Exception as e:
            logger.error(f"Error in Cloud spend detection for tenant {tenant_id}: {e}", exc_info=True)

        logger.info(f"Detection cycle completed for tenant {tenant_id}. Flagged: {total_flagged}")
    except Exception as exc:
        logger.error(f"Detection cycle encountered error for tenant {tenant_id}: {exc}", exc_info=True)

    return {
        "tenant_id": tenant_id,
        "total_flagged": total_flagged,
        "anomalies": flagged_series,
    }


async def run_ai_anomaly_detection() -> None:
    """
    Scheduled job: Check for AI spend spikes across all active tenants.
    Runs every 5 minutes (configurable via SENTINEL_AI_CHECK_INTERVAL_MINUTES).
    """
    logger.info("Starting AI spend anomaly detection cycle...")
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await ensure_db_constraints(conn)
            tenants = await fetch_active_tenants(conn)

        if not tenants:
            logger.info("No active tenants found. Skipping AI spend anomaly detection.")
            return

        total_anomalies = 0
        for tenant_id in tenants:
            try:
                anomalies = detector.detect_ai_spend_spike(
                    tenant_id=tenant_id,
                    lookback_days=14,
                    min_dollar_impact=settings.SENTINEL_MIN_DOLLAR_IMPACT_AI,
                )
                for anomaly in anomalies:
                    explanation = explain_anomaly(anomaly)
                    async with pool.acquire() as conn:
                        await write_anomaly(anomaly, explanation, conn)

                    total_anomalies += 1
                    logger.info(
                        f"Detected AI spend spike: tenant={tenant_id} series={anomaly.series_key} "
                        f"severity={anomaly.severity} actual={anomaly.actual_value} baseline={anomaly.baseline_value}"
                    )

                    if anomaly.severity in ("high", "critical"):
                        await dispatch_alert(anomaly, explanation)
            except Exception as e:
                logger.error(f"Error processing AI spend detection for tenant {tenant_id}: {e}", exc_info=True)

        logger.info(f"AI spend anomaly detection cycle completed. Total flagged: {total_anomalies}")
    except Exception as exc:
        logger.error(f"AI anomaly detection cycle encountered an error: {exc}", exc_info=True)


async def run_cloud_anomaly_detection() -> None:
    """
    Scheduled job: Check for cloud infrastructure spend spikes across all active tenants.
    Runs every 60 minutes (configurable via SENTINEL_CLOUD_CHECK_INTERVAL_MINUTES).
    """
    logger.info("Starting Cloud spend anomaly detection cycle...")
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            tenants = await fetch_active_tenants(conn)

        if not tenants:
            logger.info("No active tenants found. Skipping Cloud spend anomaly detection.")
            return

        total_anomalies = 0
        for tenant_id in tenants:
            try:
                anomalies = detector.detect_cloud_spend_spike(
                    tenant_id=tenant_id,
                    lookback_days=14,
                    min_dollar_impact=settings.SENTINEL_MIN_DOLLAR_IMPACT_CLOUD,
                )
                for anomaly in anomalies:
                    explanation = explain_anomaly(anomaly)
                    async with pool.acquire() as conn:
                        await write_anomaly(anomaly, explanation, conn)

                    total_anomalies += 1
                    logger.info(
                        f"Detected Cloud spend spike: tenant={tenant_id} series={anomaly.series_key} "
                        f"severity={anomaly.severity} actual={anomaly.actual_value} baseline={anomaly.baseline_value}"
                    )

                    if anomaly.severity in ("high", "critical"):
                        await dispatch_alert(anomaly, explanation)
            except Exception as e:
                logger.error(f"Error processing Cloud spend detection for tenant {tenant_id}: {e}", exc_info=True)

        logger.info(f"Cloud spend anomaly detection cycle completed. Total flagged: {total_anomalies}")
    except Exception as exc:
        logger.error(f"Cloud anomaly detection cycle encountered an error: {exc}", exc_info=True)


async def run_leaked_key_detection() -> None:
    """
    Scheduled job: Check for suspicious API key patterns (dormant reactivation, rate surge, off-hours).
    Runs every 15 minutes (configurable via SENTINEL_LEAKED_KEY_CHECK_INTERVAL_MINUTES).
    Always dispatches alert regardless of severity.
    """
    logger.info("Starting Leaked Key anomaly detection cycle...")
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            tenants = await fetch_active_tenants(conn)

        if not tenants:
            logger.info("No active tenants found. Skipping leaked key detection.")
            return

        total_anomalies = 0
        for tenant_id in tenants:
            try:
                anomalies = detector.detect_leaked_key(tenant_id=tenant_id)
                for anomaly in anomalies:
                    explanation = explain_anomaly(anomaly)
                    async with pool.acquire() as conn:
                        await write_anomaly(anomaly, explanation, conn)

                    total_anomalies += 1
                    logger.warning(
                        f"CRITICAL: Detected suspicious key: tenant={tenant_id} key={anomaly.api_key_id} "
                        f"provider={anomaly.provider} reason={anomaly.extra_data.get('reason')}"
                    )
                    # Always dispatch alert regardless of severity for leaked key detection
                    await dispatch_alert(anomaly, explanation)
            except Exception as e:
                logger.error(f"Error processing leaked key detection for tenant {tenant_id}: {e}", exc_info=True)

        logger.info(f"Leaked Key anomaly detection cycle completed. Total flagged: {total_anomalies}")
    except Exception as exc:
        logger.error(f"Leaked key detection cycle encountered an error: {exc}", exc_info=True)


def init_scheduler() -> AsyncIOScheduler:
    """Initialize APScheduler AsyncIOScheduler with configured intervals."""
    global scheduler
    if scheduler is not None and scheduler.running:
        return scheduler

    scheduler = AsyncIOScheduler()

    # Schedule AI spend anomaly detection (default: 5 min)
    scheduler.add_job(
        run_ai_anomaly_detection,
        trigger=IntervalTrigger(minutes=settings.SENTINEL_AI_CHECK_INTERVAL_MINUTES),
        id="run_ai_anomaly_detection",
        name="AI Spend Anomaly Detection",
        replace_existing=True,
    )

    # Schedule Cloud spend anomaly detection (default: 60 min)
    scheduler.add_job(
        run_cloud_anomaly_detection,
        trigger=IntervalTrigger(minutes=settings.SENTINEL_CLOUD_CHECK_INTERVAL_MINUTES),
        id="run_cloud_anomaly_detection",
        name="Cloud Spend Anomaly Detection",
        replace_existing=True,
    )

    # Schedule Leaked key anomaly detection (default: 15 min)
    scheduler.add_job(
        run_leaked_key_detection,
        trigger=IntervalTrigger(minutes=settings.SENTINEL_LEAKED_KEY_CHECK_INTERVAL_MINUTES),
        id="run_leaked_key_detection",
        name="Leaked Key Anomaly Detection",
        replace_existing=True,
    )

    return scheduler
