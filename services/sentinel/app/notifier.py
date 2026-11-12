import asyncio
import logging
import os
from dataclasses import dataclass
from typing import Any, Dict, Optional
import httpx

from app.config import settings
from app.detector import DetectedAnomaly

logger = logging.getLogger("cirra.sentinel.notifier")


@dataclass
class NotifyResult:
    slack_delivered: bool
    ntfy_delivered: bool
    vapi_triggered: bool
    anomaly_id: str


class AlertNotifier:
    """
    Alert notification dispatcher supporting Slack webhooks, ntfy push notifications,
    and Vapi AI phone calls for high/critical anomalies.
    """

    def __init__(self) -> None:
        self.last_status_codes: Dict[str, Optional[int]] = {
            "slack": None,
            "ntfy": None,
            "vapi": None,
        }

    async def send_slack(
        self,
        anomaly: DetectedAnomaly,
        explanation: str,
        anomaly_db_id: str,
    ) -> bool:
        """
        POST to SLACK_WEBHOOK_URL with specified blocks payload:
        Header, fields (provider, severity, baseline, actual, deviation, key), explanation, view/kill buttons.
        Returns True if HTTP 200, False otherwise.
        Logs delivery attempt and result. If webhook URL is missing/dummy, gracefully simulate and return True or False.
        """
        webhook_url = settings.slack_webhook_url
        # Check for missing or placeholder webhook URL
        is_dummy = (
            not webhook_url
            or "..." in str(webhook_url)
            or "placeholder" in str(webhook_url).lower()
            or "T00000000" in str(webhook_url)
        )
        if is_dummy:
            logger.info(
                f"[SIMULATION] Slack webhook URL is missing or dummy. "
                f"Simulating delivery for anomaly '{anomaly_db_id}'."
            )
            self.last_status_codes["slack"] = 200
            return True

        dashboard_base = (settings.cirra_dashboard_url or "http://localhost:3000").rstrip("/")
        anomaly_url = (
            f"{dashboard_base}/anomalies/{anomaly_db_id}"
            if anomaly_db_id
            else f"{dashboard_base}/anomalies"
        )
        target_key = anomaly.api_key_id or anomaly.series_key
        kill_url = f"{dashboard_base}/actions?target={target_key}&type=kill_switch"

        payload = {
            "text": f"🚨 CIRRA ALERT: {anomaly.severity.upper()} Spend Anomaly on {anomaly.provider}",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"🚨 Cirra Alert: {anomaly.severity.upper()} Spend Anomaly",
                        "emoji": True,
                    },
                },
                {
                    "type": "section",
                    "fields": [
                        {"type": "mrkdwn", "text": f"*Provider:*\n{anomaly.provider}"},
                        {"type": "mrkdwn", "text": f"*Severity:*\n{anomaly.severity.upper()}"},
                        {"type": "mrkdwn", "text": f"*Baseline:*\n${float(anomaly.baseline_value):.2f}"},
                        {"type": "mrkdwn", "text": f"*Actual:*\n${float(anomaly.actual_value):.2f}"},
                        {"type": "mrkdwn", "text": f"*Deviation:*\n+{float(anomaly.deviation_pct):.1f}%"},
                        {"type": "mrkdwn", "text": f"*Key:*\n`{target_key}`"},
                    ],
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Explanation:*\n{explanation}",
                    },
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "🔍 View Anomaly", "emoji": True},
                            "url": anomaly_url,
                            "style": "primary",
                        },
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "🛑 Kill Key / Quarantine", "emoji": True},
                            "url": kill_url,
                            "style": "danger",
                        },
                    ],
                },
            ],
        }

        try:
            logger.info(f"Delivering Slack alert for anomaly '{anomaly_db_id}' to webhook...")
            timeout = httpx.Timeout(10.0, connect=5.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(webhook_url, json=payload)
                self.last_status_codes["slack"] = resp.status_code
                if resp.status_code == 200:
                    logger.info(f"Slack alert delivered successfully for anomaly '{anomaly_db_id}'.")
                    return True
                else:
                    logger.warning(
                        f"Slack delivery failed for anomaly '{anomaly_db_id}': "
                        f"HTTP {resp.status_code} - {resp.text}"
                    )
                    return False
        except Exception as exc:
            logger.error(f"Slack delivery exception for anomaly '{anomaly_db_id}': {exc}")
            self.last_status_codes["slack"] = None
            return False

    async def send_ntfy(
        self,
        anomaly: DetectedAnomaly,
        explanation: str,
        anomaly_db_id: str,
    ) -> bool:
        """
        POST to NTFY_TOPIC_URL (default: https://ntfy.sh/cirra-alerts) with:
        Headers: Title, Priority, Tags, Click, Actions.
        Body: explanation, baseline, actual, extra spend.
        Returns True if HTTP 200.
        """
        topic_url = settings.ntfy_topic_url or "https://ntfy.sh/cirra-alerts"

        # Check for placeholder / dummy
        is_dummy = not topic_url or "..." in topic_url or "placeholder" in topic_url.lower()
        if is_dummy:
            logger.info(
                f"[SIMULATION] ntfy topic URL is missing or dummy. "
                f"Simulating delivery for anomaly '{anomaly_db_id}'."
            )
            self.last_status_codes["ntfy"] = 200
            return True

        dashboard_base = (settings.cirra_dashboard_url or "http://localhost:3000").rstrip("/")
        anomaly_url = (
            f"{dashboard_base}/anomalies/{anomaly_db_id}"
            if anomaly_db_id
            else f"{dashboard_base}/anomalies"
        )
        target_key = anomaly.api_key_id or anomaly.series_key
        kill_url = f"{dashboard_base}/actions?target={target_key}&type=kill_switch"

        priority = "urgent" if anomaly.severity.lower() == "critical" else "high"
        headers = {
            "Title": f"Cirra Alert: {anomaly.severity.upper()} spend anomaly on {anomaly.provider}",
            "Priority": priority,
            "Tags": f"warning,rotating_light,{anomaly.provider.lower()}",
            "Click": anomaly_url,
            "Actions": f"view, View Anomaly, {anomaly_url}; view, Action Center, {kill_url}",
        }

        extra_spend = (
            float(anomaly.actual_value - anomaly.baseline_value)
            if anomaly.actual_value is not None and anomaly.baseline_value is not None
            else 0.0
        )

        body = (
            f"{explanation}\n\n"
            f"Baseline: ${float(anomaly.baseline_value):.2f}\n"
            f"Actual: ${float(anomaly.actual_value):.2f}\n"
            f"Extra spend: ${extra_spend:.2f}\n"
            f"Deviation: +{float(anomaly.deviation_pct):.1f}%\n"
            f"Series: {anomaly.series_key}"
        )

        try:
            logger.info(f"Delivering ntfy push notification for anomaly '{anomaly_db_id}' to {topic_url}...")
            timeout = httpx.Timeout(10.0, connect=5.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(topic_url, headers=headers, content=body.encode("utf-8"))
                self.last_status_codes["ntfy"] = resp.status_code
                if resp.status_code == 200:
                    logger.info(f"ntfy notification delivered successfully for anomaly '{anomaly_db_id}'.")
                    return True
                else:
                    logger.warning(
                        f"ntfy delivery failed for anomaly '{anomaly_db_id}': "
                        f"HTTP {resp.status_code} - {resp.text}"
                    )
                    return False
        except Exception as exc:
            logger.error(f"ntfy delivery exception for anomaly '{anomaly_db_id}': {exc}")
            self.last_status_codes["ntfy"] = None
            return False

    async def trigger_vapi_call(
        self,
        anomaly: DetectedAnomaly,
        explanation: str,
        anomaly_db_id: str,
    ) -> bool:
        """
        POST https://api.vapi.ai/call/phone with:
        Headers: Authorization: Bearer {VAPI_API_KEY}, Content-Type: application/json
        Body: assistantId, customer: { number: VAPI_ALERT_PHONE_NUMBER }, assistantOverrides
        Returns True if HTTP 201, False otherwise.
        Only trigger call if anomaly.severity in ('high','critical').
        Log "Skipping voice call for low/medium severity" otherwise.
        If VAPI_API_KEY is not set or placeholder, log simulation.
        """
        # Only trigger call if anomaly.severity in ('high', 'critical')
        if anomaly.severity.lower() not in ("high", "critical"):
            logger.info("Skipping voice call for low/medium severity")
            self.last_status_codes["vapi"] = None
            return False

        api_key = settings.vapi_api_key
        assistant_id = settings.vapi_assistant_id
        phone_number = settings.vapi_alert_phone_number

        # Check if API key or phone number is missing or placeholder
        is_simulated = (
            not api_key
            or "..." in api_key
            or api_key.startswith("sk-placeholder")
            or api_key.strip() == ""
            or not assistant_id
            or "..." in assistant_id
            or not phone_number
            or "..." in phone_number
        )
        if is_simulated:
            logger.info(
                f"[SIMULATION] VAPI_API_KEY is not set or placeholder. "
                f"Simulating voice call to {phone_number or '<missing phone>'} for anomaly '{anomaly_db_id}'."
            )
            self.last_status_codes["vapi"] = 201
            return True

        clean_phone = phone_number.replace(" ", "")
        payload: Dict[str, Any] = {
            "assistantId": assistant_id,
            "customer": {
                "number": clean_phone,
            },
            "assistantOverrides": {
                "variableValues": {
                    "provider": anomaly.provider,
                    "severity": anomaly.severity,
                    "baseline": str(anomaly.baseline_value),
                    "actual": str(anomaly.actual_value),
                    "deviation": str(anomaly.deviation_pct),
                    "explanation": explanation,
                },
                "firstMessage": (
                    f"Hello, this is Cirra Sentinel. A {anomaly.severity} spend anomaly has been detected on {anomaly.provider}. "
                    f"Actual spend reached {float(anomaly.actual_value):.2f} dollars compared to baseline {float(anomaly.baseline_value):.2f} dollars. "
                    f"Please review the alert or approve remediation."
                ),
            },
        }

        vapi_phone_id = os.getenv("VAPI_PHONE_NUMBER_ID")
        if vapi_phone_id:
            payload["phoneNumberId"] = vapi_phone_id

        try:
            logger.info(f"Triggering Vapi voice call for anomaly '{anomaly_db_id}' to {clean_phone}...")
            timeout = httpx.Timeout(10.0, connect=5.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(
                    "https://api.vapi.ai/call/phone",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                self.last_status_codes["vapi"] = resp.status_code
                if resp.status_code == 201:
                    logger.info(f"Vapi voice call successfully triggered for anomaly '{anomaly_db_id}'.")
                    return True
                else:
                    logger.warning(
                        f"Vapi voice call failed for anomaly '{anomaly_db_id}': "
                        f"HTTP {resp.status_code} - {resp.text}"
                    )
                    return False
        except Exception as exc:
            logger.error(f"Vapi voice call exception for anomaly '{anomaly_db_id}': {exc}")
            self.last_status_codes["vapi"] = None
            return False

    async def notify_all(
        self,
        anomaly: DetectedAnomaly,
        explanation: str,
        anomaly_db_id: str,
    ) -> NotifyResult:
        """
        Run all three deliveries concurrently with asyncio.gather:
        slack_ok, ntfy_ok, vapi_ok = await asyncio.gather(...)
        Return NotifyResult(slack_delivered, ntfy_delivered, vapi_triggered, anomaly_id)
        """
        slack_res, ntfy_res, vapi_res = await asyncio.gather(
            self.send_slack(anomaly, explanation, anomaly_db_id),
            self.send_ntfy(anomaly, explanation, anomaly_db_id),
            self.trigger_vapi_call(anomaly, explanation, anomaly_db_id),
            return_exceptions=True,
        )

        slack_delivered = bool(slack_res is True)
        ntfy_delivered = bool(ntfy_res is True)
        vapi_triggered = bool(vapi_res is True)

        result = NotifyResult(
            slack_delivered=slack_delivered,
            ntfy_delivered=ntfy_delivered,
            vapi_triggered=vapi_triggered,
            anomaly_id=anomaly_db_id,
        )
        logger.info(
            f"NotifyResult for anomaly '{anomaly_db_id}': "
            f"slack={result.slack_delivered}, ntfy={result.ntfy_delivered}, vapi={result.vapi_triggered}"
        )
        return result
