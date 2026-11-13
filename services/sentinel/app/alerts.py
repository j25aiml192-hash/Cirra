import asyncio
from dataclasses import dataclass
from decimal import Decimal
import logging
import uuid
import zoneinfo
from datetime import datetime
from typing import List, Optional
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


@dataclass
class TieredAlertResult:
    tier: int  # 1-5
    channels_fired: List[str]
    slack_ok: bool
    ntfy_ok: bool
    vapi_ok: bool
    github_pr_url: Optional[str]
    kill_switch_proposed: bool


def determine_tier(severity: str, detection_type: str, deviation_pct: Optional[float] = None) -> int:
    """
    Determine tier (1-5) from severity and detection_type (with deviation fallback).
    TIER 1 — LOW (deviation 15-50%, severity='low')
    TIER 2 — MEDIUM (deviation 50-150%, severity='medium')
    TIER 3 — HIGH (deviation 150-300%, severity='high')
    TIER 4 — CRITICAL (deviation >300%, severity='critical', NOT leaked_key)
    TIER 5 — CATASTROPHIC (severity='critical' AND detection_type='leaked_key')
    """
    sev = (severity or "").lower().strip()
    det = (detection_type or "").lower().strip()

    if (sev == "critical" or (deviation_pct and deviation_pct > 300)) and det == "leaked_key":
        return 5
    if sev == "critical":
        return 4
    if sev == "high":
        return 3
    if sev == "medium":
        return 2
    if sev == "low":
        return 1

    # Fallback by deviation_pct
    dev = float(deviation_pct or 0.0)
    if dev > 300:
        return 5 if det == "leaked_key" else 4
    if dev >= 150:
        return 3
    if dev >= 50:
        return 2
    return 1


async def _create_and_approve_github_pr(
    anomaly: DetectedAnomaly,
    anomaly_db_id: str,
    explanation: str,
) -> Optional[str]:
    """Propose GitHub PR action and auto-approve it via action-engine for demo."""
    action_engine_url = (getattr(settings, "action_engine_url", None) or "http://localhost:8003").rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{action_engine_url}/actions/propose",
                json={
                    "tenant_id": str(anomaly.tenant_id),
                    "anomaly_id": anomaly_db_id if anomaly_db_id else None,
                    "action_type": "github_pr",
                    "provider": anomaly.provider,
                    "target_key_id": anomaly.api_key_id or anomaly.series_key,
                    "proposal_details": {
                        "reason": explanation,
                        "detection_type": anomaly.detection_type,
                        "severity": anomaly.severity,
                        "baseline_value": float(anomaly.baseline_value) if anomaly.baseline_value is not None else 0.0,
                        "actual_value": float(anomaly.actual_value) if anomaly.actual_value is not None else 0.0,
                        "deviation_pct": float(anomaly.deviation_pct) if anomaly.deviation_pct is not None else 0.0,
                    },
                },
            )
            if resp.status_code in (200, 201):
                act_data = resp.json()
                action_id = act_data.get("id")
                if action_id:
                    appr_resp = await client.post(
                        f"{action_engine_url}/actions/{action_id}/approve",
                        json={"approved_by_user_id": str(anomaly.tenant_id) or "00000000-0000-0000-0000-000000000001"},
                    )
                    if appr_resp.status_code in (200, 201):
                        appr_data = appr_resp.json()
                        pr_url = appr_data.get("github_pr_url") or appr_data.get("pr_url")
                        if pr_url:
                            return pr_url
                    # Fallback check directly from database in case response serialized differently
                    try:
                        pool = await get_db_pool()
                        async with pool.acquire() as db_conn:
                            row = await db_conn.fetchrow(
                                "SELECT github_pr_url FROM actions WHERE id = $1::uuid",
                                uuid.UUID(str(action_id)),
                            )
                            if row and row["github_pr_url"]:
                                return str(row["github_pr_url"])
                    except Exception as db_err:
                        logger.warning(f"Could not query action {action_id} from db: {db_err}")
    except Exception as exc:
        logger.warning(f"Failed to create/approve GitHub PR via action engine: {exc}")
    return None


async def _propose_kill_switch_action(
    anomaly: DetectedAnomaly,
    anomaly_db_id: str,
    explanation: str,
) -> bool:
    """Auto-propose kill switch action in DB via action-engine (not approved)."""
    action_engine_url = (getattr(settings, "action_engine_url", None) or "http://localhost:8003").rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{action_engine_url}/actions/propose",
                json={
                    "tenant_id": str(anomaly.tenant_id),
                    "anomaly_id": anomaly_db_id if anomaly_db_id else None,
                    "action_type": "kill_switch",
                    "provider": anomaly.provider,
                    "target_key_id": anomaly.api_key_id or anomaly.series_key,
                    "proposal_details": {
                        "reason": explanation,
                        "detection_type": anomaly.detection_type,
                        "severity": anomaly.severity,
                        "baseline_value": float(anomaly.baseline_value) if anomaly.baseline_value is not None else 0.0,
                        "actual_value": float(anomaly.actual_value) if anomaly.actual_value is not None else 0.0,
                        "deviation_pct": float(anomaly.deviation_pct) if anomaly.deviation_pct is not None else 0.0,
                    },
                },
            )
            return resp.status_code in (200, 201)
    except Exception as exc:
        logger.warning(f"Failed to propose kill switch: {exc}")
        return False


async def _trigger_voice_alert(
    notifier: AlertNotifier,
    anomaly: DetectedAnomaly,
    explanation: str,
    anomaly_db_id: str,
) -> bool:
    """Trigger voice alert via Vapi and/or API telephony service."""
    vapi_ok = False
    try:
        vapi_ok = await notifier.trigger_vapi_call(anomaly, explanation, anomaly_db_id)
    except Exception as exc:
        logger.error(f"Vapi call failed: {exc}")

    if anomaly_db_id:
        try:
            api_base = getattr(settings, "API_BASE_URL", "http://localhost:8000").rstrip("/")
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{api_base}/api/v1/voice/call",
                    json={
                        "anomaly_id": anomaly_db_id,
                        "tenant_id": str(anomaly.tenant_id),
                    },
                    headers={"X-Internal-Service": settings.INTERNAL_SERVICE_KEY},
                )
                if resp.status_code in (200, 201):
                    vapi_ok = True
        except Exception as exc:
            logger.debug(f"API voice service dispatch note: {exc}")

    return vapi_ok


async def dispatch_tiered_alert(
    anomaly: DetectedAnomaly,
    explanation: str,
    anomaly_db_id: str = "",
) -> TieredAlertResult:
    """
    Routes to correct alert channels based on tier.
    Returns TieredAlertResult showing which channels fired.
    """
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

    dev_pct_val = float(anomaly.deviation_pct) if anomaly.deviation_pct is not None else 0.0
    tier = determine_tier(
        severity=getattr(anomaly, "severity", "medium"),
        detection_type=getattr(anomaly, "detection_type", "spend_spike"),
        deviation_pct=dev_pct_val,
    )

    channels_fired: List[str] = []
    slack_ok = False
    ntfy_ok = False
    vapi_ok = False
    github_pr_url: Optional[str] = None
    kill_switch_proposed = False

    notifier = AlertNotifier()

    if tier == 1:
        # TIER 1 — LOW (deviation 15-50%, severity='low'):
        # ntfy ONLY. No Slack, no call, no PR. ntfy priority: low. Message: brief, informational.
        channels_fired = ["ntfy"]
        ntfy_ok = await notifier.send_ntfy(anomaly, explanation, anomaly_db_id, priority="low", tier=1)

    elif tier == 2:
        # TIER 2 — MEDIUM (deviation 50-150%, severity='medium'):
        # ntfy + Slack. No call, no PR. ntfy priority: default. Slack: simple text message, no action buttons.
        channels_fired = ["ntfy", "slack"]
        n_res, s_res = await asyncio.gather(
            notifier.send_ntfy(anomaly, explanation, anomaly_db_id, priority="default", tier=2),
            notifier.send_slack(anomaly, explanation, anomaly_db_id, tier=2),
            return_exceptions=True,
        )
        ntfy_ok = bool(n_res is True)
        slack_ok = bool(s_res is True)

    elif tier == 3:
        # TIER 3 — HIGH (deviation 150-300%, severity='high'):
        # Slack + ntfy + GitHub PR. No voice call. ntfy priority: high.
        # Slack: full block kit with "View in Cirra" button.
        # GitHub PR: raised and auto-approved for demo.
        channels_fired = ["slack", "ntfy", "github_pr"]
        n_res, s_res = await asyncio.gather(
            notifier.send_ntfy(anomaly, explanation, anomaly_db_id, priority="high", tier=3),
            notifier.send_slack(anomaly, explanation, anomaly_db_id, tier=3),
            return_exceptions=True,
        )
        ntfy_ok = bool(n_res is True)
        slack_ok = bool(s_res is True)

        github_pr_url = await _create_and_approve_github_pr(anomaly, anomaly_db_id, explanation)

    elif tier == 4:
        # TIER 4 — CRITICAL (deviation >300%, severity='critical', NOT a leaked key):
        # Slack with @channel mention + GitHub PR + Vapi call. NO ntfy.
        # Slack: urgent block kit with kill switch button. Call placed to VAPI_ALERT_PHONE_NUMBER.
        # PR raised on cirra-demo-infra.
        channels_fired = ["slack", "github_pr", "vapi"]
        slack_ok = await notifier.send_slack(anomaly, explanation, anomaly_db_id, tier=4)
        github_pr_url = await _create_and_approve_github_pr(anomaly, anomaly_db_id, explanation)
        vapi_ok = await _trigger_voice_alert(notifier, anomaly, explanation, anomaly_db_id)

    elif tier == 5:
        # TIER 5 — CATASTROPHIC (severity='critical' AND detection_type='leaked_key'):
        # ALL channels simultaneously: Slack @channel + ntfy urgent + Vapi call + GitHub PR + auto-propose kill switch action in DB.
        # ntfy priority: urgent. Kill switch proposed but NOT auto-approved.
        channels_fired = ["slack", "ntfy", "github_pr", "vapi", "kill_switch"]
        n_res, s_res = await asyncio.gather(
            notifier.send_ntfy(anomaly, explanation, anomaly_db_id, priority="urgent", tier=5),
            notifier.send_slack(anomaly, explanation, anomaly_db_id, tier=5),
            return_exceptions=True,
        )
        ntfy_ok = bool(n_res is True)
        slack_ok = bool(s_res is True)

        github_pr_url = await _create_and_approve_github_pr(anomaly, anomaly_db_id, explanation)
        vapi_ok = await _trigger_voice_alert(notifier, anomaly, explanation, anomaly_db_id)
        kill_switch_proposed = await _propose_kill_switch_action(anomaly, anomaly_db_id, explanation)

    # Update anomaly record in Postgres if anomaly_db_id is present
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
                    vapi_ok,
                    anomaly_uuid,
                )
                logger.info(
                    f"Updated anomaly {anomaly_db_id} in Postgres: "
                    f"alert_sent=True, call_triggered={vapi_ok}"
                )
        except ValueError:
            logger.debug(f"anomaly_db_id '{anomaly_db_id}' is not a valid UUID, skipping Postgres update.")
        except Exception as e:
            logger.error(f"Failed to update anomaly record {anomaly_db_id} in Postgres: {e}")

    result = TieredAlertResult(
        tier=tier,
        channels_fired=channels_fired,
        slack_ok=slack_ok,
        ntfy_ok=ntfy_ok,
        vapi_ok=vapi_ok,
        github_pr_url=github_pr_url,
        kill_switch_proposed=kill_switch_proposed,
    )
    logger.info(f"TieredAlertResult for anomaly '{anomaly_db_id}': {result}")
    return result


async def dispatch_alert(
    anomaly: DetectedAnomaly,
    explanation: str,
    anomaly_db_id: str = "",
) -> TieredAlertResult:
    """
    Backward-compatible wrapper for dispatch_tiered_alert().
    """
    return await dispatch_tiered_alert(anomaly, explanation, anomaly_db_id)
