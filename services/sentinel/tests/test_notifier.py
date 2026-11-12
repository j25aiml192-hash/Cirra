import asyncio
import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, patch, MagicMock
import httpx

from app.detector import DetectedAnomaly
from app.notifier import AlertNotifier, NotifyResult
from app.alerts import dispatch_alert


@pytest.fixture
def fake_anomaly():
    return DetectedAnomaly(
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


@pytest.fixture
def fake_low_anomaly():
    return DetectedAnomaly(
        tenant_id="00000000-0000-0000-0000-000000000001",
        series_key="openai:mock_key_sk_prod_001:daily_cost",
        provider="openai",
        api_key_id="mock_key_sk_prod_001",
        severity="low",
        detection_type="spend_spike",
        baseline_value=Decimal("10.00"),
        actual_value=Decimal("12.00"),
        deviation_pct=Decimal("20.00"),
        raw_z_score=1.2,
        extra_data={},
    )


def test_notifier_simulation_mode(fake_anomaly):
    async def _run():
        notifier = AlertNotifier()
        with patch("app.notifier.settings") as mock_settings:
            mock_settings.slack_webhook_url = None
            mock_settings.ntfy_topic_url = "https://ntfy.sh/cirra-alerts-test"
            mock_settings.vapi_api_key = None
            mock_settings.cirra_dashboard_url = "http://localhost:3000"

            # Slack should simulate because URL is None
            slack_ok = await notifier.send_slack(fake_anomaly, "Spike detected", "test-id")
            assert slack_ok is True
            assert notifier.last_status_codes["slack"] == 200

            # Vapi should simulate because api_key is None
            vapi_ok = await notifier.trigger_vapi_call(fake_anomaly, "Spike detected", "test-id")
            assert vapi_ok is True
            assert notifier.last_status_codes["vapi"] == 201

    asyncio.run(_run())


def test_vapi_skips_low_severity(fake_low_anomaly):
    async def _run():
        notifier = AlertNotifier()
        vapi_ok = await notifier.trigger_vapi_call(fake_low_anomaly, "Small spend", "test-id")
        assert vapi_ok is False
        assert notifier.last_status_codes["vapi"] is None

    asyncio.run(_run())


def test_notifier_mock_http_success(fake_anomaly):
    async def _run():
        notifier = AlertNotifier()

        mock_resp_200 = MagicMock()
        mock_resp_200.status_code = 200
        mock_resp_200.text = "ok"

        mock_resp_201 = MagicMock()
        mock_resp_201.status_code = 201
        mock_resp_201.text = '{"id": "call-123"}'

        with patch("app.notifier.settings") as mock_settings:
            mock_settings.slack_webhook_url = "https://hooks.slack.com/services/real/test/hook"
            mock_settings.ntfy_topic_url = "https://ntfy.sh/cirra-test"
            mock_settings.vapi_api_key = "vapi-key-real-123"
            mock_settings.vapi_assistant_id = "asst-123"
            mock_settings.vapi_alert_phone_number = "+15551234567"
            mock_settings.cirra_dashboard_url = "http://localhost:3000"

            with patch("httpx.AsyncClient.post") as mock_post:
                async def side_effect(url, *args, **kwargs):
                    if "slack" in str(url) or "ntfy" in str(url):
                        return mock_resp_200
                    elif "vapi" in str(url):
                        return mock_resp_201
                    return mock_resp_200

                mock_post.side_effect = side_effect

                result = await notifier.notify_all(fake_anomaly, "Big spike", "db-123")
                assert isinstance(result, NotifyResult)
                assert result.slack_delivered is True
                assert result.ntfy_delivered is True
                assert result.vapi_triggered is True
                assert result.anomaly_id == "db-123"

    asyncio.run(_run())


def test_notifier_partial_failure_tolerance(fake_anomaly):
    """If Slack fails, ntfy and vapi still succeed (independent channels)."""
    async def _run():
        notifier = AlertNotifier()

        mock_resp_500 = MagicMock()
        mock_resp_500.status_code = 500
        mock_resp_500.text = "internal error"

        mock_resp_200 = MagicMock()
        mock_resp_200.status_code = 200
        mock_resp_200.text = "ok"

        mock_resp_201 = MagicMock()
        mock_resp_201.status_code = 201
        mock_resp_201.text = '{"id": "call-123"}'

        with patch("app.notifier.settings") as mock_settings:
            mock_settings.slack_webhook_url = "https://hooks.slack.com/services/real/test/hook"
            mock_settings.ntfy_topic_url = "https://ntfy.sh/cirra-test"
            mock_settings.vapi_api_key = "vapi-key-real-123"
            mock_settings.vapi_assistant_id = "asst-123"
            mock_settings.vapi_alert_phone_number = "+15551234567"
            mock_settings.cirra_dashboard_url = "http://localhost:3000"

            with patch("httpx.AsyncClient.post") as mock_post:
                async def side_effect(url, *args, **kwargs):
                    if "slack" in str(url):
                        return mock_resp_500
                    elif "ntfy" in str(url):
                        return mock_resp_200
                    elif "vapi" in str(url):
                        return mock_resp_201
                    return mock_resp_200

                mock_post.side_effect = side_effect

                result = await notifier.notify_all(fake_anomaly, "Big spike", "db-123")
                assert result.slack_delivered is False
                assert result.ntfy_delivered is True
                assert result.vapi_triggered is True

    asyncio.run(_run())


def test_dispatch_alert_handles_db_and_action_engine(fake_anomaly):
    """dispatch_alert coordinates notifier, db update, action engine without throwing."""
    async def _run():
        mock_conn = AsyncMock()
        mock_pool = MagicMock()
        mock_pool.acquire.return_value.__aenter__.return_value = mock_conn

        with patch("app.alerts.get_db_pool", return_value=mock_pool), \
             patch("app.alerts.AlertNotifier") as MockNotifier, \
             patch("app.alerts.propose_action_to_engine", return_value=True) as mock_propose:

            instance = MockNotifier.return_value
            instance.notify_all = AsyncMock(
                return_value=NotifyResult(
                    slack_delivered=True,
                    ntfy_delivered=True,
                    vapi_triggered=True,
                    anomaly_id="00000000-0000-0000-0000-000000000001",
                )
            )

            # Should execute without errors
            await dispatch_alert(
                anomaly=fake_anomaly,
                explanation="Test explanation",
                anomaly_db_id="00000000-0000-0000-0000-000000000001",
            )

            assert instance.notify_all.called
            assert mock_conn.execute.called
            assert mock_propose.called

    asyncio.run(_run())
