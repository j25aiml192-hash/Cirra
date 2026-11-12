import uuid
import zoneinfo
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, AsyncMock
import pytest
from httpx import AsyncClient, Response

from app.services.settings_service import is_in_quiet_hours, is_within_cooldown
from app.core.security import create_cirra_token


@pytest.mark.asyncio
async def test_get_settings_defaults(client: AsyncClient):
    """GET /api/v1/settings returns defaults if tenant settings have not yet been configured."""
    fresh_tenant_id = str(uuid.uuid4())
    fresh_user_id = str(uuid.uuid4())
    token = create_cirra_token(tenant_id=fresh_tenant_id, user_id=fresh_user_id, role="admin")

    res = await client.get(
        "/api/v1/settings",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["voice_calls_enabled"] is True
    assert data["slack_enabled"] is True
    assert data["min_severity_voice"] == "critical"
    assert data["min_severity_slack"] == "medium"
    assert data["anomaly_cooldown_minutes"] == 60
    assert data["quiet_hours_tz"] == "Asia/Kolkata"


@pytest.mark.asyncio
async def test_update_settings_validation_bad_phone(client: AsyncClient, token_tenant_a_admin):
    """PATCH /api/v1/settings rejects phone numbers that do not adhere to E.164 format."""
    # Invalid without +
    res1 = await client.patch(
        "/api/v1/settings",
        json={"alert_phone": "9876543210"},
        headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
    )
    assert res1.status_code == 400
    assert "E.164" in res1.json()["error"]["message"]

    # Invalid characters
    res2 = await client.patch(
        "/api/v1/settings",
        json={"alert_phone": "+123-abc-7890"},
        headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
    )
    assert res2.status_code == 400
    assert "E.164" in res2.json()["error"]["message"]


@pytest.mark.asyncio
async def test_update_settings_validation_quiet_hours(client: AsyncClient, token_tenant_a_admin):
    """PATCH /api/v1/settings rejects quiet hours out of bounds or missing one of the pair."""
    # Out of 0-23 bounds
    res1 = await client.patch(
        "/api/v1/settings",
        json={"quiet_hours_start": 25, "quiet_hours_end": 7},
        headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
    )
    assert res1.status_code == 400

    # Only one provided
    res2 = await client.patch(
        "/api/v1/settings",
        json={"quiet_hours_start": 22},
        headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
    )
    assert res2.status_code == 400
    assert "both be provided" in res2.json()["error"]["message"]


@pytest.mark.asyncio
async def test_update_settings_validation_cooldown_and_severity(client: AsyncClient, token_tenant_a_admin):
    """PATCH /api/v1/settings validates anomaly cooldown (15-1440m) and severity levels."""
    # Cooldown too low (< 15)
    res_low = await client.patch(
        "/api/v1/settings",
        json={"anomaly_cooldown_minutes": 5},
        headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
    )
    assert res_low.status_code == 400
    assert "between 15 and 1440" in res_low.json()["error"]["message"]

    # Cooldown too high (> 1440)
    res_high = await client.patch(
        "/api/v1/settings",
        json={"anomaly_cooldown_minutes": 2000},
        headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
    )
    assert res_high.status_code == 400
    assert "between 15 and 1440" in res_high.json()["error"]["message"]

    # Invalid severity
    res_sev = await client.patch(
        "/api/v1/settings",
        json={"min_severity_voice": "extreme"},
        headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
    )
    assert res_sev.status_code == 400
    assert "Must be one of: low, medium, high, critical" in res_sev.json()["error"]["message"]


@pytest.mark.asyncio
async def test_update_settings_valid_and_masking(client: AsyncClient, token_tenant_a_admin):
    """Valid settings update succeeds and masks webhook URLs in response."""
    long_slack_webhook = "https://hooks.slack.com/services/T12345678/B12345678/SECRETKEY1234567890ABCDEF"

    res = await client.patch(
        "/api/v1/settings",
        json={
            "alert_phone": "+918910095002",
            "slack_webhook_url": long_slack_webhook,
            "quiet_hours_start": 23,
            "quiet_hours_end": 7,
            "quiet_hours_tz": "Asia/Kolkata",
            "anomaly_cooldown_minutes": 45,
            "min_severity_voice": "critical",
            "min_severity_slack": "high",
        },
        headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["alert_phone"] == "+918910095002"
    assert data["quiet_hours_start"] == 23
    assert data["quiet_hours_end"] == 7
    assert data["anomaly_cooldown_minutes"] == 45
    assert data["min_severity_slack"] == "high"

    # Webhook URL must be masked (first 20 chars + ...)
    assert data["slack_webhook_url"] == long_slack_webhook[:20] + "..."


def test_quiet_hours_logic():
    """Verify quiet hours check blocks calls during quiet hours and allows outside."""
    tz = zoneinfo.ZoneInfo("Asia/Kolkata")

    # 1. Midnight wrap-around: 23:00 to 07:00
    dt_in_night = datetime(2026, 11, 13, 23, 30, tzinfo=tz)
    dt_in_early_morning = datetime(2026, 11, 14, 4, 15, tzinfo=tz)
    dt_daytime = datetime(2026, 11, 13, 14, 0, tzinfo=tz)

    assert is_in_quiet_hours(23, 7, "Asia/Kolkata", now_dt=dt_in_night) is True
    assert is_in_quiet_hours(23, 7, "Asia/Kolkata", now_dt=dt_in_early_morning) is True
    assert is_in_quiet_hours(23, 7, "Asia/Kolkata", now_dt=dt_daytime) is False

    # 2. Same-day quiet hours: 01:00 to 05:00
    dt_in_span = datetime(2026, 11, 13, 3, 0, tzinfo=tz)
    dt_out_span = datetime(2026, 11, 13, 6, 0, tzinfo=tz)

    assert is_in_quiet_hours(1, 5, "Asia/Kolkata", now_dt=dt_in_span) is True
    assert is_in_quiet_hours(1, 5, "Asia/Kolkata", now_dt=dt_out_span) is False

    # 3. Quiet hours not configured
    assert is_in_quiet_hours(None, None, now_dt=dt_in_night) is False


def test_cooldown_logic():
    """Verify cooldown logic blocks duplicate alerts within window and allows after."""
    now = datetime(2026, 11, 13, 12, 0, tzinfo=timezone.utc)

    # 20 minutes ago with 60-minute cooldown -> within cooldown (block)
    recent_alert = now - timedelta(minutes=20)
    assert is_within_cooldown(recent_alert, cooldown_minutes=60, now_dt=now) is True

    # 80 minutes ago with 60-minute cooldown -> expired (allow)
    old_alert = now - timedelta(minutes=80)
    assert is_within_cooldown(old_alert, cooldown_minutes=60, now_dt=now) is False

    # No previous alert -> allow
    assert is_within_cooldown(None, cooldown_minutes=60, now_dt=now) is False


@pytest.mark.asyncio
async def test_settings_test_endpoints(client: AsyncClient, token_tenant_a_admin):
    """Verify test slack, ntfy, and voice call endpoints."""
    # Configure webhook URLs first
    await client.patch(
        "/api/v1/settings",
        json={
            "slack_webhook_url": "https://hooks.slack.com/services/MOCK/TEST/CHANNEL",
            "ntfy_topic_url": "https://ntfy.sh/cirra-mock-topic",
        },
        headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
    )

    mock_http_client = AsyncMock()
    mock_http_client.__aenter__.return_value = mock_http_client
    mock_http_client.__aexit__.return_value = None
    mock_http_client.post.return_value = Response(status_code=200, text="ok")

    with patch("app.services.settings_service.httpx.AsyncClient", return_value=mock_http_client):
        # Test Slack
        res_slack = await client.post(
            "/api/v1/settings/test/slack",
            headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
        )
        assert res_slack.status_code == 200
        assert res_slack.json()["success"] is True

        # Test ntfy
        res_ntfy = await client.post(
            "/api/v1/settings/test/ntfy",
            headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
        )
        assert res_ntfy.status_code == 200
        assert res_ntfy.json()["success"] is True

    # Test Voice Call trigger
    res_call = await client.post(
        "/api/v1/settings/test/call",
        headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
    )
    assert res_call.status_code == 200
    call_data = res_call.json()
    assert "voice_call_id" in call_data
    assert "status" in call_data
    assert call_data["status"] in ("initiated", "ringing", "in-progress")
