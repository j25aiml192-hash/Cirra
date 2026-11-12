import asyncio
import json
import logging
import socket
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, AsyncGenerator, Dict, List, Optional
from urllib.parse import urlparse
import uuid

import asyncpg
from app.config import settings

logger = logging.getLogger("cirra.action_engine.db")

_pool: Optional[asyncpg.Pool] = None


def normalize_dsn(dsn: str) -> str:
    """Normalize SQLAlchemy-style postgresql+asyncpg DSN for asyncpg."""
    if dsn.startswith("postgresql+asyncpg://"):
        return "postgresql://" + dsn[len("postgresql+asyncpg://"):]
    return dsn


def can_connect_to_postgres(dsn: str, timeout: float = 0.5) -> bool:
    """Quick socket probe to check if PostgreSQL host:port is reachable."""
    try:
        parsed = urlparse(normalize_dsn(dsn))
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 5432
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False


async def init_db_pool() -> Optional[asyncpg.Pool]:
    """Initialize asyncpg connection pool if PostgreSQL is reachable."""
    global _pool
    dsn = normalize_dsn(settings.DATABASE_URL)

    # First probe with fast synchronous socket to avoid long IOCP hangs in sandbox/offline mode
    if not can_connect_to_postgres(dsn):
        logger.warning(
            "PostgreSQL is unreachable at %s. Using in-memory storage fallback.",
            dsn.split("@")[-1] if "@" in dsn else dsn,
        )
        _pool = None
        return None

    try:
        _pool = await asyncio.wait_for(
            asyncpg.create_pool(
                dsn=dsn,
                min_size=1,
                max_size=10,
                command_timeout=10.0,
            ),
            timeout=2.0,
        )
        logger.info("Successfully connected asyncpg pool to PostgreSQL at %s", dsn.split("@")[-1])
        return _pool
    except Exception as exc:
        logger.warning(
            "Could not connect to PostgreSQL (%s). Falling back to resilient in-memory storage: %s",
            dsn.split("@")[-1] if "@" in dsn else dsn,
            str(exc),
        )
        _pool = None
        return None


async def close_db_pool() -> None:
    """Close asyncpg connection pool."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("Closed asyncpg connection pool.")


def get_pool() -> Optional[asyncpg.Pool]:
    return _pool


class MockRecord(dict):
    """Dict subclass that allows attribute and item access, mimicking asyncpg.Record."""
    def __getattr__(self, name: str) -> Any:
        try:
            return self[name]
        except KeyError:
            raise AttributeError(f"'MockRecord' object has no attribute '{name}'")


class MockDBStore:
    """In-memory store simulating actions and savings_entries tables when Postgres is offline."""
    _instance = None

    def __init__(self):
        self.actions: Dict[str, Dict[str, Any]] = {}
        self.savings_entries: Dict[str, Dict[str, Any]] = {}
        self.anomalies: Dict[str, Dict[str, Any]] = {
            "00000000-0000-0000-0000-000000000010": {
                "id": "00000000-0000-0000-0000-000000000010",
                "tenant_id": "00000000-0000-0000-0000-000000000001",
                "series_key": "openai:key_prod_app_01",
                "provider": "openai",
                "api_key_id": "key_prod_app_01",
                "severity": "critical",
                "status": "open",
                "baseline_value": Decimal("50.00"),
                "actual_value": Decimal("250.00"),
                "deviation_pct": Decimal("400.00"),
                "explanation": "OpenAI key key_prod_app_01 daily spend spiked from $50.00 to $250.00.",
                "created_at": datetime.now(timezone.utc),
            }
        }

    @classmethod
    def get_instance(cls) -> "MockDBStore":
        if cls._instance is None:
            cls._instance = MockDBStore()
        return cls._instance


class MockConnection:
    """Simulates asyncpg Connection interface with in-memory store."""

    def __init__(self, tenant_id: Optional[str] = None):
        self.tenant_id = tenant_id
        self.store = MockDBStore.get_instance()

    async def execute(self, query: str, *args: Any) -> str:
        return "OK"

    async def fetchrow(self, query: str, *args: Any) -> Optional[MockRecord]:
        q = query.strip()
        # INSERT INTO actions
        if "INSERT INTO actions" in q:
            # args: action_id (0), tenant_id (1), anomaly_id (2), action_type (3), provider (4), target_key_id (5), proposal_json (6), audit_log (7), now (8)
            aid = str(args[0])
            proposal = json.loads(args[6]) if len(args) > 6 and isinstance(args[6], str) else (args[6] if len(args) > 6 else {})
            dry_run = None
            audit = json.loads(args[7]) if len(args) > 7 and isinstance(args[7], str) else (args[7] if len(args) > 7 else [])
            now_dt = args[8] if len(args) > 8 else datetime.now(timezone.utc)

            item = {
                "id": aid,
                "tenant_id": str(args[1]),
                "anomaly_id": str(args[2]) if args[2] else None,
                "type": args[3],
                "status": "proposed",
                "provider": args[4],
                "target_key_id": args[5],
                "proposal_json": proposal,
                "dry_run_result_json": dry_run,
                "approved_by": None,
                "approved_at": None,
                "executed_at": None,
                "verified_at": None,
                "rolled_back_at": None,
                "github_pr_url": None,
                "audit_log": audit,
                "created_at": now_dt,
            }
            self.store.actions[aid] = item
            return MockRecord(item)

        # UPDATE actions (dry_run)
        if "UPDATE actions" in q and "status = 'dry_run'" in q:
            dry_run = json.loads(args[0]) if isinstance(args[0], str) else args[0]
            audit = json.loads(args[1]) if isinstance(args[1], str) else args[1]
            aid = str(args[2])
            if aid in self.store.actions:
                self.store.actions[aid]["status"] = "dry_run"
                self.store.actions[aid]["dry_run_result_json"] = dry_run
                self.store.actions[aid]["audit_log"] = audit
                return MockRecord(self.store.actions[aid])
            return None

        # UPDATE actions (approval & execution)
        if "UPDATE actions" in q and "approved_by =" in q:
            # args: approved_by (0), approved_at (1), executed_at (2), verified_at (3), github_pr_url (4), audit_log (5), action_id (6)
            aid = str(args[6])
            if aid in self.store.actions:
                self.store.actions[aid]["status"] = "verified"
                self.store.actions[aid]["approved_by"] = str(args[0]) if args[0] else None
                self.store.actions[aid]["approved_at"] = args[1]
                self.store.actions[aid]["executed_at"] = args[2]
                self.store.actions[aid]["verified_at"] = args[3]
                self.store.actions[aid]["github_pr_url"] = args[4]
                audit = json.loads(args[5]) if isinstance(args[5], str) else args[5]
                self.store.actions[aid]["audit_log"] = audit
                return MockRecord(self.store.actions[aid])
            return None

        # UPDATE actions (rollback)
        if "UPDATE actions" in q and "rolled_back" in q:
            aid = str(args[2])
            if aid in self.store.actions:
                self.store.actions[aid]["status"] = "rolled_back"
                self.store.actions[aid]["rolled_back_at"] = args[0]
                audit = json.loads(args[1]) if isinstance(args[1], str) else args[1]
                self.store.actions[aid]["audit_log"] = audit
                return MockRecord(self.store.actions[aid])
            return None

        # SELECT FROM actions WHERE id = $1
        if "SELECT * FROM actions WHERE id =" in q:
            aid = str(args[0])
            item = self.store.actions.get(aid)
            return MockRecord(item) if item else None

        # SELECT FROM anomalies WHERE id = $1
        if "SELECT * FROM anomalies WHERE id =" in q:
            anom_id = str(args[0])
            item = self.store.anomalies.get(anom_id)
            if not item:
                # generate synthetic mock anomaly
                item = {
                    "id": anom_id,
                    "tenant_id": self.tenant_id or "00000000-0000-0000-0000-000000000001",
                    "series_key": "openai:key_prod_app_01",
                    "provider": "openai",
                    "api_key_id": "key_prod_app_01",
                    "severity": "high",
                    "status": "open",
                    "baseline_value": Decimal("50.00"),
                    "actual_value": Decimal("200.00"),
                    "deviation_pct": Decimal("300.00"),
                    "explanation": "Cost spike detected on OpenAI key.",
                    "created_at": datetime.now(timezone.utc),
                }
                self.store.anomalies[anom_id] = item
            return MockRecord(item)

        # INSERT INTO savings_entries
        if "INSERT INTO savings_entries" in q:
            sid = str(args[0])
            item = {
                "id": sid,
                "tenant_id": str(args[1]),
                "action_id": str(args[2]) if args[2] else None,
                "anomaly_id": str(args[3]) if args[3] else None,
                "method": args[4],
                "baseline_cost": Decimal(str(args[5])),
                "realized_cost": None,
                "period_start": args[6],
                "period_end": None,
                "currency": "USD",
                "confidence": args[7],
                "status": "identified",
                "notes": args[8],
                "created_at": args[9],
            }
            self.store.savings_entries[sid] = item
            return MockRecord(item)

        # UPDATE savings_entries
        if "UPDATE savings_entries" in q:
            # realized_cost=$1, period_end=$2 WHERE id=$3
            sid = str(args[2])
            if sid in self.store.savings_entries:
                self.store.savings_entries[sid]["status"] = "verified"
                self.store.savings_entries[sid]["realized_cost"] = Decimal(str(args[0]))
                self.store.savings_entries[sid]["period_end"] = args[1]
                return MockRecord(self.store.savings_entries[sid])
            return None

        return None

    async def fetch(self, query: str, *args: Any) -> List[MockRecord]:
        q = query.strip()
        # SELECT * FROM actions WHERE tenant_id = $1
        if "FROM actions" in q and "tenant_id =" in q:
            tid = str(args[0])
            results = [
                MockRecord(a)
                for a in self.store.actions.values()
                if a.get("tenant_id") == tid
            ]
            results.sort(key=lambda x: str(x.get("created_at")), reverse=True)
            return results

        # SELECT * FROM savings_entries WHERE tenant_id = $1
        if "FROM savings_entries" in q and "tenant_id =" in q:
            tid = str(args[0])
            results = [
                MockRecord(s)
                for s in self.store.savings_entries.values()
                if s.get("tenant_id") == tid
            ]
            results.sort(key=lambda x: str(x.get("created_at")), reverse=True)
            return results

        return []

    async def fetchval(self, query: str, *args: Any) -> Any:
        row = await self.fetchrow(query, *args)
        if row:
            return list(row.values())[0]
        return None


@asynccontextmanager
async def get_db_connection(tenant_id: Optional[str] = None) -> AsyncGenerator[Any, None]:
    """
    Acquire a database connection with tenant RLS isolation.
    If PostgreSQL is offline, seamlessly yields a MockConnection.
    """
    pool = get_pool()
    if pool is not None:
        async with pool.acquire() as conn:
            async with conn.transaction():
                if tenant_id:
                    # Enforce RLS context
                    await conn.execute(f"SET LOCAL app.tenant_id = '{tenant_id}'")
                yield conn
    else:
        yield MockConnection(tenant_id=tenant_id)
