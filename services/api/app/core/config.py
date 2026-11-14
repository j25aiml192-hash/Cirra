import os
from typing import List, Optional
from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load .env into os.environ for non-pydantic libraries (clickhouse_connect, etc.)
load_dotenv(override=False)


class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development", alias="ENVIRONMENT")
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Cirra API"

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/cirra",
        alias="DATABASE_URL"
    )
    # Non-superuser database URL for RLS enforcement
    DATABASE_RLS_USER: str = Field(default="cirra_app", alias="DATABASE_RLS_USER")

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    RATE_LIMIT_PER_MINUTE: int = Field(default=120, alias="RATE_LIMIT_PER_MINUTE")

    # Security & Encryption (AES-256 base64 key)
    ENCRYPTION_KEY: str = Field(
        default="MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
        alias="ENCRYPTION_KEY"
    )

    # JWT Authentication
    CIRRA_JWT_SECRET: str = Field(default="cirra-super-secret-jwt-key-2026-very-secure", alias="CIRRA_JWT_SECRET")
    CIRRA_JWT_ALGORITHM: str = "HS256"
    CIRRA_JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    @field_validator("ENCRYPTION_KEY", mode="before")
    def validate_encryption_key(cls, v):
        return v if v else "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY="

    @field_validator("CIRRA_JWT_SECRET", mode="before")
    def validate_jwt_secret(cls, v):
        return v if v else "cirra-super-secret-jwt-key-2026-very-secure"

    # Supabase Auth
    SUPABASE_JWT_SECRET: str = Field(default="supabase-secret-placeholder-for-tests", alias="SUPABASE_JWT_SECRET")
    SUPABASE_URL: str = Field(default="https://cirra.supabase.co", alias="SUPABASE_URL")
    SUPABASE_ANON_KEY: Optional[str] = Field(default=None, alias="SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = Field(default=None, alias="SUPABASE_SERVICE_ROLE_KEY")

    # Investigator Service
    INVESTIGATOR_URL: str = Field(default="http://localhost:8001", alias="INVESTIGATOR_URL")

    # Sentinel Service
    SENTINEL_URL: str = Field(default="http://localhost:8002", alias="SENTINEL_URL")

    # Action Engine Service
    ACTION_ENGINE_URL: str = Field(default="http://localhost:8003", alias="ACTION_ENGINE_URL")

    # Telephony & AI Voice
    TWILIO_ACCOUNT_SID: Optional[str] = Field(default=None, alias="TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: Optional[str] = Field(default=None, alias="TWILIO_AUTH_TOKEN")
    TWILIO_FROM_NUMBER: str = Field(default="+17372508034", alias="TWILIO_FROM_NUMBER")
    PUBLIC_WEBHOOK_URL: str = Field(
        default="https://almanac-unflawed-gents.ngrok-free.dev",
        alias="PUBLIC_WEBHOOK_URL"
    )
    INTERNAL_SERVICE_KEY: str = Field(default="internal-dev-key", alias="INTERNAL_SERVICE_KEY")
    API_BASE_URL: str = Field(default="http://localhost:8000", alias="API_BASE_URL")
    VAPI_ALERT_PHONE_NUMBER: str = Field(default="+918910095002", alias="VAPI_ALERT_PHONE_NUMBER")
    GROQ_API_KEY: Optional[str] = Field(default=None, alias="GROQ_API_KEY")
    INGEST_MOCK: bool = Field(default=False, alias="INGEST_MOCK")

    @property
    def twilio_account_sid(self) -> Optional[str]:
        return self.TWILIO_ACCOUNT_SID

    @property
    def twilio_auth_token(self) -> Optional[str]:
        return self.TWILIO_AUTH_TOKEN

    @property
    def twilio_from_number(self) -> str:
        return self.TWILIO_FROM_NUMBER

    @property
    def public_webhook_url(self) -> str:
        return self.PUBLIC_WEBHOOK_URL

    @property
    def internal_service_key(self) -> str:
        return self.INTERNAL_SERVICE_KEY

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://cirra.dev",
        "https://cirra-frontend.vercel.app",
        "https://*.vercel.app",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
