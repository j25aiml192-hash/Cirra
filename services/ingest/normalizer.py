import hashlib
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CostFact(BaseModel):
    tenant_id: str
    charge_period_start: datetime
    charge_period_end: datetime
    billed_cost: Decimal = Field(..., description="Decimal money amount, never float")
    effective_cost: Decimal = Field(..., description="Decimal effective cost with discounts/amortization")
    currency: str = "USD"
    provider: str
    service_name: str
    service_category: str = "Compute"
    region: str = "global"
    resource_id: str = "unknown"
    sku_id: str = "unknown"
    tags: Dict[str, str] = Field(default_factory=dict)
    allocation_method: str = "unallocated"
    row_hash: str
    version: int = 1

    model_config = ConfigDict(from_attributes=True)


class AIUsageFact(BaseModel):
    tenant_id: str
    timestamp: datetime
    provider: str
    model: str
    api_key_id: str = "unknown"
    input_tokens: int = 0
    output_tokens: int = 0
    cached_tokens: int = 0
    cost_usd: Decimal = Field(..., description="Decimal cost in USD, never float")
    row_hash: str
    tags: Dict[str, str] = Field(default_factory=dict)
    version: int = 1

    model_config = ConfigDict(from_attributes=True)


def calculate_cost_row_hash(
    tenant_id: str,
    charge_period_start: datetime,
    provider: str,
    resource_id: str,
    sku_id: str
) -> str:
    """Deterministic hash: sha256(tenant_id, charge_period_start, provider, resource_id, sku_id)."""
    start_iso = charge_period_start.isoformat()
    raw = f"{tenant_id}:{start_iso}:{provider}:{resource_id}:{sku_id}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def calculate_ai_row_hash(
    tenant_id: str,
    timestamp: datetime,
    provider: str,
    model: str,
    api_key_id: str
) -> str:
    """Deterministic hash for AI token usage."""
    ts_iso = timestamp.isoformat()
    raw = f"{tenant_id}:{ts_iso}:{provider}:{model}:{api_key_id}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def normalize_aws_cost_explorer(raw: Dict[str, Any], tenant_id: str) -> List[CostFact]:
    """
    Pure function normalizing AWS Cost Explorer (ce:GetCostAndUsage) API response to FOCUS schema.
    
    Field mappings:
    - TimePeriod.Start -> charge_period_start
    - TimePeriod.End -> charge_period_end
    - Metrics.UnblendedCost.Amount -> billed_cost (Decimal)
    - Metrics.NetAmortizedCost.Amount / UnblendedCost -> effective_cost (Decimal)
    - Metrics.UnblendedCost.Unit -> currency (keeps original currency as given)
    - Group Key 0 -> service_name
    - Group Key 1 (if present) -> region
    - Group Key 2 (if present) -> resource_id / sku_id
    - Any unmapped metadata/attributes -> stored in tags (never silently dropped)
    """
    facts: List[CostFact] = []
    results_by_time = raw.get("ResultsByTime", [])

    for period_bucket in results_by_time:
        time_period = period_bucket.get("TimePeriod", {})
        start_str = time_period.get("Start", "1970-01-01")
        end_str = time_period.get("End", "1970-01-02")

        # Parse dates
        start_dt = datetime.fromisoformat(start_str) if "T" in start_str else datetime.strptime(start_str, "%Y-%m-%d")
        end_dt = datetime.fromisoformat(end_str) if "T" in end_str else datetime.strptime(end_str, "%Y-%m-%d")

        groups = period_bucket.get("Groups", [])
        if not groups:
            # Check for aggregate Total
            total = period_bucket.get("Total", {})
            metrics = total
            groups = [{"Keys": ["AWS Total", "global", "all-resources"], "Metrics": metrics}]

        for group in groups:
            keys = group.get("Keys", [])
            service_name = keys[0] if len(keys) > 0 else "Amazon Web Services"
            region = keys[1] if len(keys) > 1 else "global"
            resource_id = keys[2] if len(keys) > 2 else service_name.lower().replace(" ", "-")
            sku_id = keys[3] if len(keys) > 3 else "std-sku"

            metrics = group.get("Metrics", {})
            unblended = metrics.get("UnblendedCost", {})
            amortized = metrics.get("NetAmortizedCost") or metrics.get("AmortizedCost") or unblended

            # Handle cost amounts as Decimal (negative amounts for credits/refunds preserved)
            billed_amount_str = unblended.get("Amount", "0.00")
            effective_amount_str = amortized.get("Amount", billed_amount_str)

            billed_cost = Decimal(str(billed_amount_str))
            effective_cost = Decimal(str(effective_amount_str))
            currency = unblended.get("Unit", "USD")

            # Collect unmapped fields into tags
            tags: Dict[str, str] = {}
            for k, v in group.items():
                if k not in ["Keys", "Metrics"]:
                    tags[f"aws_{k}"] = str(v)
            for m_k, m_v in metrics.items():
                if m_k not in ["UnblendedCost", "NetAmortizedCost", "AmortizedCost"]:
                    tags[f"metric_{m_k}"] = str(m_v.get("Amount", ""))

            # Compute row hash
            row_hash = calculate_cost_row_hash(
                tenant_id=tenant_id,
                charge_period_start=start_dt,
                provider="AWS",
                resource_id=resource_id,
                sku_id=sku_id
            )

            facts.append(
                CostFact(
                    tenant_id=tenant_id,
                    charge_period_start=start_dt,
                    charge_period_end=end_dt,
                    billed_cost=billed_cost,
                    effective_cost=effective_cost,
                    currency=currency,
                    provider="AWS",
                    service_name=service_name,
                    service_category="Compute" if "Elastic" in service_name else "Storage" if "S3" in service_name else "Cloud",
                    region=region,
                    resource_id=resource_id,
                    sku_id=sku_id,
                    tags=tags,
                    allocation_method="unallocated",
                    row_hash=row_hash,
                    version=1
                )
            )

    return facts


def normalize_openai_usage(raw: Dict[str, Any], tenant_id: str) -> List[AIUsageFact]:
    """
    Pure function normalizing OpenAI organization usage/costs to FOCUS ai_usage_facts.
    
    Field mappings:
    - aggregation_timestamp / timestamp -> timestamp
    - snapshot_id / model -> model name
    - api_key_id / key_name -> api_key_id
    - n_context_tokens_total / input_tokens -> input_tokens
    - n_generated_tokens_total / output_tokens -> output_tokens
    - n_context_tokens_cached / cached_tokens -> cached_tokens
    - cost / amount_usd -> cost_usd (Decimal, never float)
    - Extra parameters/metadata -> tags
    """
    facts: List[AIUsageFact] = []
    data_items = raw.get("data", []) if isinstance(raw.get("data"), list) else [raw]

    for item in data_items:
        # Timestamp
        ts_val = item.get("aggregation_timestamp") or item.get("timestamp") or item.get("start_time")
        if isinstance(ts_val, (int, float)):
            ts = datetime.fromtimestamp(ts_val, tz=timezone.utc)
        elif isinstance(ts_val, str):
            ts = datetime.fromisoformat(ts_val.replace("Z", "+00:00"))
        else:
            ts = datetime.now(timezone.utc)

        model = item.get("snapshot_id") or item.get("model") or "gpt-4o"
        api_key_id = item.get("api_key_id") or item.get("api_key_name") or "default_key"

        input_tokens = int(item.get("n_context_tokens_total") or item.get("input_tokens") or 0)
        output_tokens = int(item.get("n_generated_tokens_total") or item.get("output_tokens") or 0)
        cached_tokens = int(item.get("n_context_tokens_cached") or item.get("cached_tokens") or 0)

        # Cost calculation / retrieval as Decimal
        cost_raw = item.get("cost_usd") or item.get("cost") or item.get("amount")
        if cost_raw is not None:
            cost_usd = Decimal(str(cost_raw))
        else:
            # Fallback estimation if raw usage only provides token counts:
            # e.g. gpt-4o approx $5/1M input, $15/1M output
            est = (Decimal(input_tokens) * Decimal("0.000005")) + (Decimal(output_tokens) * Decimal("0.000015"))
            cost_usd = est.quantize(Decimal("0.000001"))

        # Collect unmapped metadata into tags
        tags: Dict[str, str] = {}
        for k, v in item.items():
            if k not in [
                "aggregation_timestamp", "timestamp", "start_time", "snapshot_id",
                "model", "api_key_id", "api_key_name", "n_context_tokens_total",
                "input_tokens", "n_generated_tokens_total", "output_tokens",
                "n_context_tokens_cached", "cached_tokens", "cost_usd", "cost", "amount"
            ]:
                tags[f"openai_{k}"] = str(v)

        row_hash = calculate_ai_row_hash(
            tenant_id=tenant_id,
            timestamp=ts,
            provider="OpenAI",
            model=model,
            api_key_id=api_key_id
        )

        facts.append(
            AIUsageFact(
                tenant_id=tenant_id,
                timestamp=ts,
                provider="OpenAI",
                model=model,
                api_key_id=api_key_id,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cached_tokens=cached_tokens,
                cost_usd=cost_usd,
                row_hash=row_hash,
                tags=tags,
                version=1
            )
        )

    return facts
