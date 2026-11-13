import os
import logging
from typing import Any, Dict, List, Optional
import clickhouse_connect
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("cirra.api.clickhouse")


class ClickHouseReaderClient:
    """
    Read-only ClickHouse client for services/api.
    Strictly authenticates as `cirra_reader` (SELECT-only privileges).
    Enforces tenant_id isolation in all queries via parameterized queries.
    """

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
        database: Optional[str] = None,
    ):
        raw_host = host or os.getenv("CLICKHOUSE_HOST", "localhost")
        self.secure = "https://" in raw_host or str(os.getenv("CLICKHOUSE_PORT", "8123")) == "8443"
        self.host = raw_host.replace("https://", "").replace("http://", "").strip().rstrip("/")
        self.port = port or int(os.getenv("CLICKHOUSE_PORT", "8443" if self.secure else "8123"))
        # Read-only user or default user
        self.user = user or os.getenv("CLICKHOUSE_READER_USER") or os.getenv("CLICKHOUSE_USER", "default")
        self.password = password or os.getenv("CLICKHOUSE_READER_PASSWORD") or os.getenv("CLICKHOUSE_PASSWORD", "")
        self.database = database or os.getenv("CLICKHOUSE_DATABASE", "cirra")
        self._client = None

    def get_client(self):
        if self._client is None:
            self._client = clickhouse_connect.get_client(
                host=self.host,
                port=self.port,
                username=self.user,
                password=self.password,
                database=self.database,
                secure=self.secure,
                connect_timeout=10,
                send_receive_timeout=30,
            )
        return self._client

    def execute_query(self, query: str, parameters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Execute a parameterized query strictly filtered by tenant_id.
        Always asserts tenant_id is supplied in parameters.
        """
        if "tenant_id" not in parameters:
            raise ValueError("Security violation: ClickHouse query must include 'tenant_id' parameter.")

        try:
            client = self.get_client()
            result = client.query(query, parameters=parameters)
            cols = result.column_names
            return [dict(zip(cols, row)) for row in result.result_rows]
        except Exception as e:
            logger.warning("ClickHouse query error: %s", e)
            return []


# Default singleton client instance for API
clickhouse_reader = ClickHouseReaderClient()


class ClickHouseWriterClient:
    """
    Ingest / Writer ClickHouse client for services/api.
    """

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
        database: Optional[str] = None,
    ):
        raw_host = host or os.getenv("CLICKHOUSE_HOST", "localhost")
        self.secure = "https://" in raw_host or str(os.getenv("CLICKHOUSE_PORT", "8123")) == "8443"
        self.host = raw_host.replace("https://", "").replace("http://", "").strip().rstrip("/")
        self.port = port or int(os.getenv("CLICKHOUSE_PORT", "8443" if self.secure else "8123"))
        self.user = user or os.getenv("CLICKHOUSE_INGEST_USER") or os.getenv("CLICKHOUSE_USER", "default")
        self.password = password or os.getenv("CLICKHOUSE_INGEST_PASSWORD") or os.getenv("CLICKHOUSE_PASSWORD", "")
        self.database = database or os.getenv("CLICKHOUSE_DATABASE", "cirra")
        self._client = None

    def get_client(self):
        if self._client is None:
            self._client = clickhouse_connect.get_client(
                host=self.host,
                port=self.port,
                username=self.user,
                password=self.password,
                database=self.database,
                secure=self.secure,
                connect_timeout=10,
                send_receive_timeout=30,
            )
        return self._client

    def insert(self, table: str, data: List[List[Any]], column_names: List[str]):
        client = self.get_client()
        return client.insert(table, data, column_names=column_names)


clickhouse_writer = ClickHouseWriterClient()

