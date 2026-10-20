import os
from datetime import timedelta
from celery import Celery

broker_url = os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://localhost:6379/0"))
result_backend = os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://localhost:6379/0"))

celery_app = Celery(
    "cirra_ingest",
    broker=broker_url,
    backend=result_backend,
    include=["tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_time_limit=600,
    task_soft_time_limit=540,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_routes={
        "tasks.ingest_cost_explorer": {"queue": "cloud_cost"},
        "tasks.ingest_openai_usage": {"queue": "ai_usage"},
        "tasks.ingest_anthropic_usage": {"queue": "ai_usage"},
        "tasks.sync_all_cloud_connections": {"queue": "scheduler"},
        "tasks.sync_all_ai_connections": {"queue": "scheduler"},
    },
    beat_schedule={
        "sync-cloud-every-4h": {
            "task": "tasks.sync_all_cloud_connections",
            "schedule": timedelta(hours=4),
        },
        "sync-ai-hourly": {
            "task": "tasks.sync_all_ai_connections",
            "schedule": timedelta(hours=1),
        },
    },
)

if __name__ == "__main__":
    celery_app.start()
