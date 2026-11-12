from datetime import datetime
from app.detector import DetectedAnomaly

DAYS_MAP = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
    7: "Sunday",
}


def explain_anomaly(anomaly: DetectedAnomaly) -> str:
    """
    Generate deterministic, plain-English explanation for a detected anomaly.
    NEVER makes any LLM or external API calls.
    """
    actual = float(anomaly.actual_value)
    baseline = float(anomaly.baseline_value)
    dev_pct = float(anomaly.deviation_pct)
    extra_spend = max(0.0, actual - baseline)

    # Determine day name
    dow_num = anomaly.extra_data.get("day_of_week")
    if dow_num and dow_num in DAYS_MAP:
        day_name = DAYS_MAP[dow_num]
    else:
        day_name = datetime.now().strftime("%A")

    if anomaly.detection_type == "spend_spike":
        key_name = anomaly.api_key_id or "default key"
        return (
            f"{anomaly.provider} key {key_name} spent ${actual:,.2f} today, "
            f"which is {dev_pct:,.0f}% above its 7-day baseline of ${baseline:,.2f}. "
            f"This is unusually high for a {day_name}. "
            f"Estimated extra spend so far: ${extra_spend:,.2f}."
        )

    elif anomaly.detection_type == "cloud_spike":
        service_name = anomaly.extra_data.get("service_name") or anomaly.series_key.replace("cloud:", "")
        return (
            f"{anomaly.provider} service {service_name} spent ${actual:,.2f} today, "
            f"which is {dev_pct:,.0f}% above its 7-day baseline of ${baseline:,.2f}. "
            f"This is unusually high for a {day_name}. "
            f"Estimated extra spend so far: ${extra_spend:,.2f}."
        )

    elif anomaly.detection_type == "leaked_key":
        key_name = anomaly.api_key_id or "unknown key"
        reason = anomaly.extra_data.get("reason", "")

        if reason == "dormant_reactivation":
            days = anomaly.extra_data.get("days_dormant", 7)
            reqs = anomaly.extra_data.get("requests_last_24h", 0)
            cost = anomaly.extra_data.get("cost_last_24h", actual)
            return (
                f"API key {key_name} was dormant for {days} days and suddenly "
                f"made {reqs:,} requests in the last 24 hours (spend: ${cost:,.2f}). "
                f"Potential unauthorized access."
            )

        elif reason == "hourly_surge":
            ratio = anomaly.extra_data.get("ratio", anomaly.raw_z_score)
            reqs = anomaly.extra_data.get("hourly_requests", int(actual))
            med = anomaly.extra_data.get("median_hourly_requests", baseline)
            return (
                f"API key {key_name} made {reqs:,} requests in the last hour, "
                f"which is {ratio:.1f}x its historical 7-day median hourly rate ({med:.0f} reqs/hr). "
                f"Potential unauthorized access or rogue automated loop."
            )

        elif reason == "off_hours_activity":
            reqs = anomaly.extra_data.get("off_hour_requests", 0)
            cost = anomaly.extra_data.get("off_hour_cost", actual)
            min_h = anomaly.extra_data.get("min_hour", 0)
            max_h = anomaly.extra_data.get("max_hour", 5)
            return (
                f"API key {key_name} recorded {reqs:,} requests during off-hours "
                f"between {min_h:02d}:00 and {max_h:02d}:00 UTC (spend: ${cost:,.2f}). "
                f"Potential unauthorized access."
            )

        return (
            f"API key {key_name} on {anomaly.provider} exhibited critical suspicious activity: "
            f"actual activity was {dev_pct:,.0f}% higher than baseline. "
            f"Potential unauthorized access."
        )

    # Fallback
    return (
        f"Anomaly detected in {anomaly.series_key}: actual value ${actual:,.2f} "
        f"exceeded baseline ${baseline:,.2f} by {dev_pct:,.0f}%."
    )
