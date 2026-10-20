-- 001_initial_schema.sql

CREATE TABLE IF NOT EXISTS schema_migrations (
    version String,
    applied_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY version;

CREATE TABLE IF NOT EXISTS cost_facts (
    tenant_id UUID,
    charge_period_start DateTime,
    charge_period_end DateTime,
    billed_cost Decimal(18, 4),
    effective_cost Decimal(18, 4),
    currency LowCardinality(String),
    provider LowCardinality(String),
    service_name LowCardinality(String),
    service_category LowCardinality(String),
    region LowCardinality(String),
    resource_id String,
    sku_id String,
    tags Map(String, String),
    allocation_method LowCardinality(String),
    row_hash String,
    ingested_at DateTime DEFAULT now(),
    version UInt64 DEFAULT 1
) ENGINE = ReplacingMergeTree(version)
PARTITION BY toYYYYMM(charge_period_start)
ORDER BY (tenant_id, provider, charge_period_start, resource_id, sku_id);

CREATE TABLE IF NOT EXISTS ai_usage_facts (
    tenant_id UUID,
    timestamp DateTime,
    provider LowCardinality(String),
    model LowCardinality(String),
    api_key_id String,
    input_tokens UInt64,
    output_tokens UInt64,
    cached_tokens UInt64,
    cost_usd Decimal(18, 6),
    row_hash String,
    tags Map(String, String),
    ingested_at DateTime DEFAULT now(),
    version UInt64 DEFAULT 1
) ENGINE = ReplacingMergeTree(version)
PARTITION BY toYYYYMM(timestamp)
ORDER BY (tenant_id, provider, timestamp, model, api_key_id);
