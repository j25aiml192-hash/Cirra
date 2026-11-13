import asyncio
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import asyncpg
from dotenv import load_dotenv

load_dotenv(r"c:\PROJECTS(ALL)\Cirra\.env")

TENANT_ID = "00000000-0000-0000-0000-000000000001"

async def seed():
    conn = await asyncpg.connect("postgresql://postgres:postgrespassword@localhost:5432/cirra")
    
    # Clean previous anomalies and savings for tenant zero
    await conn.execute("DELETE FROM savings_entries WHERE tenant_id = $1::uuid", TENANT_ID)
    await conn.execute("DELETE FROM actions WHERE tenant_id = $1::uuid", TENANT_ID)
    await conn.execute("DELETE FROM voice_calls WHERE tenant_id = $1::uuid", TENANT_ID)
    await conn.execute("DELETE FROM anomalies WHERE tenant_id = $1::uuid", TENANT_ID)
    
    now = datetime.now(timezone.utc)
    
    anomalies_data = [
        # Anomaly 1
        {
            "id": uuid.uuid4(),
            "provider": "groq",
            "severity": "medium",
            "status": "resolved",
            "baseline_value": Decimal("12.00"),
            "actual_value": Decimal("28.50"),
            "deviation_pct": Decimal("137.50"),
            "series_key": "cost:groq:ab_test",
            "api_key_id": "demo_key_groq_001",
            "alert_sent": True,
            "call_triggered": False,
            "detected_at": now - timedelta(days=14),
            "resolved_at": now - timedelta(days=13),
            "explanation": "Groq usage doubled during A/B test deployment",
        },
        # Anomaly 2
        {
            "id": uuid.uuid4(),
            "provider": "vercel",
            "severity": "low",
            "status": "resolved",
            "baseline_value": Decimal("14.50"),
            "actual_value": Decimal("21.00"),
            "deviation_pct": Decimal("44.83"),
            "series_key": "cost:vercel:edge",
            "api_key_id": "demo_key_vercel_001",
            "alert_sent": True,
            "call_triggered": False,
            "detected_at": now - timedelta(days=10),
            "resolved_at": now - timedelta(days=9),
            "explanation": "Edge function cold starts during traffic spike",
        },
        # Anomaly 3
        {
            "id": uuid.uuid4(),
            "provider": "anthropic",
            "severity": "high",
            "status": "resolved",
            "baseline_value": Decimal("28.00"),
            "actual_value": Decimal("89.50"),
            "deviation_pct": Decimal("219.64"),
            "series_key": "cost:anthropic:batch_doc",
            "api_key_id": "demo_key_anthropic_001",
            "alert_sent": True,
            "call_triggered": False,
            "detected_at": now - timedelta(days=7),
            "resolved_at": now - timedelta(days=6),
            "explanation": "Batch document processing job ran over weekend",
        },
        # Anomaly 4
        {
            "id": uuid.uuid4(),
            "provider": "openai",
            "severity": "critical",
            "status": "resolved",
            "baseline_value": Decimal("52.00"),
            "actual_value": Decimal("234.00"),
            "deviation_pct": Decimal("350.00"),
            "series_key": "cost:openai:prod_loop",
            "api_key_id": "demo_key_openai_prev",
            "alert_sent": True,
            "call_triggered": True,
            "detected_at": now - timedelta(days=5),
            "resolved_at": now - timedelta(days=4),
            "explanation": "Runaway GPT-4o loop in production — key rotated",
        },
        # Anomaly 5
        {
            "id": uuid.uuid4(),
            "provider": "render",
            "severity": "medium",
            "status": "resolved",
            "baseline_value": Decimal("32.00"),
            "actual_value": Decimal("58.00"),
            "deviation_pct": Decimal("81.25"),
            "series_key": "cost:render:autoscale",
            "api_key_id": "demo_key_render_001",
            "alert_sent": True,
            "call_triggered": False,
            "detected_at": now - timedelta(days=3),
            "resolved_at": now - timedelta(days=2),
            "explanation": "Autoscaling triggered by traffic test",
        },
        # Anomaly 6
        {
            "id": uuid.uuid4(),
            "provider": "anthropic",
            "severity": "high",
            "status": "open",
            "baseline_value": Decimal("30.00"),
            "actual_value": Decimal("95.00"),
            "deviation_pct": Decimal("216.67"),
            "series_key": "cost:anthropic:claude-3-5-sonnet",
            "api_key_id": "demo_key_anthropic_002",
            "alert_sent": True,
            "call_triggered": False,
            "detected_at": now - timedelta(days=1),
            "resolved_at": None,
            "explanation": "Unusual claude-3-5-sonnet usage spike — investigate",
        },
        # Anomaly 7
        {
            "id": uuid.uuid4(),
            "provider": "groq",
            "severity": "medium",
            "status": "open",
            "baseline_value": Decimal("10.50"),
            "actual_value": Decimal("19.80"),
            "deviation_pct": Decimal("88.57"),
            "series_key": "cost:groq:monitoring",
            "api_key_id": "demo_key_groq_002",
            "alert_sent": True,
            "call_triggered": False,
            "detected_at": now - timedelta(hours=12),
            "resolved_at": None,
            "explanation": "Above-baseline usage — monitoring",
        },
        # Anomaly 8 (Live Demo Anomaly)
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
            "alert_sent": False,
            "call_triggered": False,
            "detected_at": now,
            "resolved_at": None,
            "explanation": "OpenAI API spend spiked 341% above baseline.\nDetected at 2AM — inconsistent with historical pattern.\nPossible unauthorized access or runaway process.",
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

    live_anomaly_id = str(anomalies_data[7]["id"])
    
    # Savings Entries (Step 5)
    savings_data = [
        # Entry 1: linked to anomaly 4 (openai critical resolved)
        {
            "id": uuid.uuid4(),
            "anomaly_id": anomalies_data[3]["id"],
            "method": "counterfactual",
            "status": "verified",
            "baseline_cost": Decimal("5460.00"),
            "realized_cost": Decimal("0.00"),
            "period_start": now - timedelta(days=5),
            "period_end": now,
            "notes": "Resolved runaway GPT-4o loop (30 days avoided spend: $5,460.00)",
        },
        # Entry 2: linked to anomaly 3 (anthropic high resolved)
        {
            "id": uuid.uuid4(),
            "anomaly_id": anomalies_data[2]["id"],
            "method": "counterfactual",
            "status": "verified",
            "baseline_cost": Decimal("1830.00"),
            "realized_cost": Decimal("0.00"),
            "period_start": now - timedelta(days=7),
            "period_end": now,
            "notes": "Batch document processing job ran over weekend ($1,830.00)",
        },
        # Entry 3: linked to anomaly 1 (groq medium resolved)
        {
            "id": uuid.uuid4(),
            "anomaly_id": anomalies_data[0]["id"],
            "method": "counterfactual",
            "status": "identified",
            "baseline_cost": Decimal("490.00"),
            "realized_cost": Decimal("0.00"),
            "period_start": now - timedelta(days=14),
            "period_end": now,
            "notes": "Groq A/B test deployment savings ($490.00)",
        },
        # Entry 4: linked to LIVE_ANOMALY_ID (anomaly 8)
        {
            "id": uuid.uuid4(),
            "anomaly_id": anomalies_data[7]["id"],
            "method": "counterfactual",
            "status": "identified",
            "baseline_cost": Decimal("5748.00"),
            "realized_cost": Decimal("0.00"),
            "period_start": now,
            "period_end": now,
            "notes": "OpenAI 341% spike counterfactual projected savings ($5,748.00)",
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
    
    print("=== SEEDED ANOMALIES ===")
    for idx, a in enumerate(anomalies_data, 1):
        print(f"Anomaly {idx} ({a['status']}, {a['provider']}): {a['id']}")
    print(f"\nLIVE_ANOMALY_ID={live_anomaly_id}")
    
    verified_total = Decimal("5460.00") + Decimal("1830.00")
    identified_total = Decimal("490.00") + Decimal("5748.00")
    print(f"\nTOTAL_VERIFIED_SAVINGS=${verified_total}")
    print(f"TOTAL_IDENTIFIED_SAVINGS=${identified_total}")
    print(f"TOTAL_SAVINGS=${verified_total + identified_total}")

if __name__ == "__main__":
    asyncio.run(seed())
