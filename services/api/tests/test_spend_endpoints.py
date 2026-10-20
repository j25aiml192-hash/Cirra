import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock, AsyncMock
from decimal import Decimal
from app.clickhouse.queries import get_cloud_spend, get_ai_spend


@pytest.mark.asyncio
async def test_invalid_group_by_returns_422(client: AsyncClient, token_tenant_a_viewer):
    """Allow-list validation: an invalid group_by returns 422 and never reaches SQL."""
    res = await client.get(
        "/api/v1/spend/cloud?group_by=drop_table_users",
        headers={"Authorization": f"Bearer {token_tenant_a_viewer}"},
    )
    assert res.status_code == 422
    assert "Invalid group_by" in str(res.json())


@pytest.mark.asyncio
async def test_invalid_sort_by_returns_422(client: AsyncClient, token_tenant_a_viewer):
    """Allow-list validation: an invalid sort_by returns 422."""
    res = await client.get(
        "/api/v1/spend/cloud?sort_by=injection_column",
        headers={"Authorization": f"Bearer {token_tenant_a_viewer}"},
    )
    assert res.status_code == 422
    assert "Invalid sort_by" in str(res.json())


@pytest.mark.asyncio
async def test_invalid_ai_group_by_returns_422(client: AsyncClient, token_tenant_a_viewer):
    """Allow-list validation for AI spend: invalid group_by returns 422."""
    res = await client.get(
        "/api/v1/spend/ai?group_by=invalid_param",
        headers={"Authorization": f"Bearer {token_tenant_a_viewer}"},
    )
    assert res.status_code == 422
    assert "Invalid group_by" in str(res.json())


@pytest.mark.asyncio
async def test_empty_tenant_returns_zero_state_shapes(client: AsyncClient, token_tenant_a_viewer):
    """Empty tenant returns valid zero-state response shapes rather than 500 error."""
    from unittest.mock import AsyncMock
    from app.main import app
    from app.deps import get_db_tenant_session

    async def mock_db_session():
        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.fetchone.return_value = (None, 0)
        mock_session.execute.return_value = mock_result
        yield mock_session

    app.dependency_overrides[get_db_tenant_session] = mock_db_session

    try:
        with patch("app.clickhouse.queries.clickhouse_reader.execute_query", return_value=[]):
            # 1. Dashboard summary zero state
            res_dash = await client.get(
                "/api/v1/dashboard/summary",
                headers={"Authorization": f"Bearer {token_tenant_a_viewer}"},
            )
            assert res_dash.status_code == 200
            dash_data = res_dash.json()
            assert dash_data["total_spend_mtd"] == 0.0
            assert dash_data["cloud_spend_mtd"] == 0.0
            assert dash_data["ai_spend_mtd"] == 0.0
            assert dash_data["topServices"] == []
            assert dash_data["topAiKeys"] == []
            assert dash_data["attributionCoverage"]["percentage"] == 0.0

            # 2. Cloud spend zero state
            res_cloud = await client.get(
                "/api/v1/spend/cloud",
                headers={"Authorization": f"Bearer {token_tenant_a_viewer}"},
            )
            assert res_cloud.status_code == 200
            cloud_data = res_cloud.json()
            assert cloud_data["totalCost"] == 0.0
            assert cloud_data["items"] == []
            assert cloud_data["dailyVelocity"] == []

            # 3. AI spend zero state
            res_ai = await client.get(
                "/api/v1/spend/ai",
                headers={"Authorization": f"Bearer {token_tenant_a_viewer}"},
            )
            assert res_ai.status_code == 200
            ai_data = res_ai.json()
            assert ai_data["totalCostUsd"] == 0.0
            assert ai_data["totalTokens"] == 0
            assert ai_data["items"] == []
    finally:
        app.dependency_overrides.pop(get_db_tenant_session, None)


def test_hand_calculated_fixed_fixture_spend_totals():
    """Verify that spend totals strictly equal hand-calculated expected values from a fixed fixture."""
    # Hand-crafted fixed fixture:
    # 3 EC2 items: $10.50, $20.25, $5.25 -> Sum = $36.00
    mock_db_rows = [
        {"total_spend": "36.00"},
    ]
    mock_items_rows = [
        {
            "service_name": "Amazon EC2",
            "provider": "AWS",
            "region": "us-east-1",
            "spend": "36.00",
            "billed_cost": "36.00",
            "attributed": 1,
            "team": "Core Platform",
        }
    ]

    with patch("app.clickhouse.queries.clickhouse_reader.execute_query") as mock_exec:
        mock_exec.side_effect = [
            mock_db_rows,      # total_query
            mock_items_rows,   # items_query
            [],                # daily_velocity
        ]

        result = get_cloud_spend(tenant_id="tenant-fixed-fixture")

        # Hand-calculated expectation
        expected_total = 36.00
        assert result["totalCost"] == expected_total
        assert result["total_cost"] == expected_total
        assert len(result["items"]) == 1
        assert result["items"][0]["spend"] == expected_total
        assert result["items"][0]["impactPercent"] == 100.0


def test_cross_tenant_isolation_in_queries():
    """Verify that tenant A queries never leak tenant B data, even when B's filters are supplied."""
    tenant_a = "tenant-aaaa"
    tenant_b = "tenant-bbbb"

    with patch("app.clickhouse.queries.clickhouse_reader.execute_query") as mock_exec:
        mock_exec.return_value = []

        # Tenant A executes query, attempting to filter by Tenant B's account
        get_cloud_spend(
            tenant_id=tenant_a,
            account_id="account-of-tenant-b",
            service="tenant-b-private-service",
        )

        # Check call arguments
        assert mock_exec.call_count >= 1
        for call_args in mock_exec.call_args_list:
            sql = call_args[0][0]
            params = call_args[0][1] if len(call_args[0]) > 1 else call_args[1].get("parameters", {})
            # Tenant ID must strictly be Tenant A, parameterized
            assert params["tenant_id"] == tenant_a
            assert params["tenant_id"] != tenant_b
            assert "tenant_id = %(tenant_id)s" in sql
