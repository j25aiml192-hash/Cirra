import asyncio
import os
import sys
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Add services/api to sys.path to import app modules
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../../services/api"))
sys.path.insert(0, project_root)

from app.core.config import settings
from app.core.encryption import encrypt_credentials

TENANT_A_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
TENANT_B_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")

USER_A_ID = uuid.UUID("a1111111-1111-1111-1111-111111111111")
USER_B_ID = uuid.UUID("b1111111-1111-1111-1111-111111111111")


async def seed():
    engine = create_async_engine(settings.DATABASE_URL, future=True)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    print(f"Connecting to {settings.DATABASE_URL} to seed isolation test tenants...")

    async with async_session() as session:
        async with session.begin():
            # 1. Clear old demo data
            await session.execute(
                text("DELETE FROM tenants WHERE id IN (:id_a, :id_b)"),
                {"id_a": TENANT_A_ID, "id_b": TENANT_B_ID}
            )

            # 2. Insert Tenant A and Tenant B
            await session.execute(
                text("""
                    INSERT INTO tenants (id, name, plan)
                    VALUES (:id_a, 'Acme Corp (Tenant A)', 'enterprise'),
                           (:id_b, 'Beta Inc (Tenant B)', 'starter');
                """),
                {"id_a": TENANT_A_ID, "id_b": TENANT_B_ID}
            )

            # 3. Insert Users for each tenant
            await session.execute(
                text("""
                    INSERT INTO users (id, tenant_id, email, role)
                    VALUES (:uid_a, :id_a, 'admin@acme.com', 'admin'),
                           (:uid_b, :id_b, 'admin@beta.com', 'admin');
                """),
                {"uid_a": USER_A_ID, "id_a": TENANT_A_ID, "uid_b": USER_B_ID, "id_b": TENANT_B_ID}
            )

            # 4. Insert Connections for Tenant A
            conn_a_encrypted = encrypt_credentials({"api_key": "sk-acme-secret-key-123", "org_id": "org_acme"})
            await session.execute(
                text("""
                    INSERT INTO connections (id, tenant_id, provider, name, credentials_encrypted, status)
                    VALUES (:id, :tenant_id, 'openai', 'Acme OpenAI Main', :creds, 'connected');
                """),
                {
                    "id": uuid.UUID("a2222222-2222-2222-2222-222222222222"),
                    "tenant_id": TENANT_A_ID,
                    "creds": conn_a_encrypted
                }
            )

            # 5. Insert Connections for Tenant B
            conn_b_encrypted = encrypt_credentials({"api_key": "sk-beta-secret-key-456", "org_id": "org_beta"})
            await session.execute(
                text("""
                    INSERT INTO connections (id, tenant_id, provider, name, credentials_encrypted, status)
                    VALUES (:id, :tenant_id, 'openai', 'Beta OpenAI Main', :creds, 'connected');
                """),
                {
                    "id": uuid.UUID("b2222222-2222-2222-2222-222222222222"),
                    "tenant_id": TENANT_B_ID,
                    "creds": conn_b_encrypted
                }
            )

    await engine.dispose()
    print("Successfully seeded Tenant A and Tenant B demo datasets.")


if __name__ == "__main__":
    asyncio.run(seed())
