#!/usr/bin/env python3
import asyncio
import os
from pathlib import Path
import sys
import uuid
import asyncpg
from dotenv import load_dotenv

# Load root .env
repo_root = Path(__file__).resolve().parent.parent
load_dotenv(repo_root / ".env")

RAW_DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@127.0.0.1:5432/cirra")
# Standardize for asyncpg
DB_URL = RAW_DB_URL.replace("postgresql+asyncpg://", "postgresql://").replace("@localhost:", "@127.0.0.1:")


async def cleanup(anomaly_id: str):
    try:
        anomaly_uuid = uuid.UUID(anomaly_id)
    except ValueError:
        print(f"Error: Invalid anomaly_id '{anomaly_id}'. Must be a valid UUID.")
        sys.exit(1)

    conn = await asyncpg.connect(DB_URL)
    try:
        # Set tenant isolation setting for safety
        await conn.execute("SELECT set_config('app.tenant_id', '00000000-0000-0000-0000-000000000001', false)")

        # Cascade deletes in FK order
        await conn.execute("DELETE FROM voice_calls WHERE anomaly_id = $1", anomaly_uuid)
        await conn.execute("DELETE FROM actions WHERE anomaly_id = $1", anomaly_uuid)
        await conn.execute("DELETE FROM savings_entries WHERE anomaly_id = $1", anomaly_uuid)
        await conn.execute("DELETE FROM anomalies WHERE id = $1", anomaly_uuid)

        print("Demo data cleaned up. Ready to run again.")
    finally:
        await conn.close()


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/demo_cleanup.py <DEMO_ANOMALY_ID>")
        sys.exit(1)

    anomaly_id = sys.argv[1].strip()
    asyncio.run(cleanup(anomaly_id))


if __name__ == "__main__":
    main()
