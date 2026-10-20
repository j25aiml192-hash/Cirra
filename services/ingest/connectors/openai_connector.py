import asyncio
import logging
import os
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("cirra.ingest.openai")

ALLOWED_ENDPOINTS = {
    "https://api.openai.com/v1/organization/usage/completions",
    "https://api.openai.com/v1/organization/costs",
    "https://api.openai.com/v1/models",
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


class OpenAIConnector:
    def __init__(self, credentials: Dict[str, Any]):
        self.api_key = credentials.get("api_key") or credentials.get("secret_key", "")
        self.org_id = credentials.get("organization_id") or credentials.get("org_id")
        self.mock_mode = (
            os.getenv("INGEST_MOCK", "false").lower() in ("true", "1")
            or "mock" in self.api_key.lower()
            or "test" in self.api_key.lower()
            or not self.api_key
        )

    async def fetch_usage(
        self,
        start_date: datetime,
        end_date: datetime,
        max_retries: int = 4,
    ) -> Dict[str, Any]:
        """Fetch OpenAI usage and cost data with pagination, rate limiting backoff, and read-only safety."""
        masked_key = mask_secret(self.api_key)
        logger.info(f"OpenAI fetch_usage called for window {start_date.isoformat()} to {end_date.isoformat()} (key: {masked_key})")

        if self.mock_mode:
            logger.info("OpenAIConnector running in MOCK mode. Returning recorded fixtures.")
            return self._generate_mock_results(start_date, end_date)

        start_ts = int(start_date.timestamp())
        end_ts = int(end_date.timestamp())

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if self.org_id:
            headers["OpenAI-Organization"] = self.org_id

        all_records: List[Dict[str, Any]] = []
        url = "https://api.openai.com/v1/organization/usage/completions"
        params: Dict[str, Any] = {
            "start_time": start_ts,
            "end_time": end_ts,
            "limit": 100,
            "group_by": ["snapshot_id", "api_key_id"],
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            while url:
                assert_read_only_request("GET", url)
                response = None
                for attempt in range(max_retries):
                    try:
                        resp = await client.get(url, headers=headers, params=params)
                        if resp.status_code == 429:
                            backoff = (2 ** attempt) + random.uniform(0.1, 0.5)
                            logger.warning(f"OpenAI rate limited (429). Retrying in {backoff:.2f}s...")
                            await asyncio.sleep(backoff)
                            continue
                        elif resp.status_code >= 500:
                            backoff = (2 ** attempt) + random.uniform(0.1, 0.5)
                            logger.warning(f"OpenAI server error ({resp.status_code}). Retrying in {backoff:.2f}s...")
                            await asyncio.sleep(backoff)
                            continue
                        resp.raise_for_status()
                        response = resp.json()
                        break
                    except httpx.RequestError as exc:
                        if attempt == max_retries - 1:
                            logger.error(f"Failed to fetch OpenAI usage after {max_retries} attempts: {type(exc).__name__}")
                            raise
                        backoff = (2 ** attempt) + random.uniform(0.1, 0.5)
                        await asyncio.sleep(backoff)

                if not response:
                    raise RuntimeError("Failed to receive valid response from OpenAI after retries")

                data = response.get("data", [])
                all_records.extend(data)

                # Check pagination
                next_page = response.get("next_page")
                if next_page:
                    params["after"] = next_page
                else:
                    break

        return {"data": all_records}

    def _generate_mock_results(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Generate realistic synthetic OpenAI usage fixtures."""
        data = []
        models = [
            ("gpt-4o", "key_prod_app_01", 12000, 3500, 2000, "0.112500"),
            ("gpt-4o-mini", "key_batch_worker_02", 45000, 15000, 5000, "0.015750"),
            ("text-embedding-3-small", "key_rag_indexer_03", 80000, 0, 0, "0.001600"),
            ("o1-preview", "key_reasoning_lab_04", 5000, 2000, 0, "0.195000"),
        ]

        current = start_date
        while current < end_date:
            ts = int(current.timestamp())
            for model, key_id, base_in, base_out, base_cached, cost in models:
                # Add slight variability
                factor = 0.8 + (hash(f"{current.isoformat()}_{model}") % 40) / 100.0
                in_tok = int(base_in * factor)
                out_tok = int(base_out * factor)
                cached_tok = int(base_cached * factor)
                cost_dec = float(cost) * factor

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
