import logging
import os
from typing import Optional
from celery import Celery
from app.core.config import settings

logger = logging.getLogger("cirra.api.dispatcher")

_celery_app: Optional[Celery] = None


def get_celery_client() -> Celery:
    global _celery_app
    if _celery_app is None:
        broker_url = os.getenv("CELERY_BROKER_URL", settings.REDIS_URL.replace("/0", "/1"))
        _celery_app = Celery(broker=broker_url)
    return _celery_app


def dispatch_initial_sync(connection_id: str, provider: str) -> bool:
    """
    Trigger initial sync by enqueueing Celery task for the connection.
    Gracefully handles environments where Celery/Redis is mocked.
    """
    prov = provider.lower()
    task_name = None
    if prov == "aws":
        task_name = "tasks.ingest_cost_explorer"
    elif prov == "openai":
        task_name = "tasks.ingest_openai_usage"
    elif prov == "anthropic":
        task_name = "tasks.ingest_anthropic_usage"
    else:
        logger.warning(f"No ingest task configured for provider {provider}")
        return False

    try:
        client = get_celery_client()
        client.send_task(task_name, args=[connection_id])
        logger.info(f"Dispatched {task_name} for connection {connection_id}")
        return True
    except Exception as e:
        logger.warning(f"Could not dispatch Celery task {task_name} (worker may be offline or in mock test): {e}")
        return False
