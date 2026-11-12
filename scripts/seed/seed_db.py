import asyncio
import os
import sys
import uuid
import asyncpg
from pathlib import Path


def load_env_file():
    """Load .env file from repo root if present."""
    repo_root = Path(__file__).resolve().parent.parent.parent
    env_file = repo_root / ".env"
    if env_file.exists():
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip("'\"")
                    if key not in os.environ:
                        os.environ[key] = val


load_env_file()

TENANT_ZERO_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
TENANT_ZERO_NAME = "Hiten Brahs Company"
TENANT_ZERO_PLAN = "enterprise"

USER_ZERO_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
USER_ZERO_EMAIL = "hiten@cirra.dev"
USER_ZERO_ROLE = "admin"

# Test isolation tenants
TENANT_A_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
TENANT_B_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
USER_A_ID = uuid.UUID("a1111111-1111-1111-1111-111111111111")
USER_B_ID = uuid.UUID("b1111111-1111-1111-1111-111111111111")


def get_database_url() -> str:
    raw_url = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgrespassword@localhost:5432/cirra"
    )
    # asyncpg expects postgresql:// or postgres://
    return raw_url.replace("postgresql+asyncpg://", "postgresql://")


async def seed():
    dsn = get_database_url()
    # Mask password for display
    display_dsn = dsn
    if "@" in dsn and ":" in dsn.split("@")[0]:
        prefix, rest = dsn.split("@", 1)
        scheme_user = prefix.split(":")[0] + ":" + prefix.split(":")[1].split("//")[1]
        display_dsn = f"{prefix.split('//')[0]}//{prefix.split('//')[1].split(':')[0]}:***@{rest}"

    print(f"Connecting via asyncpg to {display_dsn}...")

    conn = await asyncpg.connect(dsn=dsn)
    try:
        # 1. Seed Tenant Zero
        tenant_zero_row = await conn.fetchrow(
            """
            INSERT INTO tenants (id, name, plan)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
            RETURNING id, name, plan;
            """,
            TENANT_ZERO_ID,
            TENANT_ZERO_NAME,
            TENANT_ZERO_PLAN,
        )
        if tenant_zero_row:
            print(f"[INSERTED] Tenant Zero: id={tenant_zero_row['id']} name='{tenant_zero_row['name']}' plan='{tenant_zero_row['plan']}'")
        else:
            existing = await conn.fetchrow("SELECT id, name, plan FROM tenants WHERE id = $1;", TENANT_ZERO_ID)
            print(f"[EXISTS]   Tenant Zero: id={existing['id']} name='{existing['name']}' plan='{existing['plan']}'")

        # 2. Seed User Zero
        user_zero_row = await conn.fetchrow(
            """
            INSERT INTO users (id, tenant_id, email, role)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
            RETURNING id, tenant_id, email, role;
            """,
            USER_ZERO_ID,
            TENANT_ZERO_ID,
            USER_ZERO_EMAIL,
            USER_ZERO_ROLE,
        )
        if user_zero_row:
            print(f"[INSERTED] User Zero:   id={user_zero_row['id']} email='{user_zero_row['email']}' role='{user_zero_row['role']}' tenant_id={user_zero_row['tenant_id']}")
        else:
            existing_user = await conn.fetchrow("SELECT id, tenant_id, email, role FROM users WHERE id = $1 OR email = $2;", USER_ZERO_ID, USER_ZERO_EMAIL)
            print(f"[EXISTS]   User Zero:   id={existing_user['id']} email='{existing_user['email']}' role='{existing_user['role']}' tenant_id={existing_user['tenant_id']}")

        # 3. Seed Tenant A & Tenant B for integration tests (idempotent)
        await conn.execute(
            """
            INSERT INTO tenants (id, name, plan)
            VALUES ($1, 'Acme Corp (Tenant A)', 'enterprise'),
                   ($2, 'Beta Inc (Tenant B)', 'starter')
            ON CONFLICT DO NOTHING;
            """,
            TENANT_A_ID,
            TENANT_B_ID,
        )
        await conn.execute(
            """
            INSERT INTO users (id, tenant_id, email, role)
            VALUES ($1, $2, 'admin@acme.com', 'admin'),
                   ($3, $4, 'admin@beta.com', 'admin')
            ON CONFLICT DO NOTHING;
            """,
            USER_A_ID,
            TENANT_A_ID,
            USER_B_ID,
            TENANT_B_ID,
        )
        print("Confirmed seed data in PostgreSQL.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed())
