import logging
import uuid
from typing import List, Optional
import asyncpg
from app.config import settings
from app.detector import DetectedAnomaly

logger = logging.getLogger("cirra.sentinel.db")

_pool: Optional[asyncpg.Pool] = None


async def get_db_pool() -> asyncpg.Pool:
    """Create or return existing asyncpg connection pool."""
    global _pool
    if _pool is None:
        dsn = settings.asyncpg_database_url
        logger.info("Initializing asyncpg connection pool to PostgreSQL...")
        _pool = await asyncpg.create_pool(
            dsn=dsn,
            min_size=0,
            max_size=10,
            timeout=2.0,
            command_timeout=10.0,
        )
    return _pool


async def close_db_pool() -> None:
    """Close asyncpg connection pool."""
    global _pool
    if _pool is not None:
        logger.info("Closing asyncpg connection pool...")
        await _pool.close()
        _pool = None


async def ensure_db_constraints(conn: asyncpg.Connection) -> None:
    """
    Ensure unique index exists for idempotent ON CONFLICT writes.
    If already exists or creation succeeds, ON CONFLICT works natively.
    """
    try:
        await conn.execute(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE tablename = 'anomalies' 
                      AND indexname = 'uq_anomalies_tenant_series_date'
                ) THEN
                    BEGIN
                        CREATE UNIQUE INDEX uq_anomalies_tenant_series_date 
                        ON anomalies (tenant_id, series_key, (CAST(detected_at AT TIME ZONE 'UTC' AS date)));
                    EXCEPTION WHEN OTHERS THEN
                        -- Ignore if immutable constraint or permissions restrict index creation
                        NULL;
                    END;
                END IF;
            END $$;
            """
        )
    except Exception as e:
        logger.debug(f"Index check notice (handled gracefully): {e}")


async def fetch_active_tenants(conn: asyncpg.Connection) -> List[str]:
    """Fetch all active tenant IDs from PostgreSQL."""
    try:
        rows = await conn.fetch("SELECT id::text FROM tenants ORDER BY created_at ASC;")
        return [r["id"] for r in rows]
    except Exception as e:
        logger.error(f"Error fetching active tenants: {e}")
        return []


async def write_anomaly(
    anomaly: DetectedAnomaly,
    explanation: str,
    conn: asyncpg.Connection,
) -> str:
    """
    Write detected anomaly to PostgreSQL anomalies table with RLS tenant scoping.
    Uses ON CONFLICT to avoid duplicate alerts for the same series on the same day.
    Falls back gracefully if the composite index is not present in the existing schema.
    """
    tenant_id_uuid = uuid.UUID(anomaly.tenant_id)

    # Primary statement with ON CONFLICT
    on_conflict_sql = """
    INSERT INTO anomalies (
        id, tenant_id, series_key, provider, api_key_id, 
        detected_at, severity, status, baseline_value, 
        actual_value, deviation_pct, explanation, 
        alert_sent, call_triggered, created_at
    )
    VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 
        now(), $5, 'open', $6, 
        $7, $8, $9, 
        false, false, now()
    )
    ON CONFLICT (tenant_id, series_key, (CAST(detected_at AT TIME ZONE 'UTC' AS date)))
    DO UPDATE SET actual_value = EXCLUDED.actual_value,
                  deviation_pct = EXCLUDED.deviation_pct,
                  explanation = EXCLUDED.explanation
    WHERE anomalies.status = 'open'
    RETURNING id::text;
    """

    try:
        anomaly_id = await conn.fetchval(
            on_conflict_sql,
            tenant_id_uuid,
            anomaly.series_key,
            anomaly.provider,
            anomaly.api_key_id,
            anomaly.severity,
            anomaly.baseline_value,
            anomaly.actual_value,
            anomaly.deviation_pct,
            explanation,
        )
        if anomaly_id:
            return str(anomaly_id)
    except Exception as exc:
        logger.debug(f"Native ON CONFLICT failed ({exc}), falling back to atomic check-and-update...")

    # Fallback: check if an open anomaly for today already exists for this tenant & series
    existing_sql = """
    SELECT id::text FROM anomalies
    WHERE tenant_id = $1
      AND series_key = $2
      AND (detected_at AT TIME ZONE 'UTC')::date = (now() AT TIME ZONE 'UTC')::date
      AND status = 'open'
    LIMIT 1;
    """
    existing_id = await conn.fetchval(existing_sql, tenant_id_uuid, anomaly.series_key)

    if existing_id:
        update_sql = """
        UPDATE anomalies
        SET actual_value = $1,
            deviation_pct = $2,
            explanation = $3
        WHERE id = $4::uuid
        RETURNING id::text;
        """
        updated_id = await conn.fetchval(
            update_sql,
            anomaly.actual_value,
            anomaly.deviation_pct,
            explanation,
            existing_id,
        )
        return str(updated_id or existing_id)

    # Insert new anomaly record
    insert_sql = """
    INSERT INTO anomalies (
        id, tenant_id, series_key, provider, api_key_id, 
        detected_at, severity, status, baseline_value, 
        actual_value, deviation_pct, explanation, 
        alert_sent, call_triggered, created_at
    )
    VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 
        now(), $5, 'open', $6, 
        $7, $8, $9, 
        false, false, now()
    )
    RETURNING id::text;
    """
    new_id = await conn.fetchval(
        insert_sql,
        tenant_id_uuid,
        anomaly.series_key,
        anomaly.provider,
        anomaly.api_key_id,
        anomaly.severity,
        anomaly.baseline_value,
        anomaly.actual_value,
        anomaly.deviation_pct,
        explanation,
    )
    return str(new_id)
