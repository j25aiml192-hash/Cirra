# Sentinel — Cirra Anomaly Detection Service

Sentinel is an automated, statistical anomaly detection service for the Cirra cloud and AI financial governance platform. It continuously evaluates cloud infrastructure and AI API usage metrics to detect spend spikes, leaked keys, and unusual resource consumption patterns.

## Architecture & Design Principles

1. **No LLM in Detection Loop**: All anomaly detection is powered by robust statistical algorithms (Median Absolute Deviation, rolling baselines, and day-of-week seasonality correction).
2. **Read-Only ClickHouse**: Sentinel only issues read queries against ClickHouse analytics tables (`ai_usage_facts`, `cost_facts`) using dedicated read-only credentials (`cirra_reader`).
3. **Tenant-Scoped PostgreSQL Writes**: All detected anomalies are recorded into PostgreSQL under strict tenant isolation.
4. **Deterministic Explanations**: Human-readable explanations are generated deterministically from observed values, baselines, and percentage deviations—without relying on external LLM calls.
5. **Fault Tolerant**: Handles missing, cold-start, or delayed ClickHouse data gracefully by logging warnings and continuing operation without crashing.

## Detection Algorithms

- **AI Spend Spike Detection (`detect_ai_spend_spike`)**: Evaluates daily `cost_usd` per `(provider, api_key_id)` against a rolling 7-day median baseline using Median Absolute Deviation (MAD). Flags anomalies with modified Z-score > 3.0 and dollar impact >= $10.00, with day-of-week seasonality adjustment.
- **Cloud Spend Spike Detection (`detect_cloud_spend_spike`)**: Evaluates daily `billed_cost` per `(provider, service_name)` against rolling baselines. Flags anomalies with modified Z-score > 3.0 and dollar impact >= $50.00.
- **Leaked API Key Detection (`detect_leaked_key`)**: Identifies dormant keys (>7 days inactivity) suddenly active in the last 24h, usage surges exceeding 5x the 7-day median hourly rate, and off-hours (midnight to 5 AM UTC) activity.

## Scheduler Jobs

Using APScheduler (`AsyncIOScheduler`):
- `run_ai_anomaly_detection`: Every 5 minutes
- `run_cloud_anomaly_detection`: Every 60 minutes
- `run_leaked_key_detection`: Every 15 minutes

## Running Locally

```bash
# Install in editable mode
cd services/sentinel
pip install -e .

# Run Sentinel service
python -m app.main
```
