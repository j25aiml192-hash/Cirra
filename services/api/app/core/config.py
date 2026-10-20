from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # Supabase Auth
    SUPABASE_JWT_SECRET: str = Field(default="supabase-secret-placeholder-for-tests", alias="SUPABASE_JWT_SECRET")
    SUPABASE_URL: str = Field(default="https://cirra.supabase.co", alias="SUPABASE_URL")

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://cirra.dev",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
