import os
from pathlib import Path
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Cirra Investigator"
    ENVIRONMENT: str = Field(default="development", alias="ENVIRONMENT")
    HOST: str = "0.0.0.0"
    PORT: int = 8001

    # Groq LLM Configuration
    GROQ_API_KEY: Optional[str] = Field(default=None, alias="GROQ_API_KEY")
    GROQ_MODEL: str = Field(default="llama-3.1-8b-instant", alias="GROQ_MODEL")
    GROQ_BASE_URL: str = Field(default="https://api.groq.com/openai/v1", alias="GATEWAY_GROQ_BASE_URL")
    GROQ_FALLBACK_MODELS: List[str] = [
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "llama-3.1-8b-instant",
    ]

    # Google Gemini Configuration
    GEMINI_API_KEY: Optional[str] = Field(default=None, alias="GEMINI_API_KEY")
    GEMINI_BASE_URL: str = Field(
        default="https://generativelanguage.googleapis.com/v1beta/openai/",
        alias="GEMINI_BASE_URL",
    )

    # NVIDIA NIM Configuration
    NVIDIA_NIM_API_KEY: Optional[str] = Field(default=None, alias="NVIDIA_NIM_API_KEY")
    NVIDIA_NIM_BASE_URL: str = Field(
        default="https://integrate.api.nvidia.com/v1",
        alias="NVIDIA_NIM_BASE_URL",
    )

    # Internal service authentication
    INTERNAL_SERVICE_KEY: str = Field(default="internal-dev-key", alias="INTERNAL_SERVICE_KEY")

    # ClickHouse Reader Configuration
    CLICKHOUSE_HOST: str = Field(default="localhost", alias="CLICKHOUSE_HOST")
    CLICKHOUSE_PORT: int = Field(default=8123, alias="CLICKHOUSE_PORT")
    CLICKHOUSE_USER: str = Field(default="cirra_reader", alias="CLICKHOUSE_USER")
    CLICKHOUSE_PASSWORD: str = Field(default="Reader_Secure_Password123", alias="CLICKHOUSE_PASSWORD")
    CLICKHOUSE_READER_USER: Optional[str] = Field(default=None, alias="CLICKHOUSE_READER_USER")
    CLICKHOUSE_READER_PASSWORD: Optional[str] = Field(default=None, alias="CLICKHOUSE_READER_PASSWORD")
    CLICKHOUSE_DATABASE: str = Field(default="cirra", alias="CLICKHOUSE_DATABASE")
    CLICKHOUSE_SECURE: Optional[bool] = Field(default=None, alias="CLICKHOUSE_SECURE")

    model_config = SettingsConfigDict(
        env_file=[
            Path(".env"),
            Path("../.env"),
            Path("../../.env"),
        ],
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def ch_user(self) -> str:
        return self.CLICKHOUSE_READER_USER or self.CLICKHOUSE_USER

    @property
    def ch_password(self) -> str:
        return self.CLICKHOUSE_READER_PASSWORD or self.CLICKHOUSE_PASSWORD

    @property
    def ch_secure(self) -> bool:
        if self.CLICKHOUSE_SECURE is not None:
            return self.CLICKHOUSE_SECURE
        return "https://" in self.CLICKHOUSE_HOST or self.CLICKHOUSE_PORT == 8443

    @property
    def ch_clean_host(self) -> str:
        host = self.CLICKHOUSE_HOST.replace("https://", "").replace("http://", "")
        return host.split("/")[0].split(":")[0]

    @property
    def ch_port(self) -> int:
        if self.ch_secure and self.CLICKHOUSE_PORT == 8123:
            return 8443
        return self.CLICKHOUSE_PORT


settings = Settings()
