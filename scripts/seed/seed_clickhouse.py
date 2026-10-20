import os
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import random

# Ensure ingest path is importable
current_dir = os.path.dirname(os.path.abspath(__file__))
repo_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
ingest_dir = os.path.join(repo_root, "services", "ingest")
if ingest_dir not in sys.path:
    sys.path.insert(0, ingest_dir)

from clickhouse_client import ClickHouseClient
from normalizer import calculate_cost_row_hash, calculate_ai_row_hash

TENANT_A = "11111111-1111-1111-1111-111111111111"  # Acme Corp
TENANT_B = "22222222-2222-2222-2222-222222222222"  # Beta Labs

SERVICES = [
    ("Amazon Elastic Compute Cloud - Compute", "Compute", "us-east-1", "i-098234abec2", "std-ec2-c5.xlarge", Decimal("14.5000")),
    ("Amazon Simple Storage Service", "Storage", "us-east-1", "bucket-prod-data", "s3-standard", Decimal("3.2500")),
    ("Amazon Relational Database Service", "Database", "us-west-2", "db-prod-pg15", "db.r6g.large", Decimal("22.8000")),
    ("AWS Lambda", "Compute", "us-east-1", "fn-payment-webhook", "lambda-arm64", Decimal("0.8500")),
    ("Amazon DynamoDB", "Database", "us-east-1", "table-session-store", "dynamo-wcu-rcu", Decimal("5.1000")),
    ("Amazon CloudFront", "Networking", "global", "cdn-dist-prod", "cf-egress-std", Decimal("2.4000")),
]

AI_MODELS = [
    ("gpt-4o", "key_prod_app_01", 85000, 24000, 15000, Decimal("0.542000")),
    ("gpt-4o-mini", "key_batch_worker_02", 250000, 60000, 40000, Decimal("0.115000")),
    ("text-embedding-3-small", "key_rag_indexer_03", 500000, 0, 0, Decimal("0.010000")),
    ("o1-preview", "key_research_lab_04", 12000, 4500, 0, Decimal("0.410000")),
]


def seed_data(days: int = 90):
    client = ClickHouseClient(
        host=os.getenv("CLICKHOUSE_HOST", "localhost"),
        port=int(os.getenv("CLICKHOUSE_PORT", "8123")),
        user=os.getenv("CLICKHOUSE_USER", "default"),
        password=os.getenv("CLICKHOUSE_PASSWORD", ""),
        database=os.getenv("CLICKHOUSE_DATABASE", "cirra"),
    )

    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)

    cost_facts = []
    ai_facts = []

    print(f"Generating synthetic FOCUS data for past {days} days across 2 tenants...")

    for tenant_id, scale in [(TENANT_A, Decimal("1.0")), (TENANT_B, Decimal("0.45"))]:
        current = start_date
        while current < now:
            period_start = current.replace(hour=0, minute=0, second=0, microsecond=0)
            period_end = period_start + timedelta(days=1)

            # Generate Cloud Cost Facts
            for s_name, cat, region, res_id, sku, base_cost in SERVICES:
                # Add daily variation (multiplier between 0.85 and 1.25)
                variation = Decimal(str(round(0.85 + (random.random() * 0.4), 4)))
                billed = (base_cost * scale * variation).quantize(Decimal("0.0001"))
                effective = billed

                row_hash = calculate_cost_row_hash(
                    tenant_id=tenant_id,
                    charge_period_start=period_start,
                    provider="AWS",
                    resource_id=f"{res_id}-{tenant_id[:4]}",
                    sku_id=sku,
                )

                cost_facts.append({
                    "tenant_id": tenant_id,
                    "charge_period_start": period_start,
                    "charge_period_end": period_end,
                    "billed_cost": billed,
                    "effective_cost": effective,
                    "currency": "USD",
                    "provider": "AWS",
                    "service_name": s_name,
                    "service_category": cat,
                    "region": region,
                    "resource_id": f"{res_id}-{tenant_id[:4]}",
                    "sku_id": sku,
                    "tags": {
                        "environment": "production",
                        "team": "engineering",
                        "tenant": "A" if tenant_id == TENANT_A else "B",
                    },
                    "allocation_method": "unallocated",
                    "row_hash": row_hash,
                    "version": 1,
                })

            # Generate AI Usage Facts (daily records)
            for model, key_id, in_tok, out_tok, cached_tok, base_cost in AI_MODELS:
                variation = Decimal(str(round(0.80 + (random.random() * 0.5), 4)))
                cost_usd = (base_cost * scale * variation).quantize(Decimal("0.000001"))
                tok_mult = float(scale * variation)

                ai_row_hash = calculate_ai_row_hash(
                    tenant_id=tenant_id,
                    timestamp=period_start,
                    provider="OpenAI",
                    model=model,
                    api_key_id=f"{key_id}_{tenant_id[:4]}",
                )

                ai_facts.append({
                    "tenant_id": tenant_id,
                    "timestamp": period_start,
                    "provider": "OpenAI",
                    "model": model,
                    "api_key_id": f"{key_id}_{tenant_id[:4]}",
                    "input_tokens": int(in_tok * tok_mult),
                    "output_tokens": int(out_tok * tok_mult),
                    "cached_tokens": int(cached_tok * tok_mult),
                    "cost_usd": cost_usd,
                    "row_hash": ai_row_hash,
                    "tags": {
                        "environment": "production",
                        "app": "cirra-core",
                    },
                    "version": 1,
                })

            current += timedelta(days=1)

    print(f"Inserting {len(cost_facts)} cost_facts rows into ClickHouse...")
    inserted_costs = client.insert_cost_facts(cost_facts)
    print(f"Inserted {inserted_costs} cost_facts.")

    print(f"Inserting {len(ai_facts)} ai_usage_facts rows into ClickHouse...")
    inserted_ai = client.insert_ai_usage_facts(ai_facts)
    print(f"Inserted {inserted_ai} ai_usage_facts.")

    print("Seed complete successfully!")


if __name__ == "__main__":
    seed_data(days=90)
