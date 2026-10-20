import os
from datetime import datetime
from typing import Any, Dict, List, Optional
import clickhouse_connect


class ClickHouseClient:
    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
        database: Optional[str] = None
    ):
        self.host = host or os.getenv("CLICKHOUSE_HOST", "localhost")
        self.port = port or int(os.getenv("CLICKHOUSE_PORT", "8123"))
        self.user = user or os.getenv("CLICKHOUSE_USER", "default")
        self.password = password or os.getenv("CLICKHOUSE_PASSWORD", "")
        self.database = database or os.getenv("CLICKHOUSE_DATABASE", "cirra")
        self._client = None

    def get_client(self):
        if self._client is None:
            self._client = clickhouse_connect.get_client(
                host=self.host,
                port=self.port,
                username=self.user,
                password=self.password,
                database=self.database
            )
        return self._client

    def insert_cost_facts(self, facts: List[Dict[str, Any]]) -> int:
        if not facts:
            return 0
        client = self.get_client()

        columns = [
            "tenant_id", "charge_period_start", "charge_period_end",
            "billed_cost", "effective_cost", "currency", "provider",
            "service_name", "service_category", "region", "resource_id",
            "sku_id", "tags", "allocation_method", "row_hash",
            "ingested_at", "version"
        ]

        data = []
        for item in facts:
            f = item.model_dump() if hasattr(item, "model_dump") else item
            data.append([
                str(f["tenant_id"]),
                f["charge_period_start"],
                f["charge_period_end"],
                f["billed_cost"],
                f["effective_cost"],
                f["currency"],
                f["provider"],
                f["service_name"],
                f["service_category"],
                f["region"],
                f["resource_id"],
                f["sku_id"],
                f["tags"],
                f["allocation_method"],
                f["row_hash"],
                f.get("ingested_at", datetime.utcnow()),
                f.get("version", 1)
            ])

        client.insert("cost_facts", data, column_names=columns)
        return len(data)

    def insert_ai_usage_facts(self, facts: List[Any]) -> int:
        if not facts:
            return 0
        client = self.get_client()

        columns = [
            "tenant_id", "timestamp", "provider", "model", "api_key_id",
            "input_tokens", "output_tokens", "cached_tokens", "cost_usd",
            "row_hash", "tags", "ingested_at", "version"
        ]

        data = []
        for item in facts:
            f = item.model_dump() if hasattr(item, "model_dump") else item
            data.append([
                str(f["tenant_id"]),
                f["timestamp"],
                f["provider"],
                f["model"],
                f["api_key_id"],
                f["input_tokens"],
                f["output_tokens"],
                f["cached_tokens"],
                f["cost_usd"],
                f["row_hash"],
                f["tags"],
                f.get("ingested_at", datetime.utcnow()),
                f.get("version", 1)
            ])

        client.insert("ai_usage_facts", data, column_names=columns)
        return len(data)

    def query_cost_facts(
        self,
        tenant_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Query cost_facts strictly filtered by tenant_id using parameterized query."""
        client = self.get_client()
        query = "SELECT * FROM cost_facts WHERE tenant_id = %(tenant_id)s"
        params: Dict[str, Any] = {"tenant_id": tenant_id}

        if start_date:
            query += " AND charge_period_start >= %(start_date)s"
            params["start_date"] = start_date
        if end_date:
            query += " AND charge_period_end <= %(end_date)s"
            params["end_date"] = end_date

        query += " ORDER BY charge_period_start DESC"

        result = client.query(query, parameters=params)
        cols = result.column_names
        return [dict(zip(cols, row)) for row in result.result_rows]

    def query_ai_usage_facts(
        self,
        tenant_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Query ai_usage_facts strictly filtered by tenant_id using parameterized query."""
        client = self.get_client()
        query = "SELECT * FROM ai_usage_facts WHERE tenant_id = %(tenant_id)s"
        params: Dict[str, Any] = {"tenant_id": tenant_id}

        if start_date:
            query += " AND timestamp >= %(start_date)s"
            params["start_date"] = start_date
        if end_date:
            query += " AND timestamp <= %(end_date)s"
            params["end_date"] = end_date

        query += " ORDER BY timestamp DESC"

        result = client.query(query, parameters=params)
        cols = result.column_names
        return [dict(zip(cols, row)) for row in result.result_rows]
