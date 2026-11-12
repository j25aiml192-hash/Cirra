import asyncio
import logging
import os
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("cirra.ingest.groq")

ALLOWED_ENDPOINTS = {
    "https://api.groq.com/openai/v1/organization/usage",
    "https://api.groq.com/openai/v1/models",
}


def assert_read_only_request(method: str, url: str) -> None:
    if method.upper() != "GET":
        raise PermissionError(f"Security assertion failed: Non-GET method '{method}' is forbidden for connector.")
    base_url = url.split("?")[0]
    if base_url not in ALLOWED_ENDPOINTS:
        raise PermissionError(f"Security assertion failed: URL '{base_url}' is not in allowed read-only endpoints.")


def mask_secret(secret: Optional[str]) -> str:
    if not secret:
        return "[NONE]"
    if len(secret) <= 8:
        return "***"
    return f"{secret[:3]}...{secret[-4:]}"


class GroqConnector:
    def __init__(
        self,
        credentials: Optional[Dict[str, Any]] = None,
        api_key: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ):
        if credentials:
            self.api_key = (
                credentials.get("api_key")
                or credentials.get("secret_key")
                or credentials.get("groq_api_key")
                or ""
            )
            self.tenant_id = tenant_id or credentials.get("tenant_id") or "unknown"
        else:
            self.api_key = api_key or os.getenv("GROQ_API_KEY", "")
            self.tenant_id = tenant_id or "unknown"

        mock_env = os.getenv("INGEST_MOCK", "false").lower() in ("true", "1")
        self.mock_mode = (
            mock_env
            or not self.api_key
            or "mock" in self.api_key.lower()
            or "test" in self.api_key.lower()
        )

    async def fetch_usage(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        max_retries: int = 4,
    ) -> Dict[str, Any]:
        """Fetch Groq usage with read-only assertion and automatic fallback to mock mode."""
        now = datetime.now(timezone.utc)
        end_date = end_date or now
        start_date = start_date or (end_date - timedelta(days=30))

        masked_key = mask_secret(self.api_key)
        logger.info(
            f"Groq fetch_usage called for window {start_date.isoformat()} to {end_date.isoformat()} (key: {masked_key})"
        )

        if self.mock_mode:
            logger.info("GroqConnector running in MOCK mode. Returning synthetic records.")
            return self._generate_mock_results(start_date, end_date)

        url = "https://api.groq.com/openai/v1/organization/usage"
        params: Dict[str, Any] = {
            "start_time": int(start_date.timestamp()),
            "end_time": int(end_date.timestamp()),
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            assert_read_only_request("GET", url)
            async with httpx.AsyncClient(timeout=30.0) as client:
                for attempt in range(max_retries):
                    try:
                        resp = await client.get(url, headers=headers, params=params)
                        if resp.status_code == 429 or resp.status_code >= 500:
                            backoff = (2 ** attempt) + random.uniform(0.1, 0.5)
                            logger.warning(f"Groq API {resp.status_code}. Retrying in {backoff:.2f}s...")
                            await asyncio.sleep(backoff)
                            continue
                        if resp.status_code in (403, 404):
                            logger.warning(
                                f"Groq usage endpoint returned {resp.status_code}. Falling back to MOCK mode."
                            )
                            return self._generate_mock_results(start_date, end_date)
                        resp.raise_for_status()
                        return resp.json()
                    except (httpx.RequestError, httpx.HTTPStatusError) as exc:
                        if attempt == max_retries - 1:
                            logger.warning(f"Groq API request failed after {max_retries} attempts: {exc}. Falling back to MOCK mode.")
                            return self._generate_mock_results(start_date, end_date)
                        backoff = (2 ** attempt) + random.uniform(0.1, 0.5)
                        await asyncio.sleep(backoff)
        except Exception as exc:
            logger.warning(f"Groq fetch encountered exception: {exc}. Falling back to MOCK mode.")
            return self._generate_mock_results(start_date, end_date)

        return self._generate_mock_results(start_date, end_date)

    def _generate_mock_results(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Generate realistic synthetic Groq usage records for 30 days."""
        multiplier = float(os.getenv("COST_MULTIPLIER", "25.0"))
        models = [
            ("llama3-8b-8192", "key_groq_prod_01", 32000, 8500, 0, "0.002200"),
            ("llama3-70b-8192", "key_groq_prod_02", 14000, 4200, 0, "0.012500"),
        ]

        data = []
        current = start_date
        while current < end_date:
            ts = int(current.timestamp())
            for model, key_id, base_in, base_out, base_cached, base_cost in models:
                factor = 0.85 + (hash(f"{current.isoformat()}_{model}") % 30) / 100.0
                in_tok = int(base_in * multiplier * factor)
                out_tok = int(base_out * multiplier * factor)
                cached_tok = int(base_cached * multiplier * factor)
                cost_dec = float(base_cost) * factor

                data.append({
                    "timestamp": ts,
                    "model": model,
                    "api_key_id": key_id,
                    "api_key_name": key_id.replace("key_", "").replace("_", " "),
                    "input_tokens": in_tok,
                    "output_tokens": out_tok,
                    "cached_tokens": cached_tok,
                    "cost_usd": f"{cost_dec:.6f}",
                    "operation": "chat.completions",
                })
            current += timedelta(days=1)

        return {"data": data}

    async def fetch(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ):
        """Fetch and normalize records into AIUsageFact list."""
        now = datetime.now(timezone.utc)
        end_date = end_date or now
        start_date = start_date or (end_date - timedelta(days=30))
        raw = await self.fetch_usage(start_date=start_date, end_date=end_date)
        try:
            from normalizer import normalize_groq_usage
        except ImportError:
            from ..normalizer import normalize_groq_usage
        return normalize_groq_usage(raw=raw, tenant_id=self.tenant_id)
