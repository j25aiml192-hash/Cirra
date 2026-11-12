import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
import clickhouse_connect

from app.config import settings

logger = logging.getLogger("cirra.sentinel.clickhouse")


class ClickHouseReader:
    """
    Read-only ClickHouse client for Sentinel.
    Enforces read-only operations and tenant-scoped queries.
    Gracefully handles network errors and empty tables.
    """

    def __init__(self):
        self._client = None

    def get_client(self):
        if self._client is None:
            host = settings.effective_ch_host
            port = settings.CLICKHOUSE_PORT
            user = settings.effective_ch_user
            password = settings.effective_ch_password
            database = settings.CLICKHOUSE_DATABASE
            secure = settings.effective_ch_secure

            logger.info(
                f"Connecting to ClickHouse at {host}:{port} (secure={secure}) as '{user}' db='{database}'"
            )
            self._client = clickhouse_connect.get_client(
                host=host,
                port=port,
                username=user,
                password=password,
                database=database,
                secure=secure,
                connect_timeout=10,
                send_receive_timeout=30,
            )
        return self._client

    def reset_client(self):
        self._client = None

    def get_daily_ai_spend(
        self, tenant_id: str, lookback_days: int = 14
    ) -> List[Dict[str, Any]]:
        """
        Fetch daily cost_usd totals for each (provider, api_key_id) over lookback_days.
        """
        query = """
        SELECT
            provider,
            api_key_id,
            toDate(ts) AS day,
            toDayOfWeek(ts) AS day_of_week,
            sum(cost_usd) AS daily_cost,
            count() AS request_count
        FROM ai_usage_facts
        WHERE tenant_id = %(tenant_id)s
          AND ts >= now() - INTERVAL %(lookback_days)s DAY
        GROUP BY provider, api_key_id, day, day_of_week
        ORDER BY provider, api_key_id, day ASC
        """
        try:
            client = self.get_client()
            result = client.query(
                query,
                parameters={"tenant_id": str(tenant_id), "lookback_days": lookback_days},
            )
            cols = result.column_names
            rows = [dict(zip(cols, row)) for row in result.result_rows]
            if not rows:
                logger.warning(
                    f"No ai_usage_facts records found for tenant {tenant_id} in past {lookback_days} days."
                )
            return rows
        except Exception as e:
            logger.warning(
                f"Graceful skip: Error querying ai_usage_facts in ClickHouse for tenant {tenant_id}: {e}"
            )
            self.reset_client()
            return []

    def get_daily_cloud_spend(
        self, tenant_id: str, lookback_days: int = 14
    ) -> List[Dict[str, Any]]:
        """
        Fetch daily billed_cost totals for each (provider, service_name) over lookback_days.
        """
        query = """
        SELECT
            provider,
            service_name,
            toDate(charge_period_start) AS day,
            toDayOfWeek(charge_period_start) AS day_of_week,
            sum(billed_cost) AS daily_cost
        FROM cost_facts
        WHERE tenant_id = %(tenant_id)s
          AND charge_period_start >= now() - INTERVAL %(lookback_days)s DAY
        GROUP BY provider, service_name, day, day_of_week
        ORDER BY provider, service_name, day ASC
        """
        try:
            client = self.get_client()
            result = client.query(
                query,
                parameters={"tenant_id": str(tenant_id), "lookback_days": lookback_days},
            )
            cols = result.column_names
            rows = [dict(zip(cols, row)) for row in result.result_rows]
            if not rows:
                logger.warning(
                    f"No cost_facts records found for tenant {tenant_id} in past {lookback_days} days."
                )
            return rows
        except Exception as e:
            logger.warning(
                f"Graceful skip: Error querying cost_facts in ClickHouse for tenant {tenant_id}: {e}"
            )
            self.reset_client()
            return []

    def get_key_dormancy_stats(
        self, tenant_id: str, dormancy_days: int = 7
    ) -> List[Dict[str, Any]]:
        """
        Find keys active in the last 24h that were dormant for >= dormancy_days prior.
        """
        query = """
        SELECT
            provider,
            api_key_id,
            max(ts) AS last_seen,
            countIf(ts >= now() - INTERVAL 1 DAY) AS reqs_last_24h,
            sumIf(cost_usd, ts >= now() - INTERVAL 1 DAY) AS cost_last_24h,
            maxIf(ts, ts < now() - INTERVAL 1 DAY) AS last_seen_before_24h,
            dateDiff('day', maxIf(ts, ts < now() - INTERVAL 1 DAY), minIf(ts, ts >= now() - INTERVAL 1 DAY)) AS days_dormant
        FROM ai_usage_facts
        WHERE tenant_id = %(tenant_id)s
          AND ts >= now() - INTERVAL 60 DAY
        GROUP BY provider, api_key_id
        HAVING reqs_last_24h > 0
           AND (last_seen_before_24h = toDateTime(0) OR days_dormant >= %(dormancy_days)s)
        """
        try:
            client = self.get_client()
            result = client.query(
                query,
                parameters={"tenant_id": str(tenant_id), "dormancy_days": dormancy_days},
            )
            cols = result.column_names
            return [dict(zip(cols, row)) for row in result.result_rows]
        except Exception as e:
            logger.warning(
                f"Graceful skip: Error checking key dormancy in ClickHouse for tenant {tenant_id}: {e}"
            )
            self.reset_client()
            return []

    def get_hourly_key_usage(
        self, tenant_id: str, lookback_days: int = 7
    ) -> List[Dict[str, Any]]:
        """
        Hourly usage breakdown for each key over past lookback_days.
        Used to detect >5x hourly usage rate spikes.
        """
        query = """
        SELECT
            provider,
            api_key_id,
            toStartOfHour(ts) AS hour_bucket,
            count() AS hourly_requests,
            sum(cost_usd) AS hourly_cost
        FROM ai_usage_facts
        WHERE tenant_id = %(tenant_id)s
          AND ts >= now() - INTERVAL %(lookback_days)s DAY
        GROUP BY provider, api_key_id, hour_bucket
        ORDER BY provider, api_key_id, hour_bucket ASC
        """
        try:
            client = self.get_client()
            result = client.query(
                query,
                parameters={"tenant_id": str(tenant_id), "lookback_days": lookback_days},
            )
            cols = result.column_names
            return [dict(zip(cols, row)) for row in result.result_rows]
        except Exception as e:
            logger.warning(
                f"Graceful skip: Error querying hourly key usage for tenant {tenant_id}: {e}"
            )
            self.reset_client()
            return []

    def get_off_hours_key_usage(
        self, tenant_id: str, start_hour: int = 0, end_hour: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Check for activity occurring during off-hours (midnight to 5 AM UTC) in last 24 hours.
        """
        query = """
        SELECT
            provider,
            api_key_id,
            count() AS off_hour_requests,
            sum(cost_usd) AS off_hour_cost,
            min(toHour(ts)) AS min_off_hour,
            max(toHour(ts)) AS max_off_hour
        FROM ai_usage_facts
        WHERE tenant_id = %(tenant_id)s
          AND ts >= now() - INTERVAL 1 DAY
          AND toHour(ts) >= %(start_hour)s
          AND toHour(ts) < %(end_hour)s
        GROUP BY provider, api_key_id
        HAVING off_hour_requests > 0
        """
        try:
            client = self.get_client()
            result = client.query(
                query,
                parameters={
                    "tenant_id": str(tenant_id),
                    "start_hour": start_hour,
                    "end_hour": end_hour,
                },
            )
            cols = result.column_names
            return [dict(zip(cols, row)) for row in result.result_rows]
        except Exception as e:
            logger.warning(
                f"Graceful skip: Error querying off-hours key usage for tenant {tenant_id}: {e}"
            )
            self.reset_client()
            return []


ch_reader = ClickHouseReader()
