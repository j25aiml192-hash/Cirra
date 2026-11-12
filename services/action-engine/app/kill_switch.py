import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
import httpx

from app.config import settings

logger = logging.getLogger("cirra.action_engine.kill_switch")


@dataclass
class KillSwitchResult:
    success: bool
    provider: str
    key_id: str
    mocked: bool = False
    requires_manual: bool = False
    message: str = ""
    response_code: Optional[int] = None
    error: Optional[str] = None
    executed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "provider": self.provider,
            "key_id": self.key_id,
            "mocked": self.mocked,
            "requires_manual": self.requires_manual,
            "message": self.message,
            "response_code": self.response_code,
            "error": self.error,
            "executed_at": self.executed_at.isoformat() if self.executed_at else None,
        }


class KillSwitchEngine:
    """Provider-specific API key disablement client."""

    async def disable_openai_key(
        self, api_key_id: str, tenant_id: str
    ) -> KillSwitchResult:
        """
        OpenAI Admin API:
        DELETE https://api.openai.com/v1/organization/api_keys/{key_id}
        Auth: Authorization: Bearer {OPENAI_ADMIN_KEY}

        If INGEST_MOCK=true or key starts with 'mock_':
          Simulate success, log "MOCK: would have disabled key {key_id}"
          Return KillSwitchResult(success=True, mocked=True, provider='openai', key_id=api_key_id)

        On real execution:
          Log the attempt BEFORE making the API call
          Make the call
          Log the result with timestamp
          Return KillSwitchResult(
            success=bool,
            provider='openai',
            key_id=api_key_id,
            mocked=False,
            response_code=int,
            error=Optional[str]
          )
        """
        is_mock = settings.INGEST_MOCK or api_key_id.startswith("mock_")
        admin_key = settings.OPENAI_ADMIN_KEY or settings.OPENAI_API_KEY

        if is_mock or not admin_key:
            logger.info("MOCK: would have disabled key %s", api_key_id)
            return KillSwitchResult(
                success=True,
                mocked=True,
                provider="openai",
                key_id=api_key_id,
                message=f"MOCK: would have disabled key {api_key_id}",
            )

        logger.info(
            "Attempting to disable OpenAI API key %s for tenant %s",
            api_key_id,
            tenant_id,
        )
        url = f"https://api.openai.com/v1/organization/api_keys/{api_key_id}"
        headers = {
            "Authorization": f"Bearer {admin_key}",
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.delete(url, headers=headers)
                now = datetime.now(timezone.utc)
                logger.info(
                    "OpenAI API key %s disablement completed with status %s at %s",
                    api_key_id,
                    resp.status_code,
                    now.isoformat(),
                )
                success = 200 <= resp.status_code < 300
                return KillSwitchResult(
                    success=success,
                    provider="openai",
                    key_id=api_key_id,
                    mocked=False,
                    response_code=resp.status_code,
                    error=None if success else resp.text,
                    message="OpenAI key disabled successfully" if success else f"OpenAI error {resp.status_code}: {resp.text}",
                    executed_at=now,
                )
        except Exception as exc:
            now = datetime.now(timezone.utc)
            logger.error(
                "Exception disabling OpenAI key %s at %s: %s",
                api_key_id,
                now.isoformat(),
                str(exc),
                exc_info=True,
            )
            return KillSwitchResult(
                success=False,
                provider="openai",
                key_id=api_key_id,
                mocked=False,
                error=str(exc),
                message=f"Failed to disable OpenAI key: {str(exc)}",
                executed_at=now,
            )

    async def disable_groq_key(
        self, api_key_id: str, tenant_id: str
    ) -> KillSwitchResult:
        """
        Groq does not expose a public key management API.
        Action: Log that manual disablement is required.
        Return KillSwitchResult(
          success=False,
          provider='groq',
          key_id=api_key_id,
          requires_manual=True,
          message='Groq does not support programmatic key disablement. Please disable manually at console.groq.com/keys'
        )
        """
        logger.info(
            "Groq key %s disablement requested for tenant %s. Manual disablement required.",
            api_key_id,
            tenant_id,
        )
        return KillSwitchResult(
            success=False,
            provider="groq",
            key_id=api_key_id,
            requires_manual=True,
            message="Groq does not support programmatic key disablement. Please disable manually at console.groq.com/keys",
        )

    async def disable_anthropic_key(
        self, api_key_id: str, tenant_id: str
    ) -> KillSwitchResult:
        """
        Anthropic Admin API (if available):
        POST https://api.anthropic.com/v1/organizations/api_keys/{key_id}/deactivate
        If returns 404/403:
          Return KillSwitchResult(
            success=False,
            provider='anthropic',
            key_id=api_key_id,
            requires_manual=True,
            message='Disable at console.anthropic.com/settings/keys'
          )
        """
        is_mock = settings.INGEST_MOCK or api_key_id.startswith("mock_")
        anthropic_key = settings.ANTHROPIC_ADMIN_KEY or settings.ANTHROPIC_API_KEY

        if is_mock or not anthropic_key:
            logger.info("MOCK: would have deactivated Anthropic key %s", api_key_id)
            return KillSwitchResult(
                success=True,
                mocked=True,
                provider="anthropic",
                key_id=api_key_id,
                message=f"MOCK: would have deactivated Anthropic key {api_key_id}",
            )

        logger.info(
            "Attempting to deactivate Anthropic API key %s for tenant %s",
            api_key_id,
            tenant_id,
        )
        url = f"https://api.anthropic.com/v1/organizations/api_keys/{api_key_id}/deactivate"
        headers = {
            "x-api-key": anthropic_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, headers=headers)
                now = datetime.now(timezone.utc)
                logger.info(
                    "Anthropic API key %s deactivation returned status %s at %s",
                    api_key_id,
                    resp.status_code,
                    now.isoformat(),
                )
                if resp.status_code in (403, 404):
                    return KillSwitchResult(
                        success=False,
                        provider="anthropic",
                        key_id=api_key_id,
                        requires_manual=True,
                        response_code=resp.status_code,
                        message="Disable at console.anthropic.com/settings/keys",
                        executed_at=now,
                    )
                success = 200 <= resp.status_code < 300
                return KillSwitchResult(
                    success=success,
                    provider="anthropic",
                    key_id=api_key_id,
                    mocked=False,
                    response_code=resp.status_code,
                    error=None if success else resp.text,
                    message="Anthropic key deactivated successfully" if success else f"Anthropic error: {resp.text}",
                    executed_at=now,
                )
        except Exception as exc:
            now = datetime.now(timezone.utc)
            logger.error(
                "Exception deactivating Anthropic key %s at %s: %s",
                api_key_id,
                now.isoformat(),
                str(exc),
                exc_info=True,
            )
            return KillSwitchResult(
                success=False,
                provider="anthropic",
                key_id=api_key_id,
                requires_manual=True,
                error=str(exc),
                message="Disable at console.anthropic.com/settings/keys",
                executed_at=now,
            )

    async def disable_gemini_key(
        self, api_key_id: str, tenant_id: str
    ) -> KillSwitchResult:
        """
        Google AI Studio does not have a programmatic key disablement API for standard keys.
        Return KillSwitchResult(
          success=False,
          provider='gemini',
          key_id=api_key_id,
          requires_manual=True,
          message='Disable at aistudio.google.com/apikey'
        )
        """
        logger.info(
            "Gemini key %s disablement requested for tenant %s. Manual disablement required.",
            api_key_id,
            tenant_id,
        )
        return KillSwitchResult(
            success=False,
            provider="gemini",
            key_id=api_key_id,
            requires_manual=True,
            message="Disable at aistudio.google.com/apikey",
        )

    async def disable_key(
        self, provider: str, api_key_id: str, tenant_id: str
    ) -> KillSwitchResult:
        """Dispatch to the provider-specific disablement method."""
        p = (provider or "").strip().lower()
        if "openai" in p:
            return await self.disable_openai_key(api_key_id, tenant_id)
        elif "groq" in p:
            return await self.disable_groq_key(api_key_id, tenant_id)
        elif "anthropic" in p or "claude" in p:
            return await self.disable_anthropic_key(api_key_id, tenant_id)
        elif "gemini" in p or "google" in p:
            return await self.disable_gemini_key(api_key_id, tenant_id)
        else:
            logger.info("Provider %s key disablement requested for %s. Manual required.", provider, api_key_id)
            return KillSwitchResult(
                success=False,
                provider=provider,
                key_id=api_key_id,
                requires_manual=True,
                message=f"Provider '{provider}' does not support programmatic key disablement. Please disable manually.",
            )
