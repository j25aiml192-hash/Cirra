from typing import Optional
from pathlib import Path
from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict


def find_env_file() -> Optional[str]:
    # Look for .env in current working directory or repo root
    cwd = Path.cwd()
    if (cwd / ".env").is_file():
        return str(cwd / ".env")
    for parent in cwd.parents:
        if (parent / ".env").is_file():
            return str(parent / ".env")
    return None


class SentinelSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=find_env_file(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # PostgreSQL
    DATABASE_URL: str = "postgresql://postgres:postgrespassword@localhost:5432/cirra"

    @property
    def asyncpg_database_url(self) -> str:
        # asyncpg expects postgresql:// or postgres://
        return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

    # ClickHouse
    CLICKHOUSE_HOST: str = "localhost"
    CLICKHOUSE_PORT: int = 8123
    CLICKHOUSE_USER: str = "cirra_reader"
    CLICKHOUSE_PASSWORD: str = "Reader_Secure_Password123"
    CLICKHOUSE_READER_USER: Optional[str] = None
    CLICKHOUSE_READER_PASSWORD: Optional[str] = None
    CLICKHOUSE_DATABASE: str = "cirra"
    CLICKHOUSE_SECURE: Optional[bool] = None

    @property
    def effective_ch_user(self) -> str:
        return self.CLICKHOUSE_READER_USER or self.CLICKHOUSE_USER

    @property
    def effective_ch_password(self) -> str:
        return self.CLICKHOUSE_READER_PASSWORD or self.CLICKHOUSE_PASSWORD

    @property
    def effective_ch_host(self) -> str:
        raw = self.CLICKHOUSE_HOST
        cleaned = raw.replace("https://", "").replace("http://", "").split("/")[0].split(":")[0]
        return cleaned

    @property
    def effective_ch_secure(self) -> bool:
        if self.CLICKHOUSE_SECURE is not None:
            return self.CLICKHOUSE_SECURE
        return "https://" in self.CLICKHOUSE_HOST or self.CLICKHOUSE_PORT == 8443

    # Anomaly detection intervals (minutes)
    SENTINEL_AI_CHECK_INTERVAL_MINUTES: int = 5
    SENTINEL_CLOUD_CHECK_INTERVAL_MINUTES: int = 60
    SENTINEL_LEAKED_KEY_CHECK_INTERVAL_MINUTES: int = 15

    # Thresholds
    SENTINEL_MIN_DOLLAR_IMPACT_AI: float = 10.0
    SENTINEL_MIN_DOLLAR_IMPACT_CLOUD: float = 50.0
    SENTINEL_ZSCORE_THRESHOLD: float = 3.0

    # Notification / Alert Delivery Configuration
    cirra_dashboard_url: str = Field(
        default="http://localhost:3000",
        validation_alias=AliasChoices("CIRRA_DASHBOARD_URL", "cirra_dashboard_url"),
    )
    slack_webhook_url: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("SLACK_WEBHOOK_URL", "slack_webhook_url"),
    )
    ntfy_topic_url: str = Field(
        default="https://ntfy.sh/cirra-alerts",
        validation_alias=AliasChoices("NTFY_TOPIC_URL", "ntfy_topic_url"),
    )
    vapi_api_key: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("VAPI_API_KEY", "vapi_api_key"),
    )
    vapi_assistant_id: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("VAPI_ASSISTANT_ID", "vapi_assistant_id"),
    )
    vapi_alert_phone_number: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("VAPI_ALERT_PHONE_NUMBER", "vapi_alert_phone_number"),
    )
    action_engine_url: str = Field(
        default="http://localhost:8003",
        validation_alias=AliasChoices("ACTION_ENGINE_URL", "action_engine_url"),
    )
    api_base_url: str = Field(
        default="http://localhost:8000",
        validation_alias=AliasChoices("API_BASE_URL", "api_base_url"),
    )
    internal_service_key: str = Field(
        default="internal-dev-key",
        validation_alias=AliasChoices("INTERNAL_SERVICE_KEY", "internal_service_key"),
    )

    # Legacy / compatibility properties
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None

    @property
    def API_BASE_URL(self) -> str:
        return self.api_base_url

    @property
    def INTERNAL_SERVICE_KEY(self) -> str:
        return self.internal_service_key

    @property
    def CIRRA_DASHBOARD_URL(self) -> str:
        return self.cirra_dashboard_url

    @property
    def SLACK_WEBHOOK_URL(self) -> Optional[str]:
        return self.slack_webhook_url

    @property
    def NTFY_TOPIC_URL(self) -> str:
        return self.ntfy_topic_url

    @property
    def VAPI_API_KEY(self) -> Optional[str]:
        return self.vapi_api_key

    @property
    def VAPI_ASSISTANT_ID(self) -> Optional[str]:
        return self.vapi_assistant_id

    @property
    def VAPI_ALERT_PHONE_NUMBER(self) -> Optional[str]:
        return self.vapi_alert_phone_number

    # Logging & Run Mode
    LOG_LEVEL: str = "INFO"
    SENTINEL_RUN_ONCE: bool = False


settings = SentinelSettings()
