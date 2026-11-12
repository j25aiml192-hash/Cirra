import logging
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any, Dict, List, Optional
from datetime import date, datetime
import numpy as np

from app.clickhouse import ch_reader
from app.config import settings

logger = logging.getLogger("cirra.sentinel.detector")


@dataclass
class DetectedAnomaly:
    tenant_id: str
    series_key: str
    provider: str
    api_key_id: Optional[str]
    severity: str  # 'low','medium','high','critical'
    detection_type: str  # 'spend_spike','cloud_spike','leaked_key'
    baseline_value: Decimal
    actual_value: Decimal
    deviation_pct: Decimal
    raw_z_score: float
    extra_data: Dict[str, Any] = field(default_factory=dict)


def calculate_mad_zscore(
    actual: float, baseline: float, history: List[float]
) -> tuple[float, float]:
    """
    Compute Median Absolute Deviation (MAD) and modified Z-score.
    Consistency constant for normal distribution is 1.4826.
    Returns (z_score, mad).
    """
    if not history:
        return 0.0, 0.0
    arr = np.array(history, dtype=float)
    med = float(np.median(arr))
    mad = float(np.median(np.abs(arr - med)))
    denom = 1.4826 * mad
    if denom < 1e-4:
        denom = 1e-4
    z = (actual - baseline) / denom
    return float(z), mad


def determine_spend_severity(z_score: float, dollar_delta: float) -> str:
    """Classify anomaly severity based on z_score and absolute dollar delta."""
    if z_score >= 6.0 or dollar_delta >= 500.0:
        return "critical"
    elif z_score >= 4.5 or dollar_delta >= 100.0:
        return "high"
    elif z_score >= 3.5 or dollar_delta >= 25.0:
        return "medium"
    return "low"


class AnomalyDetector:
    def __init__(self, reader=None):
        self.reader = reader or ch_reader

    def detect_ai_spend_spike(
        self,
        tenant_id: str,
        lookback_days: int = 14,
        min_dollar_impact: float = 10.0,
    ) -> List[DetectedAnomaly]:
        """
        For each (provider, api_key_id) series in ai_usage_facts:
        1. Fetch daily cost_usd totals for last lookback_days from ClickHouse
        2. Calculate baseline: rolling 7-day median of the series
        3. Calculate MAD (Median Absolute Deviation) for Z-score
        4. For each day: z_score = (value - baseline) / (1.4826 * MAD)
        5. Flag as anomaly if z_score > 3.0 AND dollar delta > min_dollar_impact
        6. Apply day-of-week seasonality correction: compare only to same weekday in baseline window
        7. Return DetectedAnomaly objects only for the most recent day
        """
        rows = self.reader.get_daily_ai_spend(tenant_id, lookback_days)
        if not rows:
            return []

        # Group rows by (provider, api_key_id)
        series_map: Dict[tuple[str, str], List[Dict[str, Any]]] = {}
        for r in rows:
            key = (r["provider"], r.get("api_key_id") or "default")
            series_map.setdefault(key, []).append(r)

        anomalies: List[DetectedAnomaly] = []

        for (provider, api_key_id), history in series_map.items():
            if len(history) < 2:
                # Need at least 2 days of history to compute baseline vs actual
                continue

            # Sort chronological
            history.sort(key=lambda x: str(x["day"]))
            most_recent = history[-1]
            prior_days = history[:-1]

            actual_cost = float(most_recent["daily_cost"])
            recent_dow = most_recent["day_of_week"]

            # Day-of-week seasonality correction
            same_dow_history = [
                float(d["daily_cost"]) for d in prior_days if d["day_of_week"] == recent_dow
            ]
            all_prior_costs = [float(d["daily_cost"]) for d in prior_days[-7:]]

            if same_dow_history:
                baseline_cost = float(np.median(same_dow_history))
                ref_history = same_dow_history
            else:
                baseline_cost = float(np.median(all_prior_costs))
                ref_history = all_prior_costs

            z_score, mad = calculate_mad_zscore(actual_cost, baseline_cost, ref_history)
            dollar_delta = actual_cost - baseline_cost

            # Check detection threshold
            if (
                z_score > settings.SENTINEL_ZSCORE_THRESHOLD
                and dollar_delta > min_dollar_impact
            ):
                dev_pct = (
                    ((actual_cost - baseline_cost) / baseline_cost) * 100.0
                    if baseline_cost > 0
                    else 100.0
                )
                severity = determine_spend_severity(z_score, dollar_delta)
                series_key = f"ai:{provider}:{api_key_id}"

                anomaly = DetectedAnomaly(
                    tenant_id=str(tenant_id),
                    series_key=series_key,
                    provider=provider,
                    api_key_id=api_key_id,
                    severity=severity,
                    detection_type="spend_spike",
                    baseline_value=Decimal(str(round(baseline_cost, 6))),
                    actual_value=Decimal(str(round(actual_cost, 6))),
                    deviation_pct=Decimal(str(round(dev_pct, 4))),
                    raw_z_score=round(z_score, 4),
                    extra_data={
                        "day": str(most_recent["day"]),
                        "day_of_week": int(recent_dow),
                        "mad": round(mad, 6),
                        "dollar_delta": round(dollar_delta, 2),
                    },
                )
                anomalies.append(anomaly)

        return anomalies

    def detect_cloud_spend_spike(
        self,
        tenant_id: str,
        lookback_days: int = 14,
        min_dollar_impact: float = 50.0,
    ) -> List[DetectedAnomaly]:
        """
        Same statistical algorithm but on cost_facts grouped by (provider, service_name).
        """
        rows = self.reader.get_daily_cloud_spend(tenant_id, lookback_days)
        if not rows:
            return []

        series_map: Dict[tuple[str, str], List[Dict[str, Any]]] = {}
        for r in rows:
            key = (r["provider"], r.get("service_name") or "unknown_service")
            series_map.setdefault(key, []).append(r)

        anomalies: List[DetectedAnomaly] = []

        for (provider, service_name), history in series_map.items():
            if len(history) < 2:
                continue

            history.sort(key=lambda x: str(x["day"]))
            most_recent = history[-1]
            prior_days = history[:-1]

            actual_cost = float(most_recent["daily_cost"])
            recent_dow = most_recent["day_of_week"]

            # Day-of-week seasonality correction
            same_dow_history = [
                float(d["daily_cost"]) for d in prior_days if d["day_of_week"] == recent_dow
            ]
            all_prior_costs = [float(d["daily_cost"]) for d in prior_days[-7:]]

            if same_dow_history:
                baseline_cost = float(np.median(same_dow_history))
                ref_history = same_dow_history
            else:
                baseline_cost = float(np.median(all_prior_costs))
                ref_history = all_prior_costs

            z_score, mad = calculate_mad_zscore(actual_cost, baseline_cost, ref_history)
            dollar_delta = actual_cost - baseline_cost

            if (
                z_score > settings.SENTINEL_ZSCORE_THRESHOLD
                and dollar_delta > min_dollar_impact
            ):
                dev_pct = (
                    ((actual_cost - baseline_cost) / baseline_cost) * 100.0
                    if baseline_cost > 0
                    else 100.0
                )
                severity = determine_spend_severity(z_score, dollar_delta)
                series_key = f"cloud:{provider}:{service_name}"

                anomaly = DetectedAnomaly(
                    tenant_id=str(tenant_id),
                    series_key=series_key,
                    provider=provider,
                    api_key_id=None,
                    severity=severity,
                    detection_type="cloud_spike",
                    baseline_value=Decimal(str(round(baseline_cost, 6))),
                    actual_value=Decimal(str(round(actual_cost, 6))),
                    deviation_pct=Decimal(str(round(dev_pct, 4))),
                    raw_z_score=round(z_score, 4),
                    extra_data={
                        "service_name": service_name,
                        "day": str(most_recent["day"]),
                        "day_of_week": int(recent_dow),
                        "mad": round(mad, 6),
                        "dollar_delta": round(dollar_delta, 2),
                    },
                )
                anomalies.append(anomaly)

        return anomalies

    def detect_leaked_key(
        self,
        tenant_id: str,
    ) -> List[DetectedAnomaly]:
        """
        Flag suspicious key patterns:
        1. Key dormant for >7 days then active in last 24h
        2. Usage rate >5x the 7-day median in any 1-hour window
        3. Off-hours usage (midnight to 5am tenant timezone / UTC)
        Return DetectedAnomaly with severity='critical' and detection_type='leaked_key'
        """
        anomalies: List[DetectedAnomaly] = []
        seen_keys: set[str] = set()

        # Check 1: Dormancy check (>7 days dormant then active in last 24h)
        dormant_rows = self.reader.get_key_dormancy_stats(tenant_id, dormancy_days=7)
        for r in dormant_rows:
            provider = r["provider"]
            api_key_id = r["api_key_id"]
            series_key = f"leak:{provider}:{api_key_id}"
            days_dormant = r.get("days_dormant", 8)
            reqs = r.get("reqs_last_24h", 0)
            cost = float(r.get("cost_last_24h", 0.0))

            seen_keys.add(series_key)
            anomalies.append(
                DetectedAnomaly(
                    tenant_id=str(tenant_id),
                    series_key=series_key,
                    provider=provider,
                    api_key_id=api_key_id,
                    severity="critical",
                    detection_type="leaked_key",
                    baseline_value=Decimal("0.000000"),
                    actual_value=Decimal(str(round(cost, 6))),
                    deviation_pct=Decimal("100.0000"),
                    raw_z_score=5.0,
                    extra_data={
                        "reason": "dormant_reactivation",
                        "days_dormant": int(days_dormant),
                        "requests_last_24h": int(reqs),
                        "cost_last_24h": round(cost, 2),
                    },
                )
            )

        # Check 2: Hourly usage rate >5x 7-day median
        hourly_rows = self.reader.get_hourly_key_usage(tenant_id, lookback_days=7)
        if hourly_rows:
            key_hourly: Dict[tuple[str, str], List[Dict[str, Any]]] = {}
            for r in hourly_rows:
                key_hourly.setdefault((r["provider"], r["api_key_id"]), []).append(r)

            for (provider, api_key_id), buckets in key_hourly.items():
                series_key = f"leak:{provider}:{api_key_id}"
                if series_key in seen_keys:
                    continue
                if len(buckets) < 3:
                    continue

                # Separate historical buckets from recent hour
                buckets.sort(key=lambda b: str(b["hour_bucket"]))
                recent_bucket = buckets[-1]
                prior_buckets = buckets[:-1]

                recent_reqs = float(recent_bucket["hourly_requests"])
                recent_cost = float(recent_bucket["hourly_cost"])

                hist_reqs = [float(b["hourly_requests"]) for b in prior_buckets]
                median_reqs = float(np.median(hist_reqs))

                if median_reqs > 0:
                    ratio = recent_reqs / median_reqs
                elif recent_reqs >= 50:
                    ratio = 5.0
                else:
                    ratio = 1.0

                if ratio >= 5.0 and recent_reqs >= 20:
                    dev_pct = round((ratio - 1.0) * 100.0, 2)
                    seen_keys.add(series_key)
                    anomalies.append(
                        DetectedAnomaly(
                            tenant_id=str(tenant_id),
                            series_key=series_key,
                            provider=provider,
                            api_key_id=api_key_id,
                            severity="critical",
                            detection_type="leaked_key",
                            baseline_value=Decimal(str(round(median_reqs, 6))),
                            actual_value=Decimal(str(round(recent_reqs, 6))),
                            deviation_pct=Decimal(str(dev_pct)),
                            raw_z_score=round(float(ratio), 2),
                            extra_data={
                                "reason": "hourly_surge",
                                "ratio": round(ratio, 1),
                                "hourly_requests": int(recent_reqs),
                                "median_hourly_requests": round(median_reqs, 1),
                                "hourly_cost": round(recent_cost, 2),
                            },
                        )
                    )

        # Check 3: Off-hours usage (midnight to 5am UTC)
        off_hour_rows = self.reader.get_off_hours_key_usage(tenant_id, start_hour=0, end_hour=5)
        for r in off_hour_rows:
            provider = r["provider"]
            api_key_id = r["api_key_id"]
            series_key = f"leak:{provider}:{api_key_id}"
            if series_key in seen_keys:
                continue

            reqs = int(r["off_hour_requests"])
            cost = float(r["off_hour_cost"])
            # Threshold to prevent flagging single occasional scheduled crons
            if reqs >= 20 or cost >= 5.0:
                seen_keys.add(series_key)
                anomalies.append(
                    DetectedAnomaly(
                        tenant_id=str(tenant_id),
                        series_key=series_key,
                        provider=provider,
                        api_key_id=api_key_id,
                        severity="critical",
                        detection_type="leaked_key",
                        baseline_value=Decimal("0.000000"),
                        actual_value=Decimal(str(round(cost, 6))),
                        deviation_pct=Decimal("100.0000"),
                        raw_z_score=5.0,
                        extra_data={
                            "reason": "off_hours_activity",
                            "off_hour_requests": reqs,
                            "off_hour_cost": round(cost, 2),
                            "min_hour": r["min_off_hour"],
                            "max_hour": r["max_off_hour"],
                        },
                    )
                )

        return anomalies
