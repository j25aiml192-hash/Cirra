import pytest
from decimal import Decimal
from datetime import date, datetime, timedelta
from unittest.mock import MagicMock

from app.detector import AnomalyDetector, DetectedAnomaly, calculate_mad_zscore
from app.explainer import explain_anomaly


class MockClickHouseReader:
    def __init__(self):
        self.ai_spend_rows = []
        self.cloud_spend_rows = []
        self.dormant_rows = []
        self.hourly_rows = []
        self.off_hour_rows = []

    def get_daily_ai_spend(self, tenant_id: str, lookback_days: int = 14):
        return self.ai_spend_rows

    def get_daily_cloud_spend(self, tenant_id: str, lookback_days: int = 14):
        return self.cloud_spend_rows

    def get_key_dormancy_stats(self, tenant_id: str, dormancy_days: int = 7):
        return self.dormant_rows

    def get_hourly_key_usage(self, tenant_id: str, lookback_days: int = 7):
        return self.hourly_rows

    def get_off_hours_key_usage(self, tenant_id: str, start_hour: int = 0, end_hour: int = 5):
        return self.off_hour_rows


def test_mad_zscore_calculation():
    # Regular series with median 50, mad ~ 5
    history = [48.0, 50.0, 52.0, 49.0, 51.0, 50.0, 50.0]
    actual = 120.0
    baseline = 50.0
    z_score, mad = calculate_mad_zscore(actual, baseline, history)
    assert z_score > 3.0
    assert mad > 0


def test_ai_spend_spike_detection():
    mock_reader = MockClickHouseReader()
    detector = AnomalyDetector(reader=mock_reader)

    # 14 days of data: 13 days around $50, 14th day spikes to $250
    rows = []
    base_date = date(2026, 11, 1)
    for i in range(13):
        day_date = base_date + timedelta(days=i)
        dow = (day_date.weekday() + 1)
        rows.append({
            "provider": "OpenAI",
            "api_key_id": "key_prod_app_01",
            "day": day_date,
            "day_of_week": dow,
            "daily_cost": Decimal("50.00"),
            "request_count": 500,
        })
    # Day 14 (Spike)
    spike_date = base_date + timedelta(days=13)
    rows.append({
        "provider": "OpenAI",
        "api_key_id": "key_prod_app_01",
        "day": spike_date,
        "day_of_week": (spike_date.weekday() + 1),
        "daily_cost": Decimal("250.00"),
        "request_count": 2500,
    })

    mock_reader.ai_spend_rows = rows
    anomalies = detector.detect_ai_spend_spike(
        tenant_id="00000000-0000-0000-0000-000000000001",
        lookback_days=14,
        min_dollar_impact=10.0,
    )

    assert len(anomalies) == 1
    a = anomalies[0]
    assert a.provider == "OpenAI"
    assert a.api_key_id == "key_prod_app_01"
    assert a.detection_type == "spend_spike"
    assert float(a.actual_value) == 250.0
    assert float(a.baseline_value) == 50.0
    assert a.raw_z_score > 3.0
    assert a.severity in ("high", "critical")

    # Test explanation
    expl = explain_anomaly(a)
    assert "OpenAI key key_prod_app_01" in expl
    assert "$250.00" in expl
    assert "$50.00" in expl
    assert "Estimated extra spend so far: $200.00" in expl


def test_ai_spend_spike_below_threshold():
    mock_reader = MockClickHouseReader()
    detector = AnomalyDetector(reader=mock_reader)

    # Spike with delta $5.0 (below min_dollar_impact of $10.0)
    rows = []
    base_date = date(2026, 11, 1)
    for i in range(13):
        day_date = base_date + timedelta(days=i)
        rows.append({
            "provider": "OpenAI",
            "api_key_id": "key_small_01",
            "day": day_date,
            "day_of_week": (day_date.weekday() + 1),
            "daily_cost": Decimal("2.00"),
            "request_count": 20,
        })
    spike_date = base_date + timedelta(days=13)
    rows.append({
        "provider": "OpenAI",
        "api_key_id": "key_small_01",
        "day": spike_date,
        "day_of_week": (spike_date.weekday() + 1),
        "daily_cost": Decimal("7.00"),  # Delta is $5.00
        "request_count": 70,
    })

    mock_reader.ai_spend_rows = rows
    anomalies = detector.detect_ai_spend_spike(
        tenant_id="00000000-0000-0000-0000-000000000001",
        min_dollar_impact=10.0,
    )
    assert len(anomalies) == 0


def test_cloud_spend_spike_detection():
    mock_reader = MockClickHouseReader()
    detector = AnomalyDetector(reader=mock_reader)

    rows = []
    base_date = date(2026, 11, 1)
    for i in range(13):
        day_date = base_date + timedelta(days=i)
        rows.append({
            "provider": "AWS",
            "service_name": "Amazon Elastic Compute Cloud - Compute",
            "day": day_date,
            "day_of_week": (day_date.weekday() + 1),
            "daily_cost": Decimal("30.00"),
        })
    spike_date = base_date + timedelta(days=13)
    rows.append({
        "provider": "AWS",
        "service_name": "Amazon Elastic Compute Cloud - Compute",
        "day": spike_date,
        "day_of_week": (spike_date.weekday() + 1),
        "daily_cost": Decimal("180.00"),  # Delta $150
    })

    mock_reader.cloud_spend_rows = rows
    anomalies = detector.detect_cloud_spend_spike(
        tenant_id="00000000-0000-0000-0000-000000000001",
        min_dollar_impact=50.0,
    )

    assert len(anomalies) == 1
    a = anomalies[0]
    assert a.detection_type == "cloud_spike"
    assert a.provider == "AWS"
    assert float(a.actual_value) == 180.0
    assert float(a.baseline_value) == 30.0

    expl = explain_anomaly(a)
    assert "Amazon Elastic Compute Cloud - Compute" in expl
    assert "$180.00" in expl
    assert "$30.00" in expl


def test_leaked_key_dormancy():
    mock_reader = MockClickHouseReader()
    detector = AnomalyDetector(reader=mock_reader)

    mock_reader.dormant_rows = [
        {
            "provider": "Groq",
            "api_key_id": "gsk_test_123",
            "days_dormant": 9,
            "reqs_last_24h": 1247,
            "cost_last_24h": Decimal("42.50"),
        }
    ]

    anomalies = detector.detect_leaked_key("00000000-0000-0000-0000-000000000001")
    assert len(anomalies) == 1
    a = anomalies[0]
    assert a.detection_type == "leaked_key"
    assert a.severity == "critical"
    assert a.api_key_id == "gsk_test_123"

    expl = explain_anomaly(a)
    assert "was dormant for 9 days" in expl
    assert "1,247 requests" in expl
    assert "Potential unauthorized access" in expl


def test_leaked_key_hourly_surge():
    mock_reader = MockClickHouseReader()
    detector = AnomalyDetector(reader=mock_reader)

    # 10 buckets of ~20 reqs, latest bucket 200 reqs (10x)
    buckets = []
    base_time = datetime(2026, 11, 12, 10, 0, 0)
    for i in range(10):
        buckets.append({
            "provider": "Anthropic",
            "api_key_id": "sk-ant-batch-99",
            "hour_bucket": base_time + timedelta(hours=i),
            "hourly_requests": 20,
            "hourly_cost": Decimal("1.00"),
        })
    buckets.append({
        "provider": "Anthropic",
        "api_key_id": "sk-ant-batch-99",
        "hour_bucket": base_time + timedelta(hours=10),
        "hourly_requests": 200,
        "hourly_cost": Decimal("10.00"),
    })

    mock_reader.hourly_rows = buckets
    anomalies = detector.detect_leaked_key("00000000-0000-0000-0000-000000000001")
    assert len(anomalies) == 1
    a = anomalies[0]
    assert a.detection_type == "leaked_key"
    assert a.severity == "critical"

    expl = explain_anomaly(a)
    assert "sk-ant-batch-99" in expl
    assert "requests in the last hour" in expl
    assert "historical 7-day median hourly rate" in expl


def test_leaked_key_off_hours():
    mock_reader = MockClickHouseReader()
    detector = AnomalyDetector(reader=mock_reader)

    mock_reader.off_hour_rows = [
        {
            "provider": "OpenAI",
            "api_key_id": "key_midnight_runner",
            "off_hour_requests": 350,
            "off_hour_cost": Decimal("18.40"),
            "min_off_hour": 1,
            "max_off_hour": 4,
        }
    ]

    anomalies = detector.detect_leaked_key("00000000-0000-0000-0000-000000000001")
    assert len(anomalies) == 1
    a = anomalies[0]
    assert a.detection_type == "leaked_key"
    assert a.severity == "critical"

    expl = explain_anomaly(a)
    assert "between 01:00 and 04:00 UTC" in expl
    assert "$18.40" in expl
