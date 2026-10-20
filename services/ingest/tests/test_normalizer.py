import pytest
from datetime import datetime, timezone
from decimal import Decimal
from normalizer import (
    normalize_aws_cost_explorer,
    normalize_openai_usage,
    calculate_cost_row_hash,
    calculate_ai_row_hash,
    CostFact,
    AIUsageFact,
)


def test_aws_normalizer_standard():
    tenant_id = "tenant-uuid-1234"
    raw_fixture = {
        "ResultsByTime": [
            {
                "TimePeriod": {
                    "Start": "2026-10-01",
                    "End": "2026-10-02"
                },
                "Total": {},
                "Groups": [
                    {
                        "Keys": ["Amazon Elastic Compute Cloud - Compute", "us-east-1", "i-0123456789abcdef0", "c5.xlarge"],
                        "Metrics": {
                            "UnblendedCost": {"Amount": "12.3456", "Unit": "USD"},
                            "NetAmortizedCost": {"Amount": "11.5000", "Unit": "USD"}
                        },
                        "ExtraAwsField": "IgnoredByCoreShouldBeInTags"
                    }
                ],
                "Estimated": False
            }
        ]
    }

    facts = normalize_aws_cost_explorer(raw_fixture, tenant_id=tenant_id)

    assert len(facts) == 1
    fact = facts[0]
    assert isinstance(fact, CostFact)
    assert fact.tenant_id == tenant_id
    assert fact.provider == "AWS"
    assert fact.service_name == "Amazon Elastic Compute Cloud - Compute"
    assert fact.service_category == "Compute"
    assert fact.region == "us-east-1"
    assert fact.resource_id == "i-0123456789abcdef0"
    assert fact.sku_id == "c5.xlarge"
    assert fact.currency == "USD"
    assert fact.allocation_method == "unallocated"

    # Strict Decimal checks (never float)
    assert isinstance(fact.billed_cost, Decimal)
    assert fact.billed_cost == Decimal("12.3456")
    assert isinstance(fact.effective_cost, Decimal)
    assert fact.effective_cost == Decimal("11.5000")

    # Extra fields go to tags, never silently dropped
    assert "aws_ExtraAwsField" in fact.tags
    assert fact.tags["aws_ExtraAwsField"] == "IgnoredByCoreShouldBeInTags"


def test_aws_normalizer_zero_cost():
    tenant_id = "tenant-uuid-1234"
    raw_fixture = {
        "ResultsByTime": [
            {
                "TimePeriod": {"Start": "2026-10-01", "End": "2026-10-02"},
                "Groups": [
                    {
                        "Keys": ["AWS Key Management Service", "us-east-1", "key-1234", "kms-key"],
                        "Metrics": {
                            "UnblendedCost": {"Amount": "0.0000", "Unit": "USD"},
                            "NetAmortizedCost": {"Amount": "0.0000", "Unit": "USD"}
                        }
                    }
                ]
            }
        ]
    }
    facts = normalize_aws_cost_explorer(raw_fixture, tenant_id)
    assert len(facts) == 1
    assert facts[0].billed_cost == Decimal("0.0000")
    assert facts[0].effective_cost == Decimal("0.0000")


def test_aws_normalizer_negative_credits_refunds():
    tenant_id = "tenant-uuid-1234"
    raw_fixture = {
        "ResultsByTime": [
            {
                "TimePeriod": {"Start": "2026-10-01", "End": "2026-10-02"},
                "Groups": [
                    {
                        "Keys": ["AWS Support (Business)", "global", "support-entitlement", "support-plan"],
                        "Metrics": {
                            "UnblendedCost": {"Amount": "-250.0000", "Unit": "USD"},
                            "NetAmortizedCost": {"Amount": "-250.0000", "Unit": "USD"}
                        }
                    }
                ]
            }
        ]
    }
    facts = normalize_aws_cost_explorer(raw_fixture, tenant_id)
    assert len(facts) == 1
    assert facts[0].billed_cost == Decimal("-250.0000")
    assert facts[0].billed_cost < 0


def test_aws_normalizer_multi_currency():
    tenant_id = "tenant-uuid-1234"
    raw_fixture = {
        "ResultsByTime": [
            {
                "TimePeriod": {"Start": "2026-10-01", "End": "2026-10-02"},
                "Groups": [
                    {
                        "Keys": ["Amazon EC2", "eu-central-1", "i-frankfurt", "t3.medium"],
                        "Metrics": {
                            "UnblendedCost": {"Amount": "45.20", "Unit": "EUR"},
                            "NetAmortizedCost": {"Amount": "45.20", "Unit": "EUR"}
                        }
                    }
                ]
            }
        ]
    }
    facts = normalize_aws_cost_explorer(raw_fixture, tenant_id)
    assert facts[0].currency == "EUR"
    assert facts[0].billed_cost == Decimal("45.20")


def test_deterministic_row_hashes():
    start = datetime(2026, 10, 1, 0, 0, 0, tzinfo=timezone.utc)
    h1 = calculate_cost_row_hash("t1", start, "AWS", "res-1", "sku-1")
    h2 = calculate_cost_row_hash("t1", start, "AWS", "res-1", "sku-1")
    h3 = calculate_cost_row_hash("t2", start, "AWS", "res-1", "sku-1")

    assert h1 == h2
    assert h1 != h3
    assert len(h1) == 64


def test_openai_normalizer_standard():
    tenant_id = "tenant-uuid-5678"
    raw_fixture = {
        "data": [
            {
                "timestamp": 1729440000,
                "model": "gpt-4o",
                "api_key_id": "key_app_primary",
                "input_tokens": 15000,
                "output_tokens": 3000,
                "cached_tokens": 5000,
                "cost_usd": "0.120500",
                "custom_project_id": "proj_internal_agent"
            }
        ]
    }

    facts = normalize_openai_usage(raw_fixture, tenant_id)
    assert len(facts) == 1
    fact = facts[0]
    assert isinstance(fact, AIUsageFact)
    assert fact.tenant_id == tenant_id
    assert fact.provider == "OpenAI"
    assert fact.model == "gpt-4o"
    assert fact.api_key_id == "key_app_primary"
    assert fact.input_tokens == 15000
    assert fact.output_tokens == 3000
    assert fact.cached_tokens == 5000
    assert isinstance(fact.cost_usd, Decimal)
    assert fact.cost_usd == Decimal("0.120500")

    # Custom attributes must be preserved in tags
    assert fact.tags.get("openai_custom_project_id") == "proj_internal_agent"
