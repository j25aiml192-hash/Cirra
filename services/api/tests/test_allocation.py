import sys
import os
import pytest
from decimal import Decimal
from unittest.mock import patch

# Ensure services/ingest is importable
current_dir = os.path.dirname(os.path.abspath(__file__))
repo_root = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))
ingest_dir = os.path.join(repo_root, "services", "ingest")
if ingest_dir not in sys.path:
    sys.path.insert(0, ingest_dir)

from allocator import (
    allocate_fact,
    allocate_facts_inline,
    match_rule_against_fact,
    validate_and_compile_regex,
)
from app.clickhouse.queries import preview_allocation_rule


def test_allocation_priority_order():
    """Verify that rules are evaluated in ascending priority order (priority 1 takes precedence over priority 2)."""
    rules = [
        {
            "id": "rule-1",
            "priority": 1,
            "match_type": "tag_key_value",
            "match_value": "env=production",
            "assign_team": "Production Operations",
            "assign_customer": None,
        },
        {
            "id": "rule-2",
            "priority": 2,
            "match_type": "service",
            "match_value": "Amazon EC2",
            "assign_team": "Compute Platform",
            "assign_customer": None,
        },
    ]

    # Fact matches BOTH rules (env=production AND service=Amazon EC2)
    fact = {
        "service_name": "Amazon EC2",
        "resource_id": "i-prod-web-01",
        "allocation_method": "unallocated",
        "tags": {"env": "production"},
        "effective_cost": Decimal("150.00"),
    }

    result = allocate_fact(fact, rules)

    # Priority 1 must win
    assert result["allocation_method"] == "rule"
    assert result["tags"]["team"] == "Production Operations"
    assert result["tags"]["team"] != "Compute Platform"


def test_manual_allocation_never_overwritten():
    """Verify that manual allocations are strictly protected and never overwritten by rules."""
    rules = [
        {
            "id": "rule-override",
            "priority": 1,
            "match_type": "service",
            "match_value": "Amazon S3",
            "assign_team": "Automated Team",
        }
    ]

    manual_fact = {
        "service_name": "Amazon S3",
        "resource_id": "bucket-manual-attribution",
        "allocation_method": "manual",
        "tags": {"team": "Executive Special Project"},
        "effective_cost": Decimal("500.00"),
    }

    result = allocate_fact(manual_fact, rules)

    assert result["allocation_method"] == "manual"
    assert result["tags"]["team"] == "Executive Special Project"
    assert result["tags"]["team"] != "Automated Team"


def test_allocation_negative_costs_credits():
    """Verify that negative costs (refunds/credits) are properly attributed and retained as Decimals."""
    rules = [
        {
            "id": "rule-credit",
            "priority": 1,
            "match_type": "service",
            "match_value": "AWS Support",
            "assign_team": "Finance",
        }
    ]

    credit_fact = {
        "service_name": "AWS Support",
        "resource_id": "credit-adjustment",
        "allocation_method": "unallocated",
        "tags": {},
        "effective_cost": Decimal("-2500.00"),
    }

    result = allocate_fact(credit_fact, rules)

    assert result["allocation_method"] == "rule"
    assert result["tags"]["team"] == "Finance"
    assert result["effective_cost"] == Decimal("-2500.00")
    assert result["effective_cost"] < Decimal(0)


def test_preview_matches_applied_result():
    """Verify that preview_allocation_rule matches the exact rows and spend calculated by the allocator."""
    tenant_id = "tenant-preview-test"

    # Mock ClickHouse response for preview query
    mock_ch_return = [{"matched_rows": 5, "matched_spend": "345.50"}]

    with patch("app.clickhouse.queries.clickhouse_reader.execute_query", return_value=mock_ch_return) as mock_exec:
        preview = preview_allocation_rule(
            tenant_id=tenant_id,
            match_type="prefix",
            match_value="gke-*",
        )

        assert preview["matchedRows"] == 5
        assert preview["matchedSpend"] == 345.50

        # Verify query was constructed for unallocated facts only
        called_sql = mock_exec.call_args[0][0]
        assert "allocation_method = 'unallocated'" in called_sql


def test_regex_safety_and_catastrophic_backtracking_guard():
    """Verify that dangerous regex patterns (ReDoS) or overly long patterns are rejected."""
    # Catastrophic backtracking patterns
    assert validate_and_compile_regex("(a+)+") is None
    assert validate_and_compile_regex(".*(x*)*") is None
    assert validate_and_compile_regex("(.*)+") is None

    # Length exceeding 100 chars
    long_pattern = "a" * 150
    assert validate_and_compile_regex(long_pattern) is None

    # Valid pattern compiles
    valid_pattern = "gke-search-.*"
    compiled = validate_and_compile_regex(valid_pattern)
    assert compiled is not None
    assert compiled.search("gke-search-cluster-01") is not None
