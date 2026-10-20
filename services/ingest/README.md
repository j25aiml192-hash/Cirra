# Cirra Ingestion Service (`services/ingest`)

Production ingestion pipeline for Cirra (MVP 1, Sprint 2). Ingests multi-cloud infrastructure and AI usage telemetry into ClickHouse formatted strictly according to the **FinOps Open Cost and Usage Specification (FOCUS)**.

---

## 1. Architecture Highlights

- **ClickHouse Schema**:
  - `cost_facts`: Cloud infrastructure spend partitioned by `toYYYYMM(charge_period_start)`, ordered by `(tenant_id, provider, charge_period_start, resource_id, sku_id)`.
  - `ai_usage_facts`: Token usage and inference spend partitioned by `toYYYYMM(timestamp)`, ordered by `(tenant_id, provider, timestamp, model, api_key_id)`.
  - Utilizes `ReplacingMergeTree(version)` with deterministic SHA-256 row hashing (`calculate_cost_row_hash`) for idempotent re-ingestion.
  - Money amounts are strictly typed as `Decimal(18, 4)` and `Decimal(18, 6)`, never `Float`.
- **Role Isolation**:
  - `cirra_ingest`: Write-only user for Celery ingest workers.
  - `cirra_reader`: Read-only user for FastAPI endpoints and Ask Cirra analytics.
- **Tenant Isolation**:
  - `tenant_id` is **never** accepted from untrusted task arguments; workers strictly resolve `tenant_id` from the Postgres `connections` row.
  - All ClickHouse queries strictly require and enforce parameterized `WHERE tenant_id = %(tenant_id)s`.
- **Safety Assertions**:
  - Read-only enforcement (`assert_read_only_action`, `assert_read_only_request`) ensures write operations are blocked.
  - Sensitive tokens and API keys are masked in logs and redacted from `connections.last_error`.

---

## 2. Running ClickHouse Migrations

The migration runner applies versioned SQL scripts in `services/ingest/migrations/`:

```bash
# Run migrations using the runner
python services/ingest/migrations/runner.py
```

---

## 3. Running Worker & Beat Locally

Ensure Redis and ClickHouse are running (e.g. via `docker compose up -d redis clickhouse postgres`).

### Start Celery Ingest Worker
```bash
cd services/ingest
celery -A worker.celery_app worker --loglevel=info -Q cloud_cost,ai_usage,scheduler
```

### Start Celery Beat Scheduler
```bash
cd services/ingest
celery -A worker.celery_app beat --loglevel=info
```

Beat triggers:
- Cloud Cost sync: Every 4 hours (`sync-cloud-every-4h`)
- AI Usage sync: Hourly (`sync-ai-hourly`)

---

## 4. Running in Mock Mode

Set `INGEST_MOCK=true` to run connectors and tests without live AWS or OpenAI cloud credentials:

```bash
# In shell or .env
export INGEST_MOCK=true

# Or on Windows PowerShell:
$env:INGEST_MOCK="true"
```

In mock mode:
- AWS connector generates synthetic 90-day EC2, S3, RDS, and Lambda cost records.
- OpenAI connector generates synthetic daily token telemetry for GPT-4o, GPT-4o-mini, and embeddings.

---

## 5. How to Backfill a Connection

To trigger an on-demand historical backfill for an existing connection:

```python
# Using Python interactive shell or script
from tasks import ingest_cost_explorer, ingest_openai_usage

# Backfill AWS connection (pulls 90 days of history if last_synced_at is reset, or incremental)
ingest_cost_explorer.delay("your-connection-uuid-here")

# Backfill OpenAI connection
ingest_openai_usage.delay("your-connection-uuid-here")
```

---

## 6. Seeding Synthetic FOCUS Data

To seed 90 days of realistic multi-service cloud costs and AI token telemetry for development:

```bash
python scripts/seed/seed_clickhouse.py
```

This populates realistic data for two separate tenants (`Tenant A: Acme Corp` and `Tenant B: Beta Labs`).

---

## 7. Running Tests

```bash
pytest services/ingest/tests -v
```

Includes:
- Normalizer unit tests (zero cost, negative credits, missing tags, multi-currency, Decimal precision).
- Idempotency test (ReplacingMergeTree deduplication).
- Tenant isolation tests (ClickHouse parameterized filtering).
- Task failure and retry tests (provider 500 backoff, credential sanitization in `last_error`).
- Integration tests (mock mode end-to-end sync).
- Encryption divergence guard (verifying 100% interoperability with API AES-256-GCM scheme).
