import os
from pathlib import Path
import time
from typing import List, Optional
import httpx
from jose import jwt
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def find_env_file() -> Optional[str]:
    cwd = Path.cwd()
    if (cwd / ".env").is_file():
        return str(cwd / ".env")
    for parent in cwd.parents:
        if (parent / ".env").is_file():
            return str(parent / ".env")
    return None


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
    GITHUB_APP_ID: Optional[int] = Field(default=None, alias="GITHUB_APP_ID")
    GITHUB_APP_PRIVATE_KEY: Optional[str] = Field(default=None, alias="GITHUB_APP_PRIVATE_KEY")
    GITHUB_INSTALLATION_ID: Optional[int] = Field(default=None, alias="GITHUB_INSTALLATION_ID")
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
        env_file=find_env_file(),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    _cached_token: Optional[str] = None
    _cached_token_expires_at: float = 0.0

    def invalidate_github_token(self):
        """Force re-minting of GitHub App installation token on next access."""
        self._cached_token = None
        self._cached_token_expires_at = 0.0

    @property
    def effective_github_token(self) -> Optional[str]:
        # If a personal access token is configured directly in env and not a placeholder
        if self.GITHUB_TOKEN and not self.GITHUB_TOKEN.startswith("...") and not self.GITHUB_TOKEN.startswith("ghs_"):
            return self.GITHUB_TOKEN

        # Check if cached token is still valid (with 2-minute safety buffer)
        now = time.time()
        if self._cached_token and now < (self._cached_token_expires_at - 120):
            return self._cached_token

        # Dynamically mint installation token from GitHub App if configured
        if self.GITHUB_APP_ID and self.GITHUB_INSTALLATION_ID:
            pk_val = (self.GITHUB_APP_PRIVATE_KEY or "").strip()
            # If path not found, try workspace secrets/github-app.pem
            if not pk_val or not os.path.exists(pk_val.strip('"\'')):
                workspace_pem = Path(__file__).resolve().parents[3] / "secrets" / "github-app.pem"
                if workspace_pem.is_file():
                    pk_val = str(workspace_pem)

            if pk_val:
                try:
                    if "BEGIN" in pk_val:
                        private_key = pk_val.replace("\\n", "\n").strip()
                    else:
                        clean_path = pk_val.strip('"\'')
                        if len(clean_path) < 260 and os.path.exists(clean_path):
                            with open(clean_path, "r", encoding="utf-8") as f:
                                private_key = f.read().strip()
                        else:
                            private_key = pk_val.replace("\\n", "\n").strip()

                    iat = int(now)
                    payload = {
                        "iat": iat - 30,
                        "exp": iat + 500,
                        "iss": str(self.GITHUB_APP_ID),
                    }
                    encoded_jwt = jwt.encode(payload, private_key, algorithm="RS256")
                    resp = httpx.post(
                        f"https://api.github.com/app/installations/{self.GITHUB_INSTALLATION_ID}/access_tokens",
                        headers={
                            "Authorization": f"Bearer {encoded_jwt}",
                            "Accept": "application/vnd.github+json",
                        },
                        timeout=10.0,
                    )
                    if resp.status_code == 201:
                        token = resp.json()["token"]
                        self._cached_token = token
                        self._cached_token_expires_at = now + 3500
                        return token
                    else:
                        import logging
                        logging.getLogger("cirra.action_engine.config").warning(f"GitHub App token minting returned {resp.status_code}: {resp.text}")
                except Exception as exc:
                    import logging
                    logging.getLogger("cirra.action_engine.config").warning(f"Failed to mint GitHub App installation token: {exc}")
        return self._cached_token or self.GITHUB_TOKEN


settings = Settings()
