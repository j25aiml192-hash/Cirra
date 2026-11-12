from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
import logging
import time
from typing import Any, List, Optional
import clickhouse_connect
from clickhouse_connect.driver.client import Client

from app.config import settings

logger = logging.getLogger("cirra.investigator.query_runner")


@dataclass
class QueryExecutionResult:
    columns: List[str]
    rows: List[List[Any]]
    row_count: int
    execution_time_ms: float


def _normalize_value(val: Any) -> Any:
    """Convert Decimals to float, DateTimes to ISO strings, and recursively handle containers."""
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    if isinstance(val, dict):
        return {k: _normalize_value(v) for k, v in val.items()}
    if isinstance(val, (list, tuple)):
        return [_normalize_value(x) for x in val]
    return val


class ClickHouseQueryRunner:
    """
    Executes validated SELECT queries against ClickHouse as reader user.
    Enforces read-only credentials and formats results with Decimals converted to float
    and DateTimes converted to ISO strings.
    """

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
        database: Optional[str] = None,
        secure: Optional[bool] = None,
    ):
        self.host = host or settings.ch_clean_host
        self.port = port or settings.ch_port
        self.user = user or settings.ch_user
        self.password = password or settings.ch_password
        self.database = database or settings.CLICKHOUSE_DATABASE
        self.secure = secure if secure is not None else settings.ch_secure
        self._client: Optional[Client] = None

    def get_client(self) -> Client:
        if self._client is None:
            logger.info(
                f"Connecting to ClickHouse at {self.host}:{self.port} "
                f"(secure={self.secure}) as user '{self.user}'..."
            )
            self._client = clickhouse_connect.get_client(
                host=self.host,
                port=self.port,
                username=self.user,
                password=self.password,
                database=self.database,
                secure=self.secure,
                connect_timeout=15,
                send_receive_timeout=60,
            )
        return self._client

    def execute(self, sql: str) -> QueryExecutionResult:
        """
        Execute a validated query and return columns, rows, row_count, execution_time_ms.
        """
        client = self.get_client()
        start_time = time.perf_counter()

        logger.info(f"Executing ClickHouse query: {sql}")
        res = client.query(sql)

        execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        columns = list(res.column_names)
        normalized_rows: List[List[Any]] = []
        for raw_row in res.result_rows:
            normalized_rows.append([_normalize_value(cell) for cell in raw_row])

        return QueryExecutionResult(
            columns=columns,
            rows=normalized_rows,
            row_count=len(normalized_rows),
            execution_time_ms=execution_time_ms,
        )
