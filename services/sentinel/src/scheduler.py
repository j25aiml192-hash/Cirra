import os
from celery import Celery
from celery.schedules import crontab
from src.detector import AnomalyDetector
from src.explainer import AnomalyExplainer

REDIS_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")

app = Celery("cirra_sentinel", broker=REDIS_URL, backend=REDIS_URL)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Scheduled frequency
app.conf.beat_schedule = {
    "check-ai-token-anomalies-every-5m": {
        "task": "src.scheduler.check_ai_anomalies",
        "schedule": crontab(minute="*/5"),
    },
    "check-cloud-billing-anomalies-hourly": {
        "task": "src.scheduler.check_cloud_anomalies",
        "schedule": crontab(minute=0, hour="*"),
    },
}


@app.task
def check_ai_anomalies():
    detector = AnomalyDetector()
    candidate = detector.detect(series_key="openai/gpt-4o", tenant_id="demo-tenant-1")
    if candidate:
        explainer = AnomalyExplainer()
        explanation = explainer.explain(candidate)
        return {"detected": True, "explanation": explanation}
    return {"detected": False}


@app.task
def check_cloud_anomalies():
    detector = AnomalyDetector()
    candidate = detector.detect(series_key="aws/AmazonEC2", tenant_id="demo-tenant-1")
    if candidate:
        explainer = AnomalyExplainer()
        explanation = explainer.explain(candidate)
        return {"detected": True, "explanation": explanation}
    return {"detected": False}
