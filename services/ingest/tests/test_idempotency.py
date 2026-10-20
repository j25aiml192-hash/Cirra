import pytest
from datetime import datetime, timezone
from decimal import Decimal
from normalizer import (
    normalize_aws_cost_explorer,
    normalize_openai_usage,
    calculate_cost_row_hash,
)


def test_normalizer_idempotent_row_hashes():
    """Verify that re-normalizing the identical raw payload yields identical row hashes."""
    tenant_id = "tenant-idem-test"
    raw_payload = {
        "ResultsByTime": [
            {
                "TimePeriod": {"Start": "2026-10-01", "End": "2026-10-02"},
                "Groups": [
                    {
                        "Keys": ["Amazon EC2", "us-east-1", "i-abc12345", "std-ec2"],
                        "Metrics": {
                            "UnblendedCost": {"Amount": "10.00", "Unit": "USD"},
                            "NetAmortizedCost": {"Amount": "10.00", "Unit": "USD"},
                        },
                    },
                    {
                        "Keys": ["Amazon S3", "us-east-1", "bucket-logs", "std-s3"],
                        "Metrics": {
                            "UnblendedCost": {"Amount": "2.50", "Unit": "USD"},
                            "NetAmortizedCost": {"Amount": "2.50", "Unit": "USD"},
                        },
                    },
                ],
            }
        ]
    }

    run1 = normalize_aws_cost_explorer(raw_payload, tenant_id)
    run2 = normalize_aws_cost_explorer(raw_payload, tenant_id)

    assert len(run1) == len(run2) == 2
    for f1, f2 in zip(run1, run2):
        assert f1.row_hash == f2.row_hash
        assert f1.billed_cost == f2.billed_cost
        assert f1.resource_id == f2.resource_id
        assert f1.sku_id == f2.sku_id


def test_replacing_merge_tree_deduplication():
    """
    Simulate ClickHouse ReplacingMergeTree behavior:
    Ingesting identical facts for the same charge period deduplicates on the ORDER BY key
    (tenant_id, provider, charge_period_start, resource_id, sku_id).
    """
    tenant_id = "tenant-merge-test"
    raw_payload = {
        "ResultsByTime": [
            {
                "TimePeriod": {"Start": "2026-10-05", "End": "2026-10-06"},
                "Groups": [
                    {
                        "Keys": ["Amazon RDS", "us-west-2", "db-main", "r6g.xlarge"],
                        "Metrics": {"UnblendedCost": {"Amount": "42.00", "Unit": "USD"}},
                    }
                ],
            }
        ]
    }

    facts_run_1 = normalize_aws_cost_explorer(raw_payload, tenant_id)
    facts_run_2 = normalize_aws_cost_explorer(raw_payload, tenant_id)

    # In ClickHouse, ReplacingMergeTree dedupes by primary order key:
    # (tenant_id, provider, charge_period_start, resource_id, sku_id)
    table_state = {}

    def insert_to_simulated_clickhouse(facts):
        for f in facts:
            key = (f.tenant_id, f.provider, f.charge_period_start, f.resource_id, f.sku_id)
            # ReplacingMergeTree replaces with latest version
            table_state[key] = f

    # First ingestion pass
    insert_to_simulated_clickhouse(facts_run_1)
    count_after_first = len(table_state)
    assert count_after_first == 1

    # Second ingestion pass over the exact same time window
    insert_to_simulated_clickhouse(facts_run_2)
    count_after_second = len(table_state)

    # Row count must remain unchanged
    assert count_after_second == count_after_first == 1
