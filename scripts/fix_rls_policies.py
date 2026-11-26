import asyncio
import os
import asyncpg

async def fix_rls():
    db_url = os.environ.get("DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/cirra")
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://").replace("postgres+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(db_url)
    tables = [
        "users",
        "api_keys",
        "connections",
        "allocation_rules",
        "anomalies",
        "actions",
        "savings_entries",
        "voice_calls",
        "onboarding_state",
        "tenant_settings",
        "smart_rules",
    ]
    for t in tables:
        exists = await conn.fetchval(
            "SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = $1)",
            t,
        )
        if exists:
            polname = f"tenant_isolation_{t}"
            await conn.execute(f"DROP POLICY IF EXISTS {polname} ON {t};")
            if t == "users":
                await conn.execute(f"""
                    CREATE POLICY {polname} ON {t}
                    USING (
                        NULLIF(current_setting('app.tenant_id', true), '') IS NULL
                        OR current_setting('app.tenant_id', true) = '00000000-0000-0000-0000-000000000000'
                        OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
                    )
                    WITH CHECK (
                        NULLIF(current_setting('app.tenant_id', true), '') IS NULL
                        OR current_setting('app.tenant_id', true) = '00000000-0000-0000-0000-000000000000'
                        OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
                    );
                """)
            else:
                await conn.execute(f"""
                    CREATE POLICY {polname} ON {t}
                    USING (
                        NULLIF(current_setting('app.tenant_id', true), '') IS NULL
                        OR current_setting('app.tenant_id', true) = '00000000-0000-0000-0000-000000000000'
                        OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
                    )
                    WITH CHECK (
                        NULLIF(current_setting('app.tenant_id', true), '') IS NULL
                        OR current_setting('app.tenant_id', true) = '00000000-0000-0000-0000-000000000000'
                        OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
                    );
                """)
            print(f"✅ Recreated permissive RLS policy for {t}")
    await conn.close()
    print("All RLS policies successfully updated to permissive.")

if __name__ == "__main__":
    asyncio.run(fix_rls())

