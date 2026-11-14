from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base
from app.core.config import settings

Base = declarative_base()

db_url = str(settings.DATABASE_URL).strip()
if db_url.startswith("postgres://"):
    db_url = "postgresql+asyncpg://" + db_url[len("postgres://"):]
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
    db_url = "postgresql+asyncpg://" + db_url[len("postgresql://"):]

engine = create_async_engine(
    db_url,
    echo=(settings.ENVIRONMENT == "development"),
    future=True,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


import socket
import time
from urllib.parse import urlparse

_last_pg_check = 0.0
_last_pg_status = False

def is_postgres_reachable(timeout: float = 0.15) -> bool:
    """Fast socket probe to check if PostgreSQL host:port is listening, cached for 5s."""
    global _last_pg_check, _last_pg_status
    now = time.time()
    if now - _last_pg_check < 5.0:
        return _last_pg_status
    try:
        raw_dsn = db_url.replace("postgresql+asyncpg://", "http://").replace("postgresql://", "http://")
        parsed = urlparse(raw_dsn)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 5432
        with socket.create_connection((host, port), timeout=timeout):
            _last_pg_status = True
            _last_pg_check = now
            return True
    except Exception:
        _last_pg_status = False
        _last_pg_check = now
        return False


class DummyResult:
    def scalars(self):
        return self
    def all(self):
        return []
    def scalar_one_or_none(self):
        return None
    def scalar(self):
        return None
    def fetchone(self):
        return None
    def first(self):
        return None


class DummyAsyncSession:
    """In-memory dummy session for graceful degradation when Postgres is offline."""
    async def execute(self, *args, **kwargs):
        return DummyResult()
    async def scalar(self, *args, **kwargs):
        return None
    def add(self, *args, **kwargs):
        pass
    def add_all(self, *args, **kwargs):
        pass
    async def commit(self):
        pass
    async def flush(self):
        pass
    async def refresh(self, *args, **kwargs):
        pass
    async def rollback(self):
        pass
    async def close(self):
        pass
    async def begin(self):
        return self
    async def __aenter__(self):
        return self
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Standard database session generator."""
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def check_database_health() -> bool:
    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
            return True
    except Exception:
        return False


async def verify_non_superuser_role() -> None:
    """Startup check to fail fast if the connected DB role is a superuser or has BYPASSRLS."""
    if settings.ENVIRONMENT in ("test", "development"):
        return
    try:
        async with async_session_factory() as session:
            result = await session.execute(
                text("SELECT current_user, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user")
            )
            row = result.fetchone()
            if row:
                user_name, is_super, bypass_rls = row[0], row[1], row[2]
                if is_super or bypass_rls:
                    raise RuntimeError(
                        f"FATAL: Connected database role '{user_name}' has superuser={is_super} or BYPASSRLS={bypass_rls} "
                        "privileges. RLS is bypassed by superusers. The API must connect as a non-superuser role (e.g. cirra_app)."
                    )
    except RuntimeError:
        raise
    except Exception:
        pass

