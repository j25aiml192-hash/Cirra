import asyncio
import logging
import sys
from decimal import Decimal

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(line_buffering=True)

from app.detector import DetectedAnomaly
from app.explainer import explain_anomaly
from app.notifier import AlertNotifier

# Configure logging to stdout
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)


async def main():
    print("========================================", flush=True)
    print("Testing Sentinel Alert Delivery System", flush=True)
    print("========================================", flush=True)

    # Create fake DetectedAnomaly with required fields
    anomaly = DetectedAnomaly(
        tenant_id="00000000-0000-0000-0000-000000000001",
        series_key="openai:mock_key_sk_prod_001:daily_cost",
        provider="openai",
        api_key_id="mock_key_sk_prod_001",
        severity="critical",
        detection_type="spend_spike",
        baseline_value=Decimal("56.20"),
        actual_value=Decimal("247.80"),
        deviation_pct=Decimal("340.71"),
        raw_z_score=5.12,
        extra_data={"day_of_week": 4},
    )

    explanation = explain_anomaly(anomaly)
    print(f"Generated Explanation:\n{explanation}\n", flush=True)

    anomaly_db_id = "00000000-0000-0000-0000-000000000099"
    notifier = AlertNotifier()

    print("Running notify_all against fake anomaly...", flush=True)
    result = await notifier.notify_all(
        anomaly=anomaly,
        explanation=explanation,
        anomaly_db_id=anomaly_db_id,
    )

    print("\n----------------------------------------", flush=True)
    print(f"NotifyResult: {result}", flush=True)
    print(f"Status codes: {notifier.last_status_codes}", flush=True)
    print("----------------------------------------", flush=True)

    return result


if __name__ == "__main__":
    asyncio.run(main())
