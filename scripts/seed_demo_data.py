import os
import sys
import uuid
import random
import asyncio
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
import clickhouse_connect
import asyncpg
from dotenv import load_dotenv

repo_root = Path(__file__).resolve().parent.parent
load_dotenv(repo_root / ".env")

TENANT_ID = "00000000-0000-0000-0000-000000000001"

PROVIDERS_CONFIG = {
    "openai": {
        "base_min": 48.0,
        "base_max": 62.0,
        "service_name": "OpenAI API",
        "service_category": "AI",
        "region": "global",
        "sku": "gpt-api",
        "res_id": "key-openai-prod",
    },
    "groq": {
        "base_min": 9.0,
        "base_max": 14.0,
        "service_name": "Groq Cloud LPU",
        "service_category": "AI",
        "region": "us-east-1",
        "sku": "groq-infer",
        "res_id": "key-groq-prod",
    },
    "anthropic": {
        "base_min": 22.0,
        "base_max": 34.0,
        "service_name": "Anthropic Claude API",
        "service_category": "AI",
        "region": "global",
        "sku": "claude-api",
        "res_id": "key-anthropic-prod",
    },
    "vercel": {
        "base_min": 11.0,
        "base_max": 17.0,
        "service_name": "Vercel Edge & Functions",
        "service_category": "Cloud",
        "region": "global",
        "sku": "vercel-pro",
        "res_id": "prj-cirra-frontend",
    },
    "render": {
        "base_min": 28.0,
        "base_max": 38.0,
        "service_name": "Render Cloud Compute",
        "service_category": "Cloud",
        "region": "us-east-1",
        "sku": "render-svc-worker",
        "res_id": "srv-cirra-backend",
    },
    "github": {
        "base_min": 4.0,
        "base_max": 8.0,
        "service_name": "GitHub Actions Compute",
        "service_category": "DevOps",
        "region": "global",
        "sku": "actions-ubuntu",
        "res_id": "repo-cirra-infra",
    },
}

def get_clickhouse_client():
    raw_host = os.getenv("CLICKHOUSE_HOST", "localhost")
    secure = "https://" in raw_host or int(os.getenv("CLICKHOUSE_PORT", "8123")) == 8443
    host = raw_host.replace("https://", "").replace("http://", "").split("/")[0].split(":")[0]
    port = int(os.getenv("CLICKHOUSE_PORT", "8443" if secure else "8123"))
    user = os.getenv("CLICKHOUSE_USER", "default")
    password = os.getenv("CLICKHOUSE_PASSWORD", "")
    database = os.getenv("CLICKHOUSE_DATABASE", "cirra")

    return clickhouse_connect.get_client(
        host=host,
        port=port,
        username=user,
        password=password,
        database=database,
        secure=secure,
    )

def seed_clickhouse(ch_client, now):
    print("Deleting existing tenant facts from ClickHouse...")
    try:
        ch_client.command(f"DELETE FROM cost_facts WHERE tenant_id = '{TENANT_ID}'")
        ch_client.command(f"DELETE FROM ai_usage_facts WHERE tenant_id = '{TENANT_ID}'")
    except Exception as e:
        print(f"Notice during delete: {e}")

    cost_facts = []
    ai_facts = []
    daily_ai_costs = { "openai": {}, "groq": {}, "anthropic": {} }

    # 1. Generate 90 days of cost_facts
    # day_idx: 0 (89 days ago) -> 89 (today)
    for day_idx in range(90):
        days_ago = 89 - day_idx
        day_date = (now - timedelta(days=days_ago)).date()
        p_start = datetime.combine(day_date, datetime.min.time(), tzinfo=timezone.utc)
        p_end = p_start + timedelta(days=1)
        is_weekend = day_date.weekday() in (5, 6)

        for provider, cfg in PROVIDERS_CONFIG.items():
            base_val = random.uniform(cfg["base_min"], cfg["base_max"])
            noise = random.uniform(0.85, 1.15)
            val = base_val * noise
            if is_weekend:
                val *= 0.60

            # Variance rules
            # Scattered medium spikes in days 15-70
            if day_idx == 25 and provider == "groq":
                val *= 1.8
            elif day_idx == 45 and provider == "anthropic":
                val *= 1.9
            elif day_idx == 60 and provider == "render":
                val *= 1.8  # day 60 autoscale event
            elif day_idx in (75, 76) and provider == "vercel":
                val *= 2.2  # day 75-76 deploy surge
            elif day_idx in (84, 85, 86, 87) and provider == "openai":
                val *= random.uniform(3.8, 4.8)  # main anomaly spike days 83-87

            cost_decimal = Decimal(str(round(val, 6)))
            row_hash = f"cf_{TENANT_ID[:6]}_{day_date.strftime('%Y%m%d')}_{provider}"

            cost_facts.append([
                TENANT_ID,
                p_start,
                p_end,
                cost_decimal,
                cost_decimal,
                "USD",
                provider,
                cfg["service_name"],
                cfg["service_category"],
                cfg["region"],
                cfg["res_id"],
                cfg["sku"],
                {"environment": "production", "source": "cirra-collector"},
                "engineering",
                "core_app",
                "production_billing",
                "allocated",
                row_hash,
                1,
                now,
            ])

            if provider in daily_ai_costs and days_ago < 30:
                daily_ai_costs[provider][day_date] = cost_decimal

    # 2. Generate hourly ai_usage_facts for the last 30 days
    # Hourly weights
    # Hours:
    # 2AM-6AM (2,3,4,5): 3% -> 0.0075 each
    # 6AM-9AM (6,7,8): 8% -> 0.08 / 3
    # 9AM-6PM (9..17, 9h): 65% -> 0.65 / 9
    # 6PM-10PM (18..21, 4h): 20% -> 0.20 / 4
    # 10PM-2AM (22,23,0,1, 4h): 4% -> 0.04 / 4
    normal_weights = {}
    for h in range(24):
        if 2 <= h < 6:
            normal_weights[h] = 0.03 / 4
        elif 6 <= h < 9:
            normal_weights[h] = 0.08 / 3
        elif 9 <= h < 18:
            normal_weights[h] = 0.65 / 9
        elif 18 <= h < 22:
            normal_weights[h] = 0.20 / 4
        else:
            normal_weights[h] = 0.04 / 4

    for days_ago in range(29, -1, -1):
        day_date = (now - timedelta(days=days_ago)).date()
        day_idx = 89 - days_ago
        is_openai_spike = day_idx in (84, 85, 86, 87)

        # Build hourly weights for this day
        openai_weights = {}
        if is_openai_spike:
            # 2AM-4AM (hours 2, 3) gets 40% (20% each)
            openai_weights[2] = 0.20
            openai_weights[3] = 0.20
            rem_weight = 0.60
            other_norm_sum = sum(normal_weights[h] for h in range(24) if h not in (2, 3))
            for h in range(24):
                if h not in (2, 3):
                    openai_weights[h] = (normal_weights[h] / other_norm_sum) * rem_weight
        else:
            openai_weights = normal_weights

        for hour in range(24):
            ts = datetime.combine(day_date, datetime.min.time(), tzinfo=timezone.utc) + timedelta(hours=hour)
            
            # OpenAI Models
            day_openai_cost = daily_ai_costs["openai"].get(day_date, Decimal("54.00"))
            hour_openai_cost = day_openai_cost * Decimal(str(openai_weights[hour]))
            
            # gpt-4o: 55%
            c_4o = (hour_openai_cost * Decimal("0.55")).quantize(Decimal("0.000001"))
            tok_4o = int(float(c_4o) / 0.000007)
            ai_facts.append([
                TENANT_ID, ts, "openai", "gpt-4o", "demo_key_sk_prod_001",
                int(tok_4o * 0.75), int(tok_4o * 0.25), 0, c_4o,
                "engineering", "enterprise", "agentic",
                f"ai_oa_4o_{ts.strftime('%Y%m%d%H')}", 1, now
            ])
            # gpt-4o-mini: 35%
            c_mini = (hour_openai_cost * Decimal("0.35")).quantize(Decimal("0.000001"))
            tok_mini = int(float(c_mini) / 0.00000030)
            ai_facts.append([
                TENANT_ID, ts, "openai", "gpt-4o-mini", "demo_key_sk_prod_001",
                int(tok_mini * 0.75), int(tok_mini * 0.25), 0, c_mini,
                "engineering", "enterprise", "batch",
                f"ai_oa_mini_{ts.strftime('%Y%m%d%H')}", 1, now
            ])
            # dall-e-3: 10%
            c_dalle = (hour_openai_cost * Decimal("0.10")).quantize(Decimal("0.000001"))
            ai_facts.append([
                TENANT_ID, ts, "openai", "dall-e-3", "demo_key_sk_prod_001",
                0, 0, 0, c_dalle,
                "design", "marketing", "creative",
                f"ai_oa_dalle_{ts.strftime('%Y%m%d%H')}", 1, now
            ])

            # Groq Models
            day_groq_cost = daily_ai_costs["groq"].get(day_date, Decimal("11.50"))
            hour_groq_cost = day_groq_cost * Decimal(str(normal_weights[hour]))
            
            # llama-3.1-70b: 65%
            c_70b = (hour_groq_cost * Decimal("0.65")).quantize(Decimal("0.000001"))
            tok_70b = int(float(c_70b) / 0.00000080)
            ai_facts.append([
                TENANT_ID, ts, "groq", "llama-3.1-70b", "demo_key_groq_prod",
                int(tok_70b * 0.75), int(tok_70b * 0.25), 0, c_70b,
                "engineering", "growth", "inference",
                f"ai_gq_70b_{ts.strftime('%Y%m%d%H')}", 1, now
            ])
            # llama-3.1-8b: 35%
            c_8b = (hour_groq_cost * Decimal("0.35")).quantize(Decimal("0.000001"))
            tok_8b = int(float(c_8b) / 0.00000010)
            ai_facts.append([
                TENANT_ID, ts, "groq", "llama-3.1-8b", "demo_key_groq_prod",
                int(tok_8b * 0.75), int(tok_8b * 0.25), 0, c_8b,
                "engineering", "growth", "fast_eval",
                f"ai_gq_8b_{ts.strftime('%Y%m%d%H')}", 1, now
            ])

            # Anthropic Models
            day_ant_cost = daily_ai_costs["anthropic"].get(day_date, Decimal("28.00"))
            hour_ant_cost = day_ant_cost * Decimal(str(normal_weights[hour]))

            # claude-3-5-sonnet: 75%
            c_sonnet = (hour_ant_cost * Decimal("0.75")).quantize(Decimal("0.000001"))
            tok_sonnet = int(float(c_sonnet) / 0.000006)
            ai_facts.append([
                TENANT_ID, ts, "anthropic", "claude-3-5-sonnet", "demo_key_ant_prod",
                int(tok_sonnet * 0.75), int(tok_sonnet * 0.25), 0, c_sonnet,
                "research", "enterprise", "coding",
                f"ai_ant_sonnet_{ts.strftime('%Y%m%d%H')}", 1, now
            ])
            # claude-3-haiku: 25%
            c_haiku = (hour_ant_cost * Decimal("0.25")).quantize(Decimal("0.000001"))
            tok_haiku = int(float(c_haiku) / 0.00000050)
            ai_facts.append([
                TENANT_ID, ts, "anthropic", "claude-3-haiku", "demo_key_ant_prod",
                int(tok_haiku * 0.75), int(tok_haiku * 0.25), 0, c_haiku,
                "research", "enterprise", "triage",
                f"ai_ant_haiku_{ts.strftime('%Y%m%d%H')}", 1, now
            ])

    # Insert cost_facts
    cost_columns = [
        "tenant_id", "charge_period_start", "charge_period_end",
        "billed_cost", "effective_cost", "currency", "provider",
        "service_name", "service_category", "region", "resource_id",
        "sku_id", "tags", "allocated_team", "allocated_customer",
        "allocated_feature", "allocation_method", "row_hash",
        "version", "inserted_at"
    ]
    print(f"Inserting {len(cost_facts)} cost_facts rows into ClickHouse...")
    ch_client.insert("cost_facts", cost_facts, column_names=cost_columns)
    print(f"Successfully inserted {len(cost_facts)} cost_facts rows.")

    # Insert ai_usage_facts
    ai_columns = [
        "tenant_id", "ts", "provider", "model", "api_key_id",
        "input_tokens", "output_tokens", "cached_tokens", "cost_usd",
        "team_tag", "customer_tag", "feature_tag", "row_hash",
        "version", "inserted_at"
    ]
    print(f"Inserting {len(ai_facts)} ai_usage_facts rows into ClickHouse...")
    ch_client.insert("ai_usage_facts", ai_facts, column_names=ai_columns)
    print(f"Successfully inserted {len(ai_facts)} ai_usage_facts rows.")

    return len(cost_facts), len(ai_facts)


async def seed_postgres(now):
    raw_db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/cirra")
    db_url = raw_db_url.replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(db_url)
    
    # Clean previous anomalies and savings
    await conn.execute("DELETE FROM savings_entries WHERE tenant_id = $1::uuid", TENANT_ID)
    await conn.execute("DELETE FROM actions WHERE tenant_id = $1::uuid", TENANT_ID)
    await conn.execute("DELETE FROM anomalies WHERE tenant_id = $1::uuid", TENANT_ID)

    anomalies_data = [
        # 1. day -75, groq, medium, resolved
        {
            "id": uuid.uuid4(),
            "provider": "groq",
            "severity": "medium",
            "status": "resolved",
            "baseline_value": Decimal("11.20"),
            "actual_value": Decimal("24.80"),
            "deviation_pct": Decimal("121.43"),
            "series_key": "cost:groq:ab_test",
            "api_key_id": "demo_key_groq_001",
            "alert_sent": True,
            "call_triggered": False,
            "detected_at": now - timedelta(days=75),
            "resolved_at": now - timedelta(days=74),
            "explanation": "Groq usage doubled during A/B test deployment",
        },
        # 2. day -60, render, medium, resolved
        {
            "id": uuid.uuid4(),
            "provider": "render",
            "severity": "medium",
            "status": "resolved",
            "baseline_value": Decimal("33.00"),
            "actual_value": Decimal("59.40"),
            "deviation_pct": Decimal("80.00"),
            "series_key": "cost:render:autoscale",
            "api_key_id": "demo_key_render_001",
            "alert_sent": True,
            "call_triggered": False,
            "detected_at": now - timedelta(days=60),
            "resolved_at": now - timedelta(days=59),
            "explanation": "Render autoscaled during load test",
        },
        # 3. day -45, anthropic, high, resolved
        {
            "id": uuid.uuid4(),
            "provider": "anthropic",
            "severity": "high",
            "status": "resolved",
            "baseline_value": Decimal("27.50"),
            "actual_value": Decimal("88.00"),
            "deviation_pct": Decimal("220.00"),
            "series_key": "cost:anthropic:batch_doc",
            "api_key_id": "demo_key_anthropic_001",
            "alert_sent": True,
            "call_triggered": False,
            "detected_at": now - timedelta(days=45),
            "resolved_at": now - timedelta(days=44),
            "explanation": "Batch doc processing job ran over weekend",
        },
        # 4. day -30, vercel, low, resolved
        {
            "id": uuid.uuid4(),
            "provider": "vercel",
            "severity": "low",
            "status": "resolved",
            "baseline_value": Decimal("14.20"),
            "actual_value": Decimal("22.60"),
            "deviation_pct": Decimal("59.15"),
            "series_key": "cost:vercel:edge",
            "api_key_id": "demo_key_vercel_001",
            "alert_sent": True,
            "call_triggered": False,
            "detected_at": now - timedelta(days=30),
            "resolved_at": now - timedelta(days=29),
            "explanation": "Edge function cold starts during traffic spike",
        },
        # 5. day -15, openai, critical, resolved
        {
            "id": uuid.uuid4(),
            "provider": "openai",
            "severity": "critical",
            "status": "resolved",
            "baseline_value": Decimal("52.00"),
            "actual_value": Decimal("231.00"),
            "deviation_pct": Decimal("344.23"),
            "series_key": "cost:openai:prod_loop",
            "api_key_id": "demo_key_openai_prev",
            "alert_sent": True,
            "call_triggered": True,
            "detected_at": now - timedelta(days=15),
            "resolved_at": now - timedelta(days=14),
            "explanation": "Runaway GPT-4o loop — key rotated after Cirra alert",
        },
        # 6. day -3, anthropic, high, open
        {
            "id": uuid.uuid4(),
            "provider": "anthropic",
            "severity": "high",
            "status": "open",
            "baseline_value": Decimal("29.00"),
            "actual_value": Decimal("93.00"),
            "deviation_pct": Decimal("220.69"),
            "series_key": "cost:anthropic:claude-3-5-sonnet",
            "api_key_id": "demo_key_anthropic_002",
            "alert_sent": True,
            "call_triggered": False,
            "detected_at": now - timedelta(days=3),
            "resolved_at": None,
            "explanation": "Unusual claude-3-5-sonnet usage — monitoring",
        },
        # 7. day -1, groq, medium, open
        {
            "id": uuid.uuid4(),
            "provider": "groq",
            "severity": "medium",
            "status": "open",
            "baseline_value": Decimal("10.80"),
            "actual_value": Decimal("20.10"),
            "deviation_pct": Decimal("86.11"),
            "series_key": "cost:groq:monitoring",
            "api_key_id": "demo_key_groq_002",
            "alert_sent": True,
            "call_triggered": False,
            "detected_at": now - timedelta(days=1),
            "resolved_at": None,
            "explanation": "Above-baseline groq usage",
        },
        # 8. NOW, openai, critical, open
        {
            "id": uuid.uuid4(),
            "provider": "openai",
            "severity": "critical",
            "status": "open",
            "baseline_value": Decimal("56.20"),
            "actual_value": Decimal("247.80"),
            "deviation_pct": Decimal("340.71"),
            "series_key": "cost:openai:demo_key_sk_prod_001",
            "api_key_id": "demo_key_sk_prod_001",
            "alert_sent": True,
            "call_triggered": True,
            "detected_at": now,
            "resolved_at": None,
            "explanation": "OpenAI spend spiked 341% at 2AM — possible unauthorized access or runaway process",
        },
    ]

    for a in anomalies_data:
        await conn.execute(
            """
            INSERT INTO anomalies (
                id, tenant_id, series_key, provider, api_key_id,
                detected_at, severity, status, baseline_value, actual_value,
                deviation_pct, explanation, alert_sent, call_triggered, resolved_at, created_at
            ) VALUES (
                $1, $2::uuid, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $6
            )
            """,
            a["id"], TENANT_ID, a["series_key"], a["provider"], a["api_key_id"],
            a["detected_at"], a["severity"], a["status"], a["baseline_value"], a["actual_value"],
            a["deviation_pct"], a["explanation"], a["alert_sent"], a["call_triggered"], a["resolved_at"]
        )

    # 4 PostgreSQL Savings Entries
    savings_data = [
        # 1. linked to anomaly 5 (openai critical resolved)
        {
            "id": uuid.uuid4(),
            "anomaly_id": anomalies_data[4]["id"],
            "method": "counterfactual",
            "status": "verified",
            "baseline_cost": Decimal("5580.00"),
            "realized_cost": Decimal("0.00"),
            "period_start": now - timedelta(days=15),
            "period_end": now,
            "notes": "Avoided 30-day runaway spend at $186/day excess",
        },
        # 2. linked to anomaly 3 (anthropic high resolved)
        {
            "id": uuid.uuid4(),
            "anomaly_id": anomalies_data[2]["id"],
            "method": "counterfactual",
            "status": "verified",
            "baseline_cost": Decimal("1830.00"),
            "realized_cost": Decimal("0.00"),
            "period_start": now - timedelta(days=45),
            "period_end": now,
            "notes": "Batch doc processing job ran over weekend ($1,830.00)",
        },
        # 3. linked to anomaly 6 (anthropic open)
        {
            "id": uuid.uuid4(),
            "anomaly_id": anomalies_data[5]["id"],
            "method": "counterfactual",
            "status": "identified",
            "baseline_cost": Decimal("1920.00"),
            "realized_cost": Decimal("0.00"),
            "period_start": now - timedelta(days=3),
            "period_end": now,
            "notes": "Unusual claude-3-5-sonnet usage counterfactual ($1,920.00)",
        },
        # 4. linked to anomaly 8 (live openai critical)
        {
            "id": uuid.uuid4(),
            "anomaly_id": anomalies_data[7]["id"],
            "method": "counterfactual",
            "status": "identified",
            "baseline_cost": Decimal("5748.00"),
            "realized_cost": Decimal("0.00"),
            "period_start": now,
            "period_end": now,
            "notes": "OpenAI spend spiked 341% at 2AM counterfactual ($5,748.00)",
        },
    ]

    for s in savings_data:
        await conn.execute(
            """
            INSERT INTO savings_entries (
                id, tenant_id, anomaly_id, method,
                baseline_cost, realized_cost, period_start, period_end,
                currency, confidence, status, notes, created_at
            ) VALUES (
                $1, $2::uuid, $3, $4,
                $5, $6, $7, $8,
                'USD', 'exact', $9, $10, $7
            )
            """,
            s["id"], TENANT_ID, s["anomaly_id"], s["method"],
            s["baseline_cost"], s["realized_cost"], s["period_start"], s["period_end"],
            s["status"], s["notes"]
        )

    await conn.close()
    return len(anomalies_data), len(savings_data)


def main():
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    ch_client = get_clickhouse_client()

    cf_count, ai_count = seed_clickhouse(ch_client, now)
    anom_count, sav_count = asyncio.run(seed_postgres(now))

    verified_total = Decimal("5580.00") + Decimal("1830.00")
    identified_total = Decimal("1920.00") + Decimal("5748.00")

    print("\n" + "="*50)
    print("SEEDING COMPLETE:")
    print(f"cost_facts rows inserted: {cf_count}")
    print(f"ai_usage_facts rows inserted: {ai_count}")
    print(f"anomalies inserted: {anom_count}")
    print(f"savings inserted: {sav_count}")
    print(f"Total identified savings: ${identified_total:.2f}")
    print(f"Total verified savings: ${verified_total:.2f}")
    print("="*50)


if __name__ == "__main__":
    main()
