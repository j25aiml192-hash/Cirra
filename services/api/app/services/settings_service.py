import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx

from app.services.connections_service import _resolve_conn

logger = logging.getLogger("cirra.api.settings_service")

DEFAULT_SETTINGS: Dict[str, Any] = {
    "alert_phone": None,
    "slack_webhook_url": None,
    "ntfy_topic_url": None,
    "spend_cap_usd": None,
    "quiet_hours_start": None,
    "quiet_hours_end": None,
    "quiet_hours_tz": "Asia/Kolkata",
    "voice_calls_enabled": True,
    "slack_enabled": True,
    "ntfy_enabled": True,
    "email_enabled": False,
    "alert_email": None,
    "min_severity_voice": "critical",
    "min_severity_slack": "medium",
    "anomaly_cooldown_minutes": 60,
}


def mask_webhook_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return url
    if len(url) <= 20:
        return url
    return url[:20] + "..."


def is_in_quiet_hours(
    quiet_hours_start: Optional[int],
    quiet_hours_end: Optional[int],
    quiet_hours_tz: Optional[str] = "Asia/Kolkata",
    now_dt: Optional[datetime] = None,
) -> bool:
    """Check whether the given time falls within the quiet hours range."""
    if quiet_hours_start is None or quiet_hours_end is None:
        return False

    try:
        import zoneinfo
        tz = zoneinfo.ZoneInfo(quiet_hours_tz or "Asia/Kolkata")
    except Exception:
        import zoneinfo
        tz = zoneinfo.ZoneInfo("UTC")

    curr = now_dt.astimezone(tz) if now_dt else datetime.now(tz)
    curr_hour = curr.hour

    if quiet_hours_start <= quiet_hours_end:
        return quiet_hours_start <= curr_hour <= quiet_hours_end
    else:
        return curr_hour >= quiet_hours_start or curr_hour <= quiet_hours_end


def is_within_cooldown(
    last_alert_at: Optional[datetime],
    cooldown_minutes: int,
    now_dt: Optional[datetime] = None,
) -> bool:
    """Check whether the time elapsed since last_alert_at is within cooldown_minutes."""
    if not last_alert_at:
        return False
    from datetime import timedelta
    now = now_dt or datetime.now(timezone.utc)
    if last_alert_at.tzinfo is None:
        last_alert_at = last_alert_at.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    return (now - last_alert_at) < timedelta(minutes=cooldown_minutes)


def _format_settings_dict(d: Dict[str, Any], mask_urls: bool = True) -> Dict[str, Any]:
    res = dict(d)
    if "tenant_id" in res:
        res["tenant_id"] = str(res["tenant_id"])
    if "id" in res:
        res["id"] = str(res["id"])
    if res.get("spend_cap_usd") is not None:
        try:
            res["spend_cap_usd"] = float(res["spend_cap_usd"])
        except (ValueError, TypeError):
            pass

    for dt_field in ("created_at", "updated_at"):
        val = res.get(dt_field)
        if isinstance(val, datetime):
            res[dt_field] = val.isoformat()

    if mask_urls:
        if res.get("slack_webhook_url"):
            res["slack_webhook_url"] = mask_webhook_url(res["slack_webhook_url"])
        if res.get("ntfy_topic_url"):
            res["ntfy_topic_url"] = mask_webhook_url(res["ntfy_topic_url"])

    return res


class SettingsService:
    async def get_settings(self, tenant_id: str, conn: Any, mask_urls: bool = True) -> Dict[str, Any]:
        """
        SELECT from tenant_settings. If not found, return defaults.
        Mask webhook URLs (first 20 chars + '...').
        """
        c = await _resolve_conn(conn)
        row = await c.fetchrow(
            """
            SELECT id, tenant_id, alert_phone, slack_webhook_url, ntfy_topic_url,
                   spend_cap_usd, quiet_hours_start, quiet_hours_end, quiet_hours_tz,
                   voice_calls_enabled, slack_enabled, ntfy_enabled, email_enabled,
                   alert_email, min_severity_voice, min_severity_slack,
                   anomaly_cooldown_minutes, created_at, updated_at
            FROM tenant_settings
            WHERE tenant_id = $1::uuid
            """,
            uuid.UUID(str(tenant_id)),
        )

        if not row:
            data = dict(DEFAULT_SETTINGS)
            data["tenant_id"] = str(tenant_id)
            data["id"] = None
            data["created_at"] = None
            data["updated_at"] = None
            return _format_settings_dict(data, mask_urls=mask_urls)

        return _format_settings_dict(dict(row), mask_urls=mask_urls)

    async def update_settings(self, tenant_id: str, updates: Dict[str, Any], conn: Any) -> Dict[str, Any]:
        """
        Validate:
          - alert_phone (E.164 if set)
          - quiet_hours (0-23, both together)
          - min_severity in ('low','medium','high','critical')
          - anomaly_cooldown_minutes (15-1440)
        UPSERT INTO tenant_settings.
        Return updated settings dict.
        """
        c = await _resolve_conn(conn)
        tenant_uuid = uuid.UUID(str(tenant_id))

        # 1. Validation
        if "alert_phone" in updates and updates["alert_phone"] is not None:
            phone = str(updates["alert_phone"]).strip()
            if phone and not re.match(r"^\+[1-9]\d{1,14}$", phone):
                raise ValueError(
                    f"Invalid alert_phone '{phone}'. Must be in E.164 format (e.g. +1234567890)."
                )

        # Quiet hours: must be 0-23 and provided together if set
        start = updates.get("quiet_hours_start")
        end = updates.get("quiet_hours_end")
        if start is not None or end is not None:
            if start is None or end is None:
                raise ValueError("quiet_hours_start and quiet_hours_end must both be provided together.")
            if not isinstance(start, int) or not (0 <= start <= 23):
                raise ValueError(f"quiet_hours_start must be an integer between 0 and 23 (received {start}).")
            if not isinstance(end, int) or not (0 <= end <= 23):
                raise ValueError(f"quiet_hours_end must be an integer between 0 and 23 (received {end}).")

        valid_severities = {"low", "medium", "high", "critical"}
        if "min_severity_voice" in updates and updates["min_severity_voice"] is not None:
            if str(updates["min_severity_voice"]).lower() not in valid_severities:
                raise ValueError(
                    f"Invalid min_severity_voice '{updates['min_severity_voice']}'. "
                    f"Must be one of: low, medium, high, critical."
                )

        if "min_severity_slack" in updates and updates["min_severity_slack"] is not None:
            if str(updates["min_severity_slack"]).lower() not in valid_severities:
                raise ValueError(
                    f"Invalid min_severity_slack '{updates['min_severity_slack']}'. "
                    f"Must be one of: low, medium, high, critical."
                )

        if "anomaly_cooldown_minutes" in updates and updates["anomaly_cooldown_minutes"] is not None:
            cd = updates["anomaly_cooldown_minutes"]
            if not isinstance(cd, int) or not (15 <= cd <= 1440):
                raise ValueError(
                    f"anomaly_cooldown_minutes must be an integer between 15 and 1440 (received {cd})."
                )

        if "spend_cap_usd" in updates and updates["spend_cap_usd"] is not None:
            val = float(updates["spend_cap_usd"])
            if val < 0:
                raise ValueError("spend_cap_usd must be >= 0.")

        # 2. Fetch existing settings (or defaults) to merge
        existing = await self.get_settings(str(tenant_id), c, mask_urls=False)
        merged = {**existing, **updates}

        # 3. UPSERT INTO tenant_settings
        row = await c.fetchrow(
            """
            INSERT INTO tenant_settings (
                id, tenant_id, alert_phone, slack_webhook_url, ntfy_topic_url,
                spend_cap_usd, quiet_hours_start, quiet_hours_end, quiet_hours_tz,
                voice_calls_enabled, slack_enabled, ntfy_enabled, email_enabled,
                alert_email, min_severity_voice, min_severity_slack,
                anomaly_cooldown_minutes, updated_at
            ) VALUES (
                gen_random_uuid(), $1::uuid, $2, $3, $4,
                $5, $6, $7, $8,
                $9, $10, $11, $12,
                $13, $14, $15,
                $16, now()
            )
            ON CONFLICT (tenant_id) DO UPDATE SET
                alert_phone = EXCLUDED.alert_phone,
                slack_webhook_url = EXCLUDED.slack_webhook_url,
                ntfy_topic_url = EXCLUDED.ntfy_topic_url,
                spend_cap_usd = EXCLUDED.spend_cap_usd,
                quiet_hours_start = EXCLUDED.quiet_hours_start,
                quiet_hours_end = EXCLUDED.quiet_hours_end,
                quiet_hours_tz = EXCLUDED.quiet_hours_tz,
                voice_calls_enabled = EXCLUDED.voice_calls_enabled,
                slack_enabled = EXCLUDED.slack_enabled,
                ntfy_enabled = EXCLUDED.ntfy_enabled,
                email_enabled = EXCLUDED.email_enabled,
                alert_email = EXCLUDED.alert_email,
                min_severity_voice = EXCLUDED.min_severity_voice,
                min_severity_slack = EXCLUDED.min_severity_slack,
                anomaly_cooldown_minutes = EXCLUDED.anomaly_cooldown_minutes,
                updated_at = now()
            RETURNING id, tenant_id, alert_phone, slack_webhook_url, ntfy_topic_url,
                      spend_cap_usd, quiet_hours_start, quiet_hours_end, quiet_hours_tz,
                      voice_calls_enabled, slack_enabled, ntfy_enabled, email_enabled,
                      alert_email, min_severity_voice, min_severity_slack,
                      anomaly_cooldown_minutes, created_at, updated_at
            """,
            tenant_uuid,
            merged.get("alert_phone"),
            merged.get("slack_webhook_url"),
            merged.get("ntfy_topic_url"),
            merged.get("spend_cap_usd"),
            merged.get("quiet_hours_start"),
            merged.get("quiet_hours_end"),
            merged.get("quiet_hours_tz") or "Asia/Kolkata",
            bool(merged.get("voice_calls_enabled", True)),
            bool(merged.get("slack_enabled", True)),
            bool(merged.get("ntfy_enabled", True)),
            bool(merged.get("email_enabled", False)),
            merged.get("alert_email"),
            merged.get("min_severity_voice") or "critical",
            merged.get("min_severity_slack") or "medium",
            int(merged.get("anomaly_cooldown_minutes", 60)),
        )

        return _format_settings_dict(dict(row), mask_urls=True)

    async def test_slack(self, tenant_id: str, conn: Any) -> Dict[str, Any]:
        """
        POST to slack_webhook_url: {"text": "✅ Cirra alert channel configured correctly!"}.
        Return { success: bool, http_code: int }.
        """
        c = await _resolve_conn(conn)
        row = await c.fetchrow(
            "SELECT slack_webhook_url FROM tenant_settings WHERE tenant_id = $1::uuid",
            uuid.UUID(str(tenant_id)),
        )
        url = row["slack_webhook_url"] if row else None
        if not url:
            raise ValueError("Slack webhook URL is not configured.")

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(url, json={"text": "✅ Cirra alert channel configured correctly!"})
                return {
                    "success": (200 <= resp.status_code < 300),
                    "http_code": resp.status_code,
                }
        except Exception as e:
            http_code = getattr(getattr(e, "response", None), "status_code", 500)
            return {
                "success": False,
                "http_code": http_code,
                "error": str(e),
            }

    async def test_ntfy(self, tenant_id: str, conn: Any) -> Dict[str, Any]:
        """
        POST to ntfy_topic_url: "Cirra test notification".
        Return { success: bool, http_code: int }.
        """
        c = await _resolve_conn(conn)
        row = await c.fetchrow(
            "SELECT ntfy_topic_url FROM tenant_settings WHERE tenant_id = $1::uuid",
            uuid.UUID(str(tenant_id)),
        )
        url = row["ntfy_topic_url"] if row else None
        if not url:
            raise ValueError("ntfy topic URL is not configured.")

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    url,
                    content="Cirra test notification",
                    headers={"Title": "Cirra Test"},
                )
                return {
                    "success": (200 <= resp.status_code < 300),
                    "http_code": resp.status_code,
                }
        except Exception as e:
            http_code = getattr(getattr(e, "response", None), "status_code", 500)
            return {
                "success": False,
                "http_code": http_code,
                "error": str(e),
            }

    async def trigger_test_call(self, tenant_id: str, conn: Any) -> Dict[str, Any]:
        """
        Use VoiceAlertService with is_test: true anomaly snapshot.
        Return { voice_call_id, call_sid, status }.
        """
        from app.services.voice_alert_service import VoiceAlertService

        c = await _resolve_conn(conn)
        tenant_uuid = uuid.UUID(str(tenant_id))

        row = await c.fetchrow(
            "SELECT alert_phone FROM tenant_settings WHERE tenant_id = $1::uuid",
            tenant_uuid,
        )
        alert_phone = row["alert_phone"] if row else None

        voice_service = VoiceAlertService()
        test_anomaly = {
            "is_test": True,
            "provider": "cirra_voice_test",
            "severity": "critical",
            "baseline_value": 10.0,
            "actual_value": 150.0,
            "deviation_pct": 1400.0,
            "explanation": "This is an automated test phone call verifying your Cirra voice alert configuration.",
            "to_number": alert_phone,
        }

        voice_call_id = await voice_service.trigger_alert_call(
            anomaly=test_anomaly,
            tenant_id=str(tenant_id),
            conn=c,
        )

        call_row = await c.fetchrow(
            "SELECT call_sid, status FROM voice_calls WHERE id = $1::uuid",
            uuid.UUID(voice_call_id),
        )

        return {
            "voice_call_id": str(voice_call_id),
            "call_sid": call_row["call_sid"] if call_row else None,
            "status": call_row["status"] if call_row else "initiated",
        }
