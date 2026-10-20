import hashlib
import json
import logging
from typing import Any, Dict, List
from celery import shared_task
from src.normalizer import normalize_to_focus

logger = logging.getLogger(__name__)


def generate_dedup_hash(fact_dict: Dict[str, Any]) -> str:
    """Generates an SHA-256 deterministic hash for idempotent ClickHouse insertion."""
    unique_string = f"{fact_dict.get('tenant_id')}_{fact_dict.get('provider')}_{fact_dict.get('resource_id')}_{fact_dict.get('charge_period_start')}_{fact_dict.get('sku_id')}"
    return hashlib.sha256(unique_string.encode("utf-8")).hexdigest()


@shared_task(
    bind=True,
    max_retries=5,
    default_retry_delay=60,
    retry_backoff=True,
    retry_backoff_max=1800,
)
def ingest_cost_explorer(self, connection_id: str, tenant_id: str, role_arn: str):
    """
    Celery task: Ingest AWS Cost Explorer records with exponential back-off retry.
    """
    try:
        from src.connectors.aws import AWSConnector
        connector = AWSConnector(role_arn=role_arn)
        raw_records = connector.fetch_cost_explorer(connection_id=connection_id)

        normalized_records = []
        for rec in raw_records:
            cost_fact = normalize_to_focus("aws", rec, tenant_id=tenant_id)
            fact_dict = cost_fact.model_dump()
            fact_dict["dedup_hash"] = generate_dedup_hash(fact_dict)
            normalized_records.append(fact_dict)

        logger.info(f"Ingested {len(normalized_records)} AWS records for tenant {tenant_id}")
        return {"status": "success", "count": len(normalized_records)}
    except Exception as exc:
        logger.error(f"Error ingesting AWS cost explorer: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=5,
    default_retry_delay=60,
    retry_backoff=True,
    retry_backoff_max=1800,
)
def ingest_gcp_billing(self, connection_id: str, tenant_id: str, sa_info: Dict[str, Any], table_id: str):
    """
    Celery task: Ingest GCP BigQuery billing records with exponential back-off retry.
    """
    try:
        from src.connectors.gcp import GCPConnector
        connector = GCPConnector(service_account_info=sa_info, billing_table_id=table_id)
        raw_records = connector.fetch_billing_export()

        normalized_records = []
        for rec in raw_records:
            cost_fact = normalize_to_focus("gcp", rec, tenant_id=tenant_id)
            fact_dict = cost_fact.model_dump()
            fact_dict["dedup_hash"] = generate_dedup_hash(fact_dict)
            normalized_records.append(fact_dict)

        logger.info(f"Ingested {len(normalized_records)} GCP records for tenant {tenant_id}")
        return {"status": "success", "count": len(normalized_records)}
    except Exception as exc:
        logger.error(f"Error ingesting GCP billing: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=5,
    default_retry_delay=60,
    retry_backoff=True,
    retry_backoff_max=1800,
)
def ingest_ai_usage(self, connection_id: str, tenant_id: str, api_key: str, provider: str = "openai"):
    """
    Celery task: Ingest AI token usage facts with exponential back-off retry.
    """
    try:
        from src.connectors.openai_connector import OpenAIConnector
        connector = OpenAIConnector(admin_api_key=api_key)
        raw_records = connector.fetch_usage()

        normalized_records = []
        for rec in raw_records:
            cost_fact = normalize_to_focus("openai", rec, tenant_id=tenant_id)
            fact_dict = cost_fact.model_dump()
            fact_dict["dedup_hash"] = generate_dedup_hash(fact_dict)
            normalized_records.append(fact_dict)

        logger.info(f"Ingested {len(normalized_records)} AI usage records for tenant {tenant_id}")
        return {"status": "success", "count": len(normalized_records)}
    except Exception as exc:
        logger.error(f"Error ingesting AI usage: {exc}")
        raise self.retry(exc=exc)
