import logging
import uuid
import zoneinfo
from datetime import datetime
from typing import Optional
import httpx

from app.config import settings
from app.db import get_db_pool
from app.detector import DetectedAnomaly
from app.notifier import AlertNotifier, NotifyResult

logger = logging.getLogger("cirra.sentinel.alerts")

SEVERITY_ORDER = {
    "low": 1,
    "medium": 2,
    "high": 3,
    "critical": 4,
}


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
        tz = zoneinfo.ZoneInfo(quiet_hours_tz or "Asia/Kolkata")
    except Exception:
        tz = zoneinfo.ZoneInfo("UTC")

    curr = now_dt.astimezone(tz) if now_dt else datetime.now(tz)
    curr_hour = curr.hour

    if quiet_hours_start <= quiet_hours_end:
        return quiet_hours_start <= curr_hour <= quiet_hours_end
    else:
        return curr_hour >= quiet_hours_start or curr_hour <= quiet_hours_end


async def should_send_voice_call(tenant_id: str, severity: str, api_key_id: str) -> bool:
    """
    Check if voice alert call should be placed for this tenant and anomaly:
    - voice_calls_enabled is True
    - severity >= min_severity_voice
    - not within quiet hours
    - not within cooldown window
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT voice_calls_enabled, min_severity_voice, anomaly_cooldown_minutes,
                       quiet_hours_start, quiet_hours_end, quiet_hours_tz
                FROM tenant_settings
                WHERE tenant_id = $1::uuid
                """,
                uuid.UUID(str(tenant_id)),
            )

            voice_calls_enabled = row["voice_calls_enabled"] if row and row["voice_calls_enabled"] is not None else True
            min_severity = row["min_severity_voice"] if row and row["min_severity_voice"] else "critical"
            cooldown_mins = row["anomaly_cooldown_minutes"] if row and row["anomaly_cooldown_minutes"] else 60
            qh_start = row["quiet_hours_start"] if row else None
            qh_end = row["quiet_hours_end"] if row else None
            qh_tz = row["quiet_hours_tz"] if row and row["quiet_hours_tz"] else "Asia/Kolkata"

            if not voice_calls_enabled:
                logger.info(f"Voice call suppressed for tenant {tenant_id}: voice_calls_enabled=False")
                return False

            curr_sev_val = SEVERITY_ORDER.get((severity or "").lower(), 0)
            min_sev_val = SEVERITY_ORDER.get(min_severity.lower(), 4)
            if curr_sev_val < min_sev_val:
                logger.info(
                    f"Voice call suppressed for tenant {tenant_id}: severity {severity} < min_severity {min_severity}"
                )
                return False

            if is_in_quiet_hours(qh_start, qh_end, qh_tz):
                logger.info(f"Voice call suppressed for tenant {tenant_id}: current time in quiet hours")
                return False

            if api_key_id:
                count = await conn.fetchval(
                    f"""
                    SELECT count(*) FROM voice_calls
                    WHERE tenant_id = $1::uuid
                      AND created_at > now() - interval '{int(cooldown_mins)} minutes'
                      AND (anomaly_snapshot->>'api_key_id' = $2 OR anomaly_snapshot->>'series_key' = $2)
                    """,
                    uuid.UUID(str(tenant_id)),
                    str(api_key_id),
                )
                if count and count > 0:
                    logger.info(
                        f"Voice call suppressed for tenant {tenant_id}: within cooldown window of {cooldown_mins}m"
                    )
                    return False

            return True
    except Exception as e:
        logger.error(f"Error checking should_send_voice_call for tenant {tenant_id}: {e}")
        return True


async def should_send_slack(tenant_id: str, severity: str, api_key_id: str) -> bool:
    """Check if Slack notification should be sent."""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT slack_enabled, min_severity_slack, anomaly_cooldown_minutes,
                       quiet_hours_start, quiet_hours_end, quiet_hours_tz
                FROM tenant_settings
                WHERE tenant_id = $1::uuid
                """,
                uuid.UUID(str(tenant_id)),
            )

            slack_enabled = row["slack_enabled"] if row and row["slack_enabled"] is not None else True
            min_severity = row["min_severity_slack"] if row and row["min_severity_slack"] else "medium"
            cooldown_mins = row["anomaly_cooldown_minutes"] if row and row["anomaly_cooldown_minutes"] else 60
            qh_start = row["quiet_hours_start"] if row else None
            qh_end = row["quiet_hours_end"] if row else None
            qh_tz = row["quiet_hours_tz"] if row and row["quiet_hours_tz"] else "Asia/Kolkata"

            if not slack_enabled:
                return False

            curr_sev_val = SEVERITY_ORDER.get((severity or "").lower(), 0)
            min_sev_val = SEVERITY_ORDER.get(min_severity.lower(), 2)
            if curr_sev_val < min_sev_val:
                return False

            if is_in_quiet_hours(qh_start, qh_end, qh_tz):
                return False

            if api_key_id:
                count = await conn.fetchval(
                    f"""
                    SELECT count(*) FROM anomalies
                    WHERE tenant_id = $1::uuid
                      AND alert_sent = true
                      AND detected_at > now() - interval '{int(cooldown_mins)} minutes'
                      AND (api_key_id::text = $2 OR series_key = $2)
                    """,
                    uuid.UUID(str(tenant_id)),
                    str(api_key_id),
                )
                if count and count > 0:
                    return False

            return True
    except Exception as e:
        logger.error(f"Error checking should_send_slack for tenant {tenant_id}: {e}")
        return True


async def should_send_ntfy(tenant_id: str, severity: str, api_key_id: str) -> bool:
    """Check if ntfy push notification should be sent."""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT ntfy_enabled, min_severity_slack, anomaly_cooldown_minutes,
                       quiet_hours_start, quiet_hours_end, quiet_hours_tz
                FROM tenant_settings
                WHERE tenant_id = $1::uuid
                """,
                uuid.UUID(str(tenant_id)),
            )

            ntfy_enabled = row["ntfy_enabled"] if row and row["ntfy_enabled"] is not None else True
            min_severity = row["min_severity_slack"] if row and row["min_severity_slack"] else "medium"
            cooldown_mins = row["anomaly_cooldown_minutes"] if row and row["anomaly_cooldown_minutes"] else 60
            qh_start = row["quiet_hours_start"] if row else None
            qh_end = row["quiet_hours_end"] if row else None
            qh_tz = row["quiet_hours_tz"] if row and row["quiet_hours_tz"] else "Asia/Kolkata"

            if not ntfy_enabled:
                return False

            curr_sev_val = SEVERITY_ORDER.get((severity or "").lower(), 0)
            min_sev_val = SEVERITY_ORDER.get(min_severity.lower(), 2)
            if curr_sev_val < min_sev_val:
                return False

            if is_in_quiet_hours(qh_start, qh_end, qh_tz):
                return False

            if api_key_id:
                count = await conn.fetchval(
                    f"""
                    SELECT count(*) FROM anomalies
                    WHERE tenant_id = $1::uuid
                      AND alert_sent = true
                      AND detected_at > now() - interval '{int(cooldown_mins)} minutes'
                      AND (api_key_id::text = $2 OR series_key = $2)
                    """,
                    uuid.UUID(str(tenant_id)),
                    str(api_key_id),
                )
                if count and count > 0:
                    return False

            return True
    except Exception as e:
        logger.error(f"Error checking should_send_ntfy for tenant {tenant_id}: {e}")
        return True


async def propose_action_to_engine(
    anomaly: DetectedAnomaly,
    anomaly_db_id: str,
    explanation: str,
) -> bool:
    """
    Auto-propose mitigation action to action engine (port 8003) if accessible.
    """
    action_engine_url = (
        getattr(settings, "action_engine_url", None)
        or "http://localhost:8003"
    ).rstrip("/")
    target_url = f"{action_engine_url}/actions/propose"

    action_type = (
        "kill_switch"
        if (anomaly.detection_type == "leaked_key" or anomaly.severity == "critical")
        else "spend_cap"
    )

    payload = {
        "tenant_id": anomaly.tenant_id,
        "anomaly_id": anomaly_db_id if anomaly_db_id else None,
        "type": action_type,
        "provider": anomaly.provider,
        "target_key_id": anomaly.api_key_id or anomaly.series_key,
        "proposal_json": {
            "reason": explanation,
            "detection_type": anomaly.detection_type,
            "severity": anomaly.severity,
            "baseline_value": float(anomaly.baseline_value) if anomaly.baseline_value is not None else 0.0,
            "actual_value": float(anomaly.actual_value) if anomaly.actual_value is not None else 0.0,
            "deviation_pct": float(anomaly.deviation_pct) if anomaly.deviation_pct is not None else 0.0,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(target_url, json=payload)
            if resp.status_code in (200, 201):
                logger.info(
                    f"Auto-proposed action ({action_type}) to action engine for anomaly '{anomaly_db_id}'"
                )
                return True
            else:
                logger.info(
                    f"Action engine returned HTTP {resp.status_code} for proposal ({anomaly_db_id})"
                )
                return False
    except Exception as exc:
        logger.debug(f"Action engine (port 8003) not accessible or failed: {exc}")
        return False


async def dispatch_alert(
    anomaly: DetectedAnomaly,
    explanation: str,
    anomaly_db_id: str = "",
) -> None:
    """
    Called by Sentinel scheduler when high/critical anomaly fires.
    """
    try:
        if not anomaly_db_id and getattr(anomaly, "tenant_id", None):
            try:
                pool = await get_db_pool()
                async with pool.acquire() as conn:
                    row = await conn.fetchrow(
                        """
                        SELECT id::text FROM anomalies
                        WHERE tenant_id = $1::uuid AND series_key = $2 AND status = 'open'
                        ORDER BY detected_at DESC LIMIT 1;
                        """,
                        uuid.UUID(anomaly.tenant_id),
                        anomaly.series_key,
                    )
                    if row:
                        anomaly_db_id = row["id"]
            except Exception as e:
                logger.debug(f"Notice: anomaly_db_id lookup skipped or failed: {e}")

        # Check tenant alert settings
        tenant_id = str(anomaly.tenant_id)
        severity = getattr(anomaly, "severity", "medium")
        target_key = anomaly.api_key_id or anomaly.series_key or ""

        send_voice = await should_send_voice_call(tenant_id, severity, target_key)

        # 1. Instantiate AlertNotifier
        notifier = AlertNotifier()

        # 2. Await notifier.notify_all
        result: NotifyResult = await notifier.notify_all(anomaly, explanation, anomaly_db_id)

        # 3. If anomaly_db_id: Update anomaly record in Postgres
        if anomaly_db_id:
            try:
                anomaly_uuid = uuid.UUID(anomaly_db_id)
                pool = await get_db_pool()
                async with pool.acquire() as conn:
                    await conn.execute(
                        """
                        UPDATE anomalies SET 
                          alert_sent = true,
                          call_triggered = $1
                        WHERE id = $2;
                        """,
                        result.vapi_triggered,
                        anomaly_uuid,
                    )
                    logger.info(
                        f"Updated anomaly {anomaly_db_id} in Postgres: "
                        f"alert_sent=True, call_triggered={result.vapi_triggered}"
                    )
            except ValueError:
                logger.debug(
                    f"anomaly_db_id '{anomaly_db_id}' is not a valid UUID, skipping Postgres update."
                )
            except Exception as e:
                logger.error(
                    f"Failed to update anomaly record {anomaly_db_id} in Postgres: {e}"
                )

        # 4. Auto-propose actions to action engine (port 8003) if accessible
        try:
            await propose_action_to_engine(anomaly, anomaly_db_id, explanation)
        except Exception as e:
            logger.debug(f"Action proposal attempt notice: {e}")

        # 5. Trigger voice call if permitted by should_send_voice_call
        if send_voice and anomaly_db_id:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    voice_resp = await client.post(
                        f"{settings.API_BASE_URL}/api/v1/voice/call",
                        json={
                            "anomaly_id": anomaly_db_id,
                            "tenant_id": str(anomaly.tenant_id),
                        },
                        headers={
                            "X-Internal-Service": settings.INTERNAL_SERVICE_KEY,
                        },
                    )
                    if voice_resp.status_code == 200:
                        logger.info(
                            f"Voice call triggered for anomaly {anomaly_db_id}: {voice_resp.json()}"
                        )
                    else:
                        logger.warning(
                            f"Voice call trigger returned HTTP {voice_resp.status_code}: {voice_resp.text}"
                        )
            except Exception as e:
                logger.error(f"Voice call dispatch error: {e}")

        # 6. Log full NotifyResult
        logger.info(f"Full NotifyResult: {result}")

    except Exception as exc:
        logger.error(
            f"Error during alert dispatch for series '{getattr(anomaly, 'series_key', '')}': {exc}",
            exc_info=True,
        )
