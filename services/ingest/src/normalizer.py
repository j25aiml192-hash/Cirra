from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class CostFact(BaseModel):
    tenant_id: str
    charge_period_start: datetime
    charge_period_end: datetime
    provider: str
    service_name: str
    resource_id: str
    sku_id: str
    billed_cost: float
    effective_cost: float
    currency: str = "USD"
    tags: Dict[str, str] = Field(default_factory=dict)
    allocated_team: Optional[str] = None
    allocated_customer: Optional[str] = None
    allocated_feature: Optional[str] = None
    allocation_method: str = "unallocated"
    inserted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def normalize_to_focus(provider: str, raw_dict: Dict[str, Any], tenant_id: str) -> CostFact:
    """
    Normalizes heterogeneous cloud and AI billing records into standard FOCUS 1.0 CostFact format.
    Handles AWS Cost Explorer / CUR, GCP BigQuery Billing Export, and OpenAI Usage.
    """
    provider_lower = provider.lower()

    if provider_lower == "aws":
        # AWS Cost Explorer JSON mapping
        time_period = raw_dict.get("TimePeriod", {})
        start_str = time_period.get("Start", "1970-01-01")
        end_str = time_period.get("End", "1970-01-01")
        start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(end_str.replace("Z", "+00:00"))

        service_name = raw_dict.get("Keys", ["Unknown"])[0] if raw_dict.get("Keys") else "Amazon Services"
        metrics = raw_dict.get("Metrics", {})
        unblended_cost = float(metrics.get("UnblendedCost", {}).get("Amount", 0.0))
        net_amortized = float(metrics.get("NetAmortizedCost", {}).get("Amount", unblended_cost))
        currency = metrics.get("UnblendedCost", {}).get("Unit", "USD")

        tags = raw_dict.get("Tags", {})
        allocated_team = tags.get("Team") or tags.get("team")
        allocated_customer = tags.get("Customer") or tags.get("customer")

        return CostFact(
            tenant_id=tenant_id,
            charge_period_start=start_dt,
            charge_period_end=end_dt,
            provider="aws",
            service_name=service_name,
            resource_id=raw_dict.get("ResourceId", f"aws-{service_name}"),
            sku_id=raw_dict.get("UsageType", "GeneralUsage"),
            billed_cost=unblended_cost,
            effective_cost=net_amortized,
            currency=currency,
            tags=tags,
            allocated_team=allocated_team,
            allocated_customer=allocated_customer,
            allocation_method="tag_exact" if allocated_team else "unallocated",
        )

    elif provider_lower == "gcp":
        # GCP Cloud Billing Export BigQuery schema
        start_dt = raw_dict.get("usage_start_time", datetime.now(timezone.utc))
        end_dt = raw_dict.get("usage_end_time", datetime.now(timezone.utc))
        service_info = raw_dict.get("service", {})
        sku_info = raw_dict.get("sku", {})
        labels = raw_dict.get("labels", {})

        cost = float(raw_dict.get("cost", 0.0))
        currency = raw_dict.get("currency", "USD")

        team = labels.get("team")
        customer = labels.get("customer")

        return CostFact(
            tenant_id=tenant_id,
            charge_period_start=start_dt,
            charge_period_end=end_dt,
            provider="gcp",
            service_name=service_info.get("description", "Google Cloud"),
            resource_id=raw_dict.get("resource", {}).get("name", "gcp-resource"),
            sku_id=sku_info.get("description", "Standard SKU"),
            billed_cost=cost,
            effective_cost=cost,
            currency=currency,
            tags=labels,
            allocated_team=team,
            allocated_customer=customer,
            allocation_method="tag_exact" if team else "unallocated",
        )

    elif provider_lower == "openai":
        # OpenAI Usage / Cost attribution
        ts = raw_dict.get("aggregation_timestamp", datetime.now(timezone.utc))
        model = raw_dict.get("model", "gpt-4o")
        cost = float(raw_dict.get("cost_usd", 0.0))

        return CostFact(
            tenant_id=tenant_id,
            charge_period_start=ts,
            charge_period_end=ts,
            provider="openai",
            service_name=f"OpenAI {model}",
            resource_id=raw_dict.get("api_key_id", "default-key"),
            sku_id=model,
            billed_cost=cost,
            effective_cost=cost,
            currency="USD",
            tags=raw_dict.get("tags", {}),
            allocated_team=raw_dict.get("team_tag"),
            allocated_customer=raw_dict.get("customer_tag"),
            allocation_method="tag_exact" if raw_dict.get("team_tag") else "unallocated",
        )

    else:
        # Generic fallback
        now = datetime.now(timezone.utc)
        return CostFact(
            tenant_id=tenant_id,
            charge_period_start=now,
            charge_period_end=now,
            provider=provider_lower,
            service_name=raw_dict.get("service_name", "Cloud Service"),
            resource_id=raw_dict.get("resource_id", "res-generic"),
            sku_id="Standard",
            billed_cost=float(raw_dict.get("cost", 0.0)),
            effective_cost=float(raw_dict.get("cost", 0.0)),
            currency="USD",
            tags={},
            allocation_method="unallocated",
        )
