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

engine = create_async_engine(
    settings.DATABASE_URL,
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
    if settings.ENVIRONMENT == "test":
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

