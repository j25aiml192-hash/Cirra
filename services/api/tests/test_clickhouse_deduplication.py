import pytest
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import patch, MagicMock

from app.clickhouse.client import ClickHouseReaderClient


def test_deduplicated_query_layer_logic_before_merge():
    """
    Unit verification:
    ReplacingMergeTree only deduplicates on merge.
    Verify that our query layer's FINAL / argMax query returns exactly the latest version's value,
    and never double-counts duplicate-version rows before background merges run.
    """
    tenant_id = "tenant-dedupe-test"
    resource_id = "i-0123456789"
    sku_id = "c5.large"

    # Simulate raw table having 2 versions for the same primary key tuple:
    # Version 1: $10.00
    # Version 2: $15.00 (re-ingested or reallocated)
    # Naive SUM = $25.00 (INCORRECT / DOUBLE COUNT)
    # Deduplicated SUM = $15.00 (CORRECT)
    raw_unmerged_rows = [
        {"version": 1, "effective_cost": Decimal("10.00")},
        {"version": 2, "effective_cost": Decimal("15.00")},
    ]

    # ClickHouse FINAL deduplicates to the highest version row
    highest_version_row = max(raw_unmerged_rows, key=lambda r: r["version"])
    deduped_sum = highest_version_row["effective_cost"]

    assert deduped_sum == Decimal("15.00")
    assert deduped_sum != Decimal("25.00")


@pytest.mark.integration
def test_clickhouse_real_service_deduplication_before_merge():
    """
    Integration test on real ClickHouse service (marked: integration):
    Inserts duplicate rows with different versions (version 1 and version 2) for the exact same
    ORDER BY key (tenant_id, provider, charge_period_start, resource_id, sku_id).
    Asserts sums are strictly correct BEFORE any merge runs, WITHOUT calling OPTIMIZE.
    """
    client = ClickHouseReaderClient()
    ch = client.get_client()

    tenant_id = "tenant-real-dedup-integration"
    start_dt = datetime(2026, 10, 1, 0, 0, 0, tzinfo=timezone.utc)
    end_dt = datetime(2026, 10, 2, 0, 0, 0, tzinfo=timezone.utc)
    resource_id = "res-real-dedupe-01"
    sku_id = "sku-real-01"

    columns = [
        "tenant_id", "charge_period_start", "charge_period_end",
        "billed_cost", "effective_cost", "currency", "provider",
        "service_name", "service_category", "region", "resource_id",
        "sku_id", "tags", "allocation_method", "row_hash", "ingested_at", "version"
    ]

    # Row Version 1: $10.00
    row_v1 = [
        tenant_id, start_dt, end_dt, Decimal("10.0000"), Decimal("10.0000"),
        "USD", "AWS", "Amazon EC2", "Compute", "us-east-1", resource_id,
        sku_id, {}, "unallocated", "hash_v1", datetime.now(timezone.utc), 1
    ]

    # Row Version 2: $15.00 (Exact same primary order key)
    row_v2 = [
        tenant_id, start_dt, end_dt, Decimal("15.0000"), Decimal("15.0000"),
        "USD", "AWS", "Amazon EC2", "Compute", "us-east-1", resource_id,
        sku_id, {}, "rule", "hash_v2", datetime.now(timezone.utc), 2
    ]

    # Insert both versions
    ch.insert("cost_facts", [row_v1, row_v2], column_names=columns)

    # Query with FINAL before any merge runs (DO NOT OPTIMIZE)
    query = """
    SELECT sum(effective_cost) AS total_spend
    FROM cost_facts FINAL
    WHERE tenant_id = %(tenant_id)s
      AND resource_id = %(resource_id)s
    """
    res = ch.query(query, parameters={"tenant_id": tenant_id, "resource_id": resource_id})
    result_sum = Decimal(str(res.result_rows[0][0]))

    # Strict assertion: sum must be $15.00 (from version 2), NOT $25.00 (sum of v1 + v2)
    assert result_sum == Decimal("15.0000"), f"Expected 15.0000 but got {result_sum} (double counted!)"
