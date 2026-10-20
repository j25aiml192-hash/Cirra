import pytest
from unittest.mock import MagicMock
from datetime import datetime, timezone
from clickhouse_client import ClickHouseClient


def test_query_helpers_strictly_require_tenant_id():
    """Verify that ClickHouse client query helpers enforce tenant_id as a required argument."""
    client = ClickHouseClient()

    # Calling without tenant_id must raise a TypeError
    with pytest.raises(TypeError):
        client.query_cost_facts()  # type: ignore

    with pytest.raises(TypeError):
        client.query_ai_usage_facts()  # type: ignore


def test_clickhouse_query_filters_by_tenant_id_parameter():
    """Verify that query_cost_facts constructs parameterized queries strictly isolating tenant_id."""
    client = ClickHouseClient()
    mock_ch = MagicMock()
    client._client = mock_ch

    tenant_a = "tenant-aaa-111"
    tenant_b = "tenant-bbb-222"

    # Setup mock return data
    mock_result_a = MagicMock()
    mock_result_a.column_names = ["tenant_id", "service_name", "billed_cost"]
    mock_result_a.result_rows = [
        [tenant_a, "Amazon EC2", 10.50],
        [tenant_a, "Amazon S3", 2.00],
    ]
    mock_ch.query.return_value = mock_result_a

    # Query for Tenant A
    results_a = client.query_cost_facts(tenant_id=tenant_a)

    # Verify query call strictly passed tenant_id as parameter
    mock_ch.query.assert_called_once()
    called_sql, called_kwargs = mock_ch.query.call_args
    assert "tenant_id = %(tenant_id)s" in called_sql[0]
    assert called_kwargs["parameters"]["tenant_id"] == tenant_a

    # Assert returned rows belong strictly to Tenant A
    assert len(results_a) == 2
    for row in results_a:
        assert row["tenant_id"] == tenant_a
        assert row["tenant_id"] != tenant_b


def test_ai_query_filters_by_tenant_id_parameter():
    """Verify that query_ai_usage_facts strictly isolates by tenant_id."""
    client = ClickHouseClient()
    mock_ch = MagicMock()
    client._client = mock_ch

    tenant_a = "tenant-aaa-111"
    mock_result = MagicMock()
    mock_result.column_names = ["tenant_id", "model", "cost_usd"]
    mock_result.result_rows = [[tenant_a, "gpt-4o", 0.05]]
    mock_ch.query.return_value = mock_result

    results = client.query_ai_usage_facts(tenant_id=tenant_a)

    called_sql, called_kwargs = mock_ch.query.call_args
    assert "tenant_id = %(tenant_id)s" in called_sql[0]
    assert called_kwargs["parameters"]["tenant_id"] == tenant_a
    assert len(results) == 1
    assert results[0]["tenant_id"] == tenant_a
