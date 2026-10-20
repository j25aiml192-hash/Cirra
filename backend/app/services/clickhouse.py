from typing import Any, Dict, List
from app.core.database import get_clickhouse_client


class ClickHouseService:
    def __init__(self):
        self.client = get_clickhouse_client()

    def query(self, sql: str, parameters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        result = self.client.query(sql, parameters=parameters or {})
        columns = result.column_names
        return [dict(zip(columns, row)) for row in result.result_rows]
