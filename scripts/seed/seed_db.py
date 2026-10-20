import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

# Using relative paths or default connection
DATABASE_URL = "postgresql+asyncpg://cirra:cirrapassword@localhost:5432/cirra"

DEMO_TENANT_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")


async def seed_postgres():
    print(f"[*] Connecting to Postgres: {DATABASE_URL}")
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        from services.api.src.models import Tenant, User, Connection, AllocationRule

        # Check existing tenant
        result = await session.execute(select(Tenant).where(Tenant.id == DEMO_TENANT_ID))
        tenant = result.scalar_one_or_none()

        if not tenant:
            print("[*] Creating Demo Tenant: Acme Corp")
            tenant = Tenant(
                id=DEMO_TENANT_ID,
                name="Acme Corp",
                slug="acme-corp",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(tenant)
            await session.flush()

        # Check existing user
        result = await session.execute(select(User).where(User.id == DEMO_USER_ID))
        user = result.scalar_one_or_none()

        if not user:
            print("[*] Creating Demo Admin User: admin@acme.internal")
            user = User(
                id=DEMO_USER_ID,
                tenant_id=DEMO_TENANT_ID,
                email="admin@acme.internal",
                name="Alex Rivera",
                role="owner",
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(user)

        await session.commit()
        print("[+] PostgreSQL demo seed successfully executed.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_postgres())
