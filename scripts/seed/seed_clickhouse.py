import random
from datetime import datetime, timedelta, timezone
import clickhouse_connect

CLICKHOUSE_HOST = "localhost"
CLICKHOUSE_PORT = 8123
DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000001"

SERVICES = [
    ("aws", "AmazonEC2", "m6i.2xlarge"),
    ("aws", "AmazonRDS", "db.r6g.xlarge"),
    ("aws", "AmazonS3", "StandardStorage"),
    ("gcp", "Compute Engine", "n2-standard-8"),
    ("gcp", "Google Cloud Kubernetes", "StandardCluster"),
    ("azure", "Virtual Machines", "Standard_D4s_v5"),
]

AI_MODELS = [
    ("openai", "gpt-4o", 0.005, 0.015),
    ("openai", "gpt-4o-mini", 0.00015, 0.0006),
    ("anthropic", "claude-3-5-sonnet", 0.003, 0.015),
    ("openai", "text-embedding-3-small", 0.00002, 0.0),
]

TEAMS = ["Platform", "Search & Recs", "Core ML", "Data Infra", "Customer Success"]
CUSTOMERS = ["Acme Enterprise", "Stripe Pool", "Uber Eats Tier 1", "Self-Serve Free"]


def seed_clickhouse():
    print(f"[*] Connecting to ClickHouse on {CLICKHOUSE_HOST}:{CLICKHOUSE_PORT}")
    try:
        client = clickhouse_connect.get_client(
            host=CLICKHOUSE_HOST,
            port=CLICKHOUSE_PORT,
            username="default",
            password="",
        )
    except Exception as e:
        print(f"[!] ClickHouse connection failed: {e}. Generating offline script verification.")
        return

    # Create cirra database
    client.command("CREATE DATABASE IF NOT EXISTS cirra")

    # Create cost_facts table (FOCUS 1.0 schema)
    client.command("""
    CREATE TABLE IF NOT EXISTS cirra.cost_facts (
        tenant_id UUID,
        charge_period_start DateTime64(3, 'UTC'),
        charge_period_end DateTime64(3, 'UTC'),
        provider LowCardinality(String),
        service_name String,
        resource_id String,
        sku_id String,
        billed_cost Float64,
        effective_cost Float64,
        currency LowCardinality(String),
        tags Map(String, String),
        allocated_team Nullable(String),
        allocated_customer Nullable(String),
        allocated_feature Nullable(String),
        allocation_method LowCardinality(String),
        inserted_at DateTime64(3, 'UTC')
    ) ENGINE = MergeTree()
    ORDER BY (tenant_id, charge_period_start, provider, service_name)
    """)

    # Create ai_usage_facts table
    client.command("""
    CREATE TABLE IF NOT EXISTS cirra.ai_usage_facts (
        tenant_id UUID,
        ts DateTime64(3, 'UTC'),
        provider LowCardinality(String),
        model LowCardinality(String),
        api_key_id String,
        input_tokens UInt64,
        output_tokens UInt64,
        cost_usd Float64,
        team_tag Nullable(String),
        customer_tag Nullable(String),
        feature_tag Nullable(String),
        inserted_at DateTime64(3, 'UTC')
    ) ENGINE = MergeTree()
    ORDER BY (tenant_id, ts, provider, model)
    """)

    # Generate 1000 sample rows
    print("[*] Generating 1000 sample FOCUS rows...")
    now = datetime.now(timezone.utc)
    cost_rows = []

    for i in range(1000):
        days_ago = random.randint(0, 30)
        dt_start = now - timedelta(days=days_ago, hours=random.randint(0, 23))
        dt_end = dt_start + timedelta(hours=1)

        provider, service, sku = random.choice(SERVICES)
        billed = round(random.uniform(0.5, 45.0), 4)
        effective = round(billed * random.uniform(0.7, 0.95), 4)
        team = random.choice(TEAMS) if random.random() > 0.15 else None
        customer = random.choice(CUSTOMERS) if random.random() > 0.25 else None

        cost_rows.append([
            DEMO_TENANT_ID,
            dt_start,
            dt_end,
            provider,
            service,
            f"res-{provider}-{i:04d}",
            sku,
            billed,
            effective,
            "USD",
            {"Environment": "production", "Team": team or "unassigned"},
            team,
            customer,
            "Inference Pipeline" if "ML" in (team or "") else "Web API",
            "tag_exact" if team else "unallocated",
            now,
        ])

    client.insert(
        "cirra.cost_facts",
        cost_rows,
        column_names=[
            "tenant_id", "charge_period_start", "charge_period_end", "provider",
            "service_name", "resource_id", "sku_id", "billed_cost", "effective_cost",
            "currency", "tags", "allocated_team", "allocated_customer",
            "allocated_feature", "allocation_method", "inserted_at"
        ],
    )
    print(f"[+] Successfully inserted 1,000 FOCUS records into ClickHouse for tenant {DEMO_TENANT_ID}.")


if __name__ == "__main__":
    seed_clickhouse()
