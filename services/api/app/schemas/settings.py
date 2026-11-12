from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class UpdateSettingsRequest(BaseModel):
    alert_phone: Optional[str] = None
    slack_webhook_url: Optional[str] = None
    ntfy_topic_url: Optional[str] = None
    spend_cap_usd: Optional[float] = None
    quiet_hours_start: Optional[int] = None
    quiet_hours_end: Optional[int] = None
    quiet_hours_tz: Optional[str] = None
    voice_calls_enabled: Optional[bool] = None
    slack_enabled: Optional[bool] = None
    ntfy_enabled: Optional[bool] = None
    email_enabled: Optional[bool] = None
    alert_email: Optional[str] = None
    min_severity_voice: Optional[str] = None
    min_severity_slack: Optional[str] = None
    anomaly_cooldown_minutes: Optional[int] = None


class SettingsResponse(BaseModel):
    id: Optional[str] = None
    tenant_id: str
    alert_phone: Optional[str] = None
    slack_webhook_url: Optional[str] = None
    ntfy_topic_url: Optional[str] = None
    spend_cap_usd: Optional[float] = None
    quiet_hours_start: Optional[int] = None
    quiet_hours_end: Optional[int] = None
    quiet_hours_tz: str = "Asia/Kolkata"
    voice_calls_enabled: bool = True
    slack_enabled: bool = True
    ntfy_enabled: bool = True
    email_enabled: bool = False
    alert_email: Optional[str] = None
    min_severity_voice: str = "critical"
    min_severity_slack: str = "medium"
    anomaly_cooldown_minutes: int = 60
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TestWebhookResponse(BaseModel):
    success: bool
    http_code: Optional[int] = None
    error: Optional[str] = None


class TestCallResponse(BaseModel):
    voice_call_id: str
    call_sid: Optional[str] = None
    status: str
