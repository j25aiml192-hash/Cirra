from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development", alias="ENVIRONMENT")
    PORT: int = Field(default=8003, alias="ACTION_ENGINE_PORT")
    HOST: str = "0.0.0.0"

    # Database
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgrespassword@localhost:5432/cirra",
        alias="DATABASE_URL",
    )
    DATABASE_RLS_USER: str = Field(default="cirra_app", alias="DATABASE_RLS_USER")

    # Ingest / Demo Mock Mode
    INGEST_MOCK: bool = Field(default=False, alias="INGEST_MOCK")

    # Provider API Keys for Kill Switch
    OPENAI_ADMIN_KEY: Optional[str] = Field(default=None, alias="OPENAI_ADMIN_KEY")
    OPENAI_API_KEY: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    ANTHROPIC_ADMIN_KEY: Optional[str] = Field(default=None, alias="ANTHROPIC_ADMIN_KEY")
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None, alias="ANTHROPIC_API_KEY")
    GROQ_API_KEY: Optional[str] = Field(default=None, alias="GROQ_API_KEY")
    GEMINI_API_KEY: Optional[str] = Field(default=None, alias="GEMINI_API_KEY")

    # GitHub Integration
    GITHUB_TOKEN: Optional[str] = Field(default=None, alias="GITHUB_TOKEN")
    GITHUB_DEMO_REPO_OWNER: str = Field(default="j25aiml192-hash", alias="GITHUB_DEMO_REPO_OWNER")
    GITHUB_DEMO_REPO_NAME: str = Field(default="cirra-demo-infra", alias="GITHUB_DEMO_REPO_NAME")

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://cirra.dev",
        "*",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
