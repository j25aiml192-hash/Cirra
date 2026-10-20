import os
from celery import Celery
from celery.schedules import crontab

REDIS_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")

app = Celery("cirra_ingest", broker=REDIS_URL, backend=REDIS_URL)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Scheduled 4-hour synchronization intervals per provider
app.conf.beat_schedule = {
    "sync-aws-cost-explorer-every-4h": {
        "task": "src.tasks.ingest_cost_explorer",
        "schedule": crontab(minute=0, hour="*/4"),
    },
    "sync-gcp-billing-every-4h": {
        "task": "src.tasks.ingest_gcp_billing",
        "schedule": crontab(minute=15, hour="*/4"),
    },
    "sync-ai-usage-every-4h": {
        "task": "src.tasks.ingest_ai_usage",
        "schedule": crontab(minute=30, hour="*/4"),
    },
}

app.autodiscover_tasks(["src.tasks"])

if __name__ == "__main__":
    app.start()
