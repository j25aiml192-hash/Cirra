import os
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import random
from pathlib import Path
import clickhouse_connect


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

TENANT_ZERO = "00000000-0000-0000-0000-000000000001"
TENANT_A = "11111111-1111-1111-1111-111111111111"
TENANT_B = "22222222-2222-2222-2222-222222222222"

SERVICES = [
    ("Amazon Elastic Compute Cloud - Compute", "Compute", "us-east-1", "i-098234abec2", "std-ec2-c5.xlarge", Decimal("14.500000")),
    ("Amazon Simple Storage Service", "Storage", "us-east-1", "bucket-prod-data", "s3-standard", Decimal("3.250000")),
    ("Amazon Relational Database Service", "Database", "us-west-2", "db-prod-pg15", "db.r6g.large", Decimal("22.800000")),
    ("AWS Lambda", "Compute", "us-east-1", "fn-payment-webhook", "lambda-arm64", Decimal("0.850000")),
    ("Amazon DynamoDB", "Database", "us-east-1", "table-session-store", "dynamo-wcu-rcu", Decimal("5.100000")),
    ("Amazon CloudFront", "Networking", "global", "cdn-dist-prod", "cf-egress-std", Decimal("2.400000")),
]

AI_MODELS = [
    ("gpt-4o", "key_prod_app_01", 85000, 24000, 15000, Decimal("0.542000")),
    ("gpt-4o-mini", "key_batch_worker_02", 250000, 60000, 40000, Decimal("0.115000")),
    ("text-embedding-3-small", "key_rag_indexer_03", 500000, 0, 0, Decimal("0.010000")),
    ("o1-preview", "key_research_lab_04", 12000, 4500, 0, Decimal("0.410000")),
]


def get_clickhouse_client():
    raw_host = os.getenv("CLICKHOUSE_HOST", "localhost")
    secure = "https://" in raw_host or int(os.getenv("CLICKHOUSE_PORT", "8123")) == 8443
    host = raw_host.replace("https://", "").replace("http://", "").split("/")[0].split(":")[0]
    port = int(os.getenv("CLICKHOUSE_PORT", "8443" if secure else "8123"))
    user = os.getenv("CLICKHOUSE_USER", "default")
    password = os.getenv("CLICKHOUSE_PASSWORD", "")
    database = os.getenv("CLICKHOUSE_DATABASE", "cirra")

    print(f"Connecting to ClickHouse at {host}:{port} (secure={secure}) as user '{user}'...")
    # First connect without specifying database to ensure cirra database can be created
    admin_client = clickhouse_connect.get_client(
        host=host,
        port=port,
        username=user,
        password=password,
        secure=secure,
    )
    admin_client.command("CREATE DATABASE IF NOT EXISTS cirra")

    # Connect to cirra database
    return clickhouse_connect.get_client(
        host=host,
        port=port,
        username=user,
        password=password,
        database=database,
        secure=secure,
    )


def create_schema(client):
    print("Ensuring tables and users exist in ClickHouse...")

    # 1. cost_facts table
    cost_facts_sql = """
    CREATE TABLE IF NOT EXISTS cost_facts (
      tenant_id String,
      charge_period_start DateTime,
      charge_period_end DateTime,
      billed_cost Decimal(18,6),
      effective_cost Decimal(18,6),
      currency String,
      provider String,
      service_name String,
      service_category String,
      region String,
      resource_id String,
      sku_id String,
      tags Map(String, String),
      allocated_team String DEFAULT '',
      allocated_customer String DEFAULT '',
      allocated_feature String DEFAULT '',
      allocation_method String DEFAULT 'unallocated',
      row_hash String,
      version UInt64 DEFAULT 1,
      inserted_at DateTime DEFAULT now(),
      ingested_at DateTime DEFAULT inserted_at
    )
    ENGINE = ReplacingMergeTree(version)
    PARTITION BY (toYYYYMM(charge_period_start), tenant_id)
    ORDER BY (tenant_id, provider, service_name, resource_id, charge_period_start, row_hash)
    """
    client.command(cost_facts_sql)
    print("Table 'cost_facts' verified/created.")

    # 2. ai_usage_facts table
    ai_facts_sql = """
    CREATE TABLE IF NOT EXISTS ai_usage_facts (
      tenant_id String,
      ts DateTime,
      provider String,
      model String,
      api_key_id String,
      input_tokens UInt64,
      output_tokens UInt64,
      cached_tokens UInt64,
      cost_usd Decimal(18,6),
      team_tag String DEFAULT '',
      customer_tag String DEFAULT '',
      feature_tag String DEFAULT '',
      row_hash String,
      version UInt64 DEFAULT 1,
      inserted_at DateTime DEFAULT now(),
      timestamp DateTime DEFAULT ts,
      tags Map(String, String) DEFAULT map(),
      ingested_at DateTime DEFAULT inserted_at
    )
    ENGINE = ReplacingMergeTree(version)
    PARTITION BY (toYYYYMM(ts), tenant_id)
    ORDER BY (tenant_id, provider, model, api_key_id, ts, row_hash)
    """
    client.command(ai_facts_sql)
    print("Table 'ai_usage_facts' verified/created.")

    # 3. Create users cirra_reader and cirra_ingest
    reader_sql = """
    CREATE USER IF NOT EXISTS cirra_reader IDENTIFIED WITH sha256_password BY 'Reader_Secure_Password123'
    """
    grant_reader_sql = "GRANT SELECT ON cirra.* TO cirra_reader"

    ingest_sql = """
    CREATE USER IF NOT EXISTS cirra_ingest IDENTIFIED WITH sha256_password BY 'Ingest_Secure_Password123'
    """
    grant_ingest_sql = "GRANT SELECT, INSERT ON cirra.* TO cirra_ingest"

    try:
        client.command(reader_sql)
        client.command(grant_reader_sql)
        print("ClickHouse user 'cirra_reader' granted SELECT on cirra.*.")
    except Exception as e:
        print(f"Notice on cirra_reader: {e}")

    try:
        client.command(ingest_sql)
        client.command(grant_ingest_sql)
        print("ClickHouse user 'cirra_ingest' granted SELECT, INSERT on cirra.*.")
    except Exception as e:
        print(f"Notice on cirra_ingest: {e}")


def sanity_check(client):
    print("Running sanity check: inserting test row, selecting, and deleting...")
    now = datetime.now(timezone.utc).replace(microsecond=0)

    # Sanity check cost_facts
    cost_test_hash = f"test_sanity_cost_{random.randint(100000, 999999)}"
    client.insert(
        "cost_facts",
        [[
            TENANT_ZERO,
            now,
            now + timedelta(hours=1),
            Decimal("9.999999"),
            Decimal("9.999999"),
            "USD",
            "AWS",
            "Sanity Test EC2",
            "Compute",
            "us-east-1",
            "i-sanitytest",
            "sku-test",
            {"env": "sanity"},
            "Core",
            "Internal",
            "HealthCheck",
            "allocated",
            cost_test_hash,
            1,
            now,
        ]],
        column_names=[
            "tenant_id", "charge_period_start", "charge_period_end",
            "billed_cost", "effective_cost", "currency", "provider",
            "service_name", "service_category", "region", "resource_id",
            "sku_id", "tags", "allocated_team", "allocated_customer",
            "allocated_feature", "allocation_method", "row_hash",
            "version", "inserted_at"
        ]
    )

    res_cost = client.query("SELECT count(*) FROM cost_facts WHERE row_hash = %(h)s", parameters={"h": cost_test_hash})
    count_cost = res_cost.result_rows[0][0]
    assert count_cost >= 1, f"Expected cost_facts row not found for hash {cost_test_hash}"
    print(f"Sanity Check: cost_facts test row verified (count={count_cost}). Deleting test row...")
    try:
        client.command(f"ALTER TABLE cost_facts DELETE WHERE row_hash = '{cost_test_hash}'")
    except Exception:
        client.command(f"DELETE FROM cost_facts WHERE row_hash = '{cost_test_hash}'")
    print("Sanity Check: cost_facts test row deleted successfully.")

    # Sanity check ai_usage_facts
    ai_test_hash = f"test_sanity_ai_{random.randint(100000, 999999)}"
    client.insert(
        "ai_usage_facts",
        [[
            TENANT_ZERO,
            now,
            "OpenAI",
            "gpt-4o",
            "key_sanity_01",
            100,
            50,
            20,
            Decimal("0.001234"),
            "Core",
            "Internal",
            "HealthCheck",
            ai_test_hash,
            1,
            now,
        ]],
        column_names=[
            "tenant_id", "ts", "provider", "model", "api_key_id",
            "input_tokens", "output_tokens", "cached_tokens", "cost_usd",
            "team_tag", "customer_tag", "feature_tag", "row_hash",
            "version", "inserted_at"
        ]
    )

    res_ai = client.query("SELECT count(*) FROM ai_usage_facts WHERE row_hash = %(h)s", parameters={"h": ai_test_hash})
    count_ai = res_ai.result_rows[0][0]
    assert count_ai >= 1, f"Expected ai_usage_facts row not found for hash {ai_test_hash}"
    print(f"Sanity Check: ai_usage_facts test row verified (count={count_ai}). Deleting test row...")
    try:
        client.command(f"ALTER TABLE ai_usage_facts DELETE WHERE row_hash = '{ai_test_hash}'")
    except Exception:
        client.command(f"DELETE FROM ai_usage_facts WHERE row_hash = '{ai_test_hash}'")
    print("Sanity Check: ai_usage_facts test row deleted successfully.")


def seed_data(client, days: int = 90):
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)

    cost_facts = []
    ai_facts = []

    tenants = [
        (TENANT_ZERO, Decimal("1.2")),
        (TENANT_A, Decimal("1.0")),
        (TENANT_B, Decimal("0.45")),
    ]

    print(f"Generating synthetic FOCUS data for past {days} days across {len(tenants)} tenants...")

    for tenant_id, scale in tenants:
        current = start_date
        while current < now:
            period_start = current.replace(hour=0, minute=0, second=0, microsecond=0)
            period_end = period_start + timedelta(days=1)

            # Generate Cloud Cost Facts
            for s_name, cat, region, res_id, sku, base_cost in SERVICES:
                variation = Decimal(str(round(0.85 + (random.random() * 0.4), 4)))
                billed = (base_cost * scale * variation).quantize(Decimal("0.000001"))
                effective = billed

                row_hash = f"cost_{tenant_id[:8]}_{period_start.strftime('%Y%m%d')}_{sku}_{s_name[:4]}"

                cost_facts.append([
                    tenant_id,
                    period_start,
                    period_end,
                    billed,
                    effective,
                    "USD",
                    "AWS",
                    s_name,
                    cat,
                    region,
                    f"{res_id}-{tenant_id[:4]}",
                    sku,
                    {"environment": "production", "team": "engineering"},
                    "engineering",
                    "enterprise_customer",
                    "core_platform",
                    "allocated" if tenant_id == TENANT_ZERO else "unallocated",
                    row_hash,
                    1,
                    now,
                ])

            # Generate AI Usage Facts (daily records)
            for model, key_id, in_tok, out_tok, cached_tok, base_cost in AI_MODELS:
                variation = Decimal(str(round(0.80 + (random.random() * 0.5), 4)))
                cost_usd = (base_cost * scale * variation).quantize(Decimal("0.000001"))
                tok_mult = float(scale * variation)

                ai_row_hash = f"ai_{tenant_id[:8]}_{period_start.strftime('%Y%m%d')}_{model}_{key_id[:6]}"

                ai_facts.append([
                    tenant_id,
                    period_start,
                    "OpenAI",
                    model,
                    f"{key_id}_{tenant_id[:4]}",
                    int(in_tok * tok_mult),
                    int(out_tok * tok_mult),
                    int(cached_tok * tok_mult),
                    cost_usd,
                    "copilot_eng",
                    "growth_tier",
                    "agentic_workflow",
                    ai_row_hash,
                    1,
                    now,
                ])

            current += timedelta(days=1)

    print(f"Inserting {len(cost_facts)} cost_facts rows into ClickHouse...")
    cost_columns = [
        "tenant_id", "charge_period_start", "charge_period_end",
        "billed_cost", "effective_cost", "currency", "provider",
        "service_name", "service_category", "region", "resource_id",
        "sku_id", "tags", "allocated_team", "allocated_customer",
        "allocated_feature", "allocation_method", "row_hash",
        "version", "inserted_at"
    ]
    client.insert("cost_facts", cost_facts, column_names=cost_columns)
    print(f"Successfully inserted {len(cost_facts)} cost_facts rows.")

    print(f"Inserting {len(ai_facts)} ai_usage_facts rows into ClickHouse...")
    ai_columns = [
        "tenant_id", "ts", "provider", "model", "api_key_id",
        "input_tokens", "output_tokens", "cached_tokens", "cost_usd",
        "team_tag", "customer_tag", "feature_tag", "row_hash",
        "version", "inserted_at"
    ]
    client.insert("ai_usage_facts", ai_facts, column_names=ai_columns)
    print(f"Successfully inserted {len(ai_facts)} ai_usage_facts rows.")

    print("ClickHouse seeding complete.")


def main():
    client = get_clickhouse_client()
    create_schema(client)
    sanity_check(client)
    seed_data(client, days=90)


if __name__ == "__main__":
    main()
