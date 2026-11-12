import asyncio
import logging
import signal
import sys

# Force line buffering on stdout
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

from app.config import settings
from app.db import close_db_pool
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


async def main():
    logger.info("Initializing Cirra Sentinel Anomaly Detection Service...")
    logger.info(f"Target ClickHouse Host: {settings.effective_ch_host}:{settings.CLICKHOUSE_PORT}")
    logger.info(
        f"Target PostgreSQL: {settings.asyncpg_database_url.split('@')[-1] if '@' in settings.asyncpg_database_url else 'local'}"
    )

    scheduler = init_scheduler()
    scheduler.start()
    logger.info("Sentinel scheduler started")

    # Log all scheduled jobs
    for job in scheduler.get_jobs():
        logger.info(f"Scheduled job '{job.name}' (id={job.id}) next run: {job.next_run_time}")

    if settings.SENTINEL_RUN_ONCE:
        logger.info("SENTINEL_RUN_ONCE is enabled. Performing one verification cycle before exiting.")
        try:
            await asyncio.gather(
                run_ai_anomaly_detection(),
                run_cloud_anomaly_detection(),
                run_leaked_key_detection(),
                return_exceptions=True,
            )
        except Exception as e:
            logger.warning(f"Verification cycle notice: {e}")
        finally:
            scheduler.shutdown(wait=False)
            await close_db_pool()
            logger.info("Sentinel run-once verification completed successfully.")
            return

    # Keep running until cancelled
    stop_event = asyncio.Event()

    def handle_signal(*_):
        logger.info("Shutdown signal received. Stopping Sentinel...")
        stop_event.set()

    loop = asyncio.get_running_loop()
    if sys.platform != "win32":
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, handle_signal)
    else:
        signal.signal(signal.SIGINT, handle_signal)
        signal.signal(signal.SIGTERM, handle_signal)

    try:
        await stop_event.wait()
    finally:
        logger.info("Shutting down Sentinel scheduler...")
        scheduler.shutdown(wait=False)
        await close_db_pool()
        logger.info("Sentinel service stopped successfully.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Sentinel process terminated.")
