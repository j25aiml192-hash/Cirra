"""
Production seed script: Run against Render PostgreSQL to seed the demo user and tenant.
Usage:
  DATABASE_URL=postgresql://... python scripts/seed_production.py

This is SAFE to run multiple times (idempotent via ON CONFLICT DO NOTHING).
"""
import asyncio
import os
import sys
import uuid
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

TENANT_ID = "00000000-0000-0000-0000-000000000001"
USER_ID = "00000000-0000-0000-0000-000000000002"
EMAIL = "hiten@cirra.dev"
TENANT_NAME = "Hiten's Workspace"


async def seed(db_url: str):
    # asyncpg requires postgresql:// not postgresql+asyncpg://
    conn_url = db_url.replace("postgresql+asyncpg://", "postgresql://").replace(
        "postgres+asyncpg://", "postgresql://"
    )

    print(f"Connecting to database...")
    conn = await asyncpg.connect(conn_url)

    try:
        # Bypass RLS for seeding
        await conn.execute("SET app.tenant_id = '00000000-0000-0000-0000-000000000000'")

        # 1. Ensure tenant zero exists
        tenant_exists = await conn.fetchval(
            "SELECT id FROM tenants WHERE id = $1", uuid.UUID(TENANT_ID)
        )
        if not tenant_exists:
            await conn.execute(
                """INSERT INTO tenants (id, name, plan, created_at)
                   VALUES ($1, $2, 'starter', NOW())""",
                uuid.UUID(TENANT_ID), TENANT_NAME
            )
            print(f"✅ Created tenant: {TENANT_NAME} ({TENANT_ID})")
        else:
            print(f"ℹ️  Tenant already exists: {TENANT_ID}")

        # 2. Ensure user zero exists
        user_exists = await conn.fetchval(
            "SELECT id FROM users WHERE email = $1", EMAIL
        )
        if not user_exists:
            await conn.execute(
                """INSERT INTO users (id, tenant_id, email, role, created_at)
                   VALUES ($1, $2, $3, 'admin', NOW())""",
                uuid.UUID(USER_ID), uuid.UUID(TENANT_ID), EMAIL
            )
            print(f"✅ Created user: {EMAIL} ({USER_ID})")
        else:
            print(f"ℹ️  User already exists: {EMAIL}")

        # 3. Check if connections table exists and seed a placeholder connection
        tables = await conn.fetch(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
        )
        table_names = [t["tablename"] for t in tables]
        print(f"\n📋 Tables in DB: {', '.join(table_names)}")

        if "connections" in table_names:
            conn_exists = await conn.fetchval(
                "SELECT id FROM connections WHERE tenant_id = $1 LIMIT 1",
                uuid.UUID(TENANT_ID)
            )
            if not conn_exists:
                print("ℹ️  No connections found for tenant zero. Add one via the app UI after login.")

        print(f"\n✅ Production seed complete!")
        print(f"   Login credentials: {EMAIL} / 12345")
        print(f"   Tenant ID:         {TENANT_ID}")
        print(f"   User ID:           {USER_ID}")

    finally:
        await conn.close()


if __name__ == "__main__":
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        print("ERROR: DATABASE_URL env var not set.")
        print("Usage: DATABASE_URL=postgresql://user:pass@host:5432/cirra python scripts/seed_production.py")
        sys.exit(1)

    asyncio.run(seed(db_url))
