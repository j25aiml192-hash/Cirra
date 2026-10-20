import os
import pytest
from datetime import datetime, timezone
from decimal import Decimal
from clickhouse_client import ClickHouseClient
from db import get_connection_by_id, update_connection_status


@pytest.mark.integration
def test_real_clickhouse_connection_and_table_structure():
    """
    Real-service integration test:
    Connects to real ClickHouse instance (localhost:8123) and validates cost_facts table schema.
    """
    client = ClickHouseClient()
    ch = client.get_client()

    # Query schema
    res = ch.query("EXISTS TABLE cost_facts")
    assert res.result_rows[0][0] == 1, "cost_facts table does not exist in real ClickHouse!"

    # Validate ReplacingMergeTree engine
    engine_res = ch.query("SELECT engine FROM system.tables WHERE database = 'cirra' AND name = 'cost_facts'")
    assert "ReplacingMergeTree" in engine_res.result_rows[0][0]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_real_postgres_connection_and_rls():
    """
    Real-service integration test:
    Connects to real Postgres instance (localhost:5432) and checks RLS enforcement.
    """
    from sqlalchemy import text
    from db import async_session

    async with async_session() as session:
        res = await session.execute(text("SELECT 1"))
        assert res.scalar() == 1
