import asyncio
import logging
import os
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from celery import Task
from worker import celery_app
from clickhouse_client import ClickHouseClient
from normalizer import normalize_aws_cost_explorer, normalize_openai_usage
from encryption import decrypt_credentials
from connectors.aws import AWSCostExplorerConnector
from connectors.openai_connector import OpenAIConnector
from connectors.anthropic_connector import AnthropicConnector
from db import get_connection_by_id, update_connection_status, get_all_active_connections, sanitize_error_message

logger = logging.getLogger("cirra.ingest.tasks")

# Initialize ClickHouse write client
clickhouse = ClickHouseClient(
    user=os.getenv("CLICKHOUSE_USER", "cirra_ingest"),
    password=os.getenv("CLICKHOUSE_PASSWORD", "ingest_secure_password"),
)


def run_async(coro):
    """Run an async coroutine synchronously inside a Celery task."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    if loop.is_running():
        # In nested event loop scenarios
        import nest_asyncio
        nest_asyncio.apply()
        return loop.run_until_complete(coro)
    return loop.run_until_complete(coro)


class BaseIngestTask(Task):
    """Base Celery task providing exponential backoff with jitter and error recording."""
    abstract = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        connection_id = args[0] if args else kwargs.get("connection_id")
        safe_msg = sanitize_error_message(str(exc))
        logger.error(f"Task {self.name} [{task_id}] failed permanently for connection {connection_id}: {safe_msg}")
        if connection_id:
            try:
                run_async(update_connection_status(
                    connection_id=connection_id,
                    status="error",
                    last_error=safe_msg,
                ))
            except Exception as e:
                logger.critical(f"Failed to record error status for connection {connection_id}: {e}")
        super().on_failure(exc, task_id, args, kwargs, einfo)


@celery_app.task(
    bind=True,
    base=BaseIngestTask,
    max_retries=3,
    time_limit=600,
    soft_time_limit=540,
)
def ingest_cost_explorer(self, connection_id: str) -> Dict[str, Any]:
    """
    Ingest AWS Cost Explorer cost data.
    - Tenant ID resolved strictly from database row.
    - Status transitions: pending -> syncing -> connected | error
    - First sync: 3 months (90 days) history.
    - Incremental sync: from last_synced_at (-2 days buffer) to now.
    """
    logger.info(f"Starting ingest_cost_explorer for connection {connection_id}")

    conn = run_async(get_connection_by_id(connection_id))
    if not conn:
        logger.error(f"Connection {connection_id} not found")
        return {"status": "not_found", "rows_ingested": 0}

    # Per-tenant isolation: tenant_id comes strictly from DB row
    tenant_id = conn["tenant_id"]

    try:
        # Transition to syncing
        run_async(update_connection_status(connection_id, status="syncing"))

        # Decrypt credentials
        creds = decrypt_credentials(conn["credentials_encrypted"])
        now = datetime.now(timezone.utc)

        # Date range determination
        last_synced = conn.get("last_synced_at")
        if last_synced is None:
            # 3 months of history on first connect
            start_date = now - timedelta(days=90)
        else:
            if isinstance(last_synced, str):
                last_synced = datetime.fromisoformat(last_synced.replace("Z", "+00:00"))
            # 2 days buffer for settled billing adjustments
            start_date = max(last_synced - timedelta(days=2), now - timedelta(days=90))

        end_date = now

        # Fetch from AWS
        connector = AWSCostExplorerConnector(credentials=creds)
        raw_response = run_async(connector.fetch_cost_and_usage(start_date=start_date, end_date=end_date))

        # Normalize to FOCUS CostFact models
        facts = normalize_aws_cost_explorer(raw=raw_response, tenant_id=tenant_id)

        # Batch insert into ClickHouse
        rows_inserted = clickhouse.insert_cost_facts(facts)

        # Update connection status to connected
        run_async(update_connection_status(
            connection_id=connection_id,
            status="connected",
            last_synced_at=now,
            last_error=None,
        ))

        logger.info(
            f"Successfully synced AWS connection {connection_id} for tenant {tenant_id}: "
            f"{rows_inserted} facts inserted ({start_date.date()} to {end_date.date()})"
        )
        return {"status": "connected", "rows_ingested": rows_inserted}

    except Exception as exc:
        safe_err = sanitize_error_message(str(exc))
        logger.warning(f"Error in ingest_cost_explorer attempt {self.request.retries + 1}/4 for {connection_id}: {safe_err}")
        
        # Exponential backoff with jitter: 2^retries + uniform(1, 5)
        retry_delay = int((2 ** self.request.retries) * 5 + random.uniform(1, 5))
        try:
            raise self.retry(exc=exc, countdown=retry_delay)
        except self.MaxRetriesExceededError:
            run_async(update_connection_status(
                connection_id=connection_id,
                status="error",
                last_error=safe_err,
            ))
            raise


@celery_app.task(
    bind=True,
    base=BaseIngestTask,
    max_retries=3,
    time_limit=600,
    soft_time_limit=540,
)
def ingest_openai_usage(self, connection_id: str) -> Dict[str, Any]:
    """
    Ingest OpenAI organization usage and cost data.
    - Tenant ID resolved strictly from DB row.
    - Daily poll of organization usage/costs, mapped to ai_usage_facts.
    """
    logger.info(f"Starting ingest_openai_usage for connection {connection_id}")

    conn = run_async(get_connection_by_id(connection_id))
    if not conn:
        logger.error(f"Connection {connection_id} not found")
        return {"status": "not_found", "rows_ingested": 0}

    tenant_id = conn["tenant_id"]

    try:
        run_async(update_connection_status(connection_id, status="syncing"))

        creds = decrypt_credentials(conn["credentials_encrypted"])
        now = datetime.now(timezone.utc)

        last_synced = conn.get("last_synced_at")
        if last_synced is None:
            start_date = now - timedelta(days=30)
        else:
            if isinstance(last_synced, str):
                last_synced = datetime.fromisoformat(last_synced.replace("Z", "+00:00"))
            start_date = max(last_synced - timedelta(days=1), now - timedelta(days=30))

        end_date = now

        connector = OpenAIConnector(credentials=creds)
        raw_response = run_async(connector.fetch_usage(start_date=start_date, end_date=end_date))

        facts = normalize_openai_usage(raw=raw_response, tenant_id=tenant_id)
        rows_inserted = clickhouse.insert_ai_usage_facts(facts)

        run_async(update_connection_status(
            connection_id=connection_id,
            status="connected",
            last_synced_at=now,
            last_error=None,
        ))

        logger.info(
            f"Successfully synced OpenAI connection {connection_id} for tenant {tenant_id}: "
            f"{rows_inserted} AI usage facts inserted."
        )
        return {"status": "connected", "rows_ingested": rows_inserted}

    except Exception as exc:
        safe_err = sanitize_error_message(str(exc))
        logger.warning(f"Error in ingest_openai_usage attempt {self.request.retries + 1}/4: {safe_err}")
        retry_delay = int((2 ** self.request.retries) * 5 + random.uniform(1, 5))
        try:
            raise self.retry(exc=exc, countdown=retry_delay)
        except self.MaxRetriesExceededError:
            run_async(update_connection_status(
                connection_id=connection_id,
                status="error",
                last_error=safe_err,
            ))
            raise


@celery_app.task(
    bind=True,
    base=BaseIngestTask,
    max_retries=1,
)
def ingest_anthropic_usage(self, connection_id: str) -> Dict[str, Any]:
    """
    Handle Anthropic connection telemetry check.
    - Discovers standard workspace key capability gap.
    - Sets clear status gap_manual_export_required without fabricating fake data.
    """
    conn = run_async(get_connection_by_id(connection_id))
    if not conn:
        return {"status": "not_found", "rows_ingested": 0}

    creds = decrypt_credentials(conn["credentials_encrypted"])
    connector = AnthropicConnector(credentials=creds)
    cap = connector.check_capabilities()

    if not cap["supported"]:
        logger.warning(f"Anthropic telemetry gap: {cap['reason']}")
        run_async(update_connection_status(
            connection_id=connection_id,
            status=cap["status"],
            last_error=cap["reason"],
        ))
        return {"status": cap["status"], "rows_ingested": 0, "reason": cap["reason"]}

    # If supported in future revisions
    run_async(update_connection_status(
        connection_id=connection_id,
        status="connected",
        last_synced_at=datetime.now(timezone.utc),
        last_error=None,
    ))
    return {"status": "connected", "rows_ingested": 0}


@celery_app.task
def sync_all_cloud_connections() -> Dict[str, int]:
    """Celery Beat task: triggers cloud cost sync every 4 hours."""
    connections = run_async(get_all_active_connections())
    dispatched = 0
    for conn in connections:
        if conn["provider"] == "aws":
            ingest_cost_explorer.delay(conn["id"])
            dispatched += 1
    logger.info(f"Beat scheduled {dispatched} cloud cost sync tasks")
    return {"dispatched": dispatched}


@celery_app.task
def sync_all_ai_connections() -> Dict[str, int]:
    """Celery Beat task: triggers AI usage sync hourly."""
    connections = run_async(get_all_active_connections())
    dispatched = 0
    for conn in connections:
        if conn["provider"] == "openai":
            ingest_openai_usage.delay(conn["id"])
            dispatched += 1
        elif conn["provider"] == "anthropic":
            ingest_anthropic_usage.delay(conn["id"])
            dispatched += 1
    logger.info(f"Beat scheduled {dispatched} AI usage sync tasks")
    return {"dispatched": dispatched}
