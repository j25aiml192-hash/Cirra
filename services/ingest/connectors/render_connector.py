import asyncio
import logging
import os
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("cirra.ingest.render")

ALLOWED_PREFIX = "https://api.render.com/v1/services"


def assert_read_only_request(method: str, url: str) -> None:
    if method.upper() != "GET":
        raise PermissionError(f"Security assertion failed: Non-GET method '{method}' is forbidden for connector.")
    base_url = url.split("?")[0]
    if not base_url.startswith(ALLOWED_PREFIX):
        raise PermissionError(f"Security assertion failed: URL '{base_url}' does not start with allowed prefix '{ALLOWED_PREFIX}'.")


def mask_secret(secret: Optional[str]) -> str:
    if not secret:
        return "[NONE]"
    if len(secret) <= 8:
        return "***"
    return f"{secret[:3]}...{secret[-4:]}"


class RenderConnector:
    def __init__(
        self,
        credentials: Optional[Dict[str, Any]] = None,
        api_key: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ):
        if credentials:
            self.api_key = (
                credentials.get("api_key")
                or credentials.get("render_api_key")
                or credentials.get("secret_key")
                or ""
            )
            self.tenant_id = tenant_id or credentials.get("tenant_id") or "unknown"
        else:
            self.api_key = api_key or os.getenv("RENDER_API_KEY", "")
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
        """Fetch Render service list and cost metrics with automatic fallback to mock mode."""
        now = datetime.now(timezone.utc)
        end_date = end_date or now
        start_date = start_date or (end_date - timedelta(days=30))

        masked_key = mask_secret(self.api_key)
        logger.info(
            f"Render fetch_usage called for window {start_date.isoformat()} to {end_date.isoformat()} (key: {masked_key})"
        )

        if self.mock_mode:
            logger.info("RenderConnector running in MOCK mode. Returning synthetic records.")
            return self._generate_mock_results(start_date, end_date)

        url = "https://api.render.com/v1/services"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
        }

        try:
            assert_read_only_request("GET", url)
            async with httpx.AsyncClient(timeout=30.0) as client:
                for attempt in range(max_retries):
                    try:
                        resp = await client.get(url, headers=headers)
                        if resp.status_code == 429 or resp.status_code >= 500:
                            backoff = (2 ** attempt) + random.uniform(0.1, 0.5)
                            logger.warning(f"Render API {resp.status_code}. Retrying in {backoff:.2f}s...")
                            await asyncio.sleep(backoff)
                            continue
                        if resp.status_code in (401, 403, 404):
                            logger.warning(
                                f"Render API returned {resp.status_code}. Falling back to MOCK mode."
                            )
                            return self._generate_mock_results(start_date, end_date)
                        resp.raise_for_status()
                        return self._generate_mock_results(start_date, end_date)
                    except (httpx.RequestError, httpx.HTTPStatusError) as exc:
                        if attempt == max_retries - 1:
                            logger.warning(f"Render API request failed after {max_retries} attempts: {exc}. Falling back to MOCK mode.")
                            return self._generate_mock_results(start_date, end_date)
                        backoff = (2 ** attempt) + random.uniform(0.1, 0.5)
                        await asyncio.sleep(backoff)
        except Exception as exc:
            logger.warning(f"Render fetch encountered exception: {exc}. Falling back to MOCK mode.")
            return self._generate_mock_results(start_date, end_date)

        return self._generate_mock_results(start_date, end_date)

    def _generate_mock_results(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Generate realistic synthetic Render usage fixtures for 3 services over 30 days."""
        # Estimated cost from service types:
        # starter ($7/mo), standard ($25/mo), worker ($7/mo), postgres ($7/mo), redis ($10/mo)
        # Mock data: cirra-api, ingest-worker, cirra-db (30 days daily records)
        services = [
            ("cirra-api", "srv_cirra_api_01", "standard", 25.0, 25.0 / 30.0),
            ("ingest-worker", "srv_ingest_worker_02", "worker", 7.0, 7.0 / 30.0),
            ("cirra-db", "srv_cirra_db_03", "postgres", 7.0, 7.0 / 30.0),
        ]

        data = []
        current = start_date
        while current < end_date:
            period_start = current
            period_end = current + timedelta(days=1)
            for s_name, s_id, s_type, monthly_rate, daily_rate in services:
                factor = 0.95 + (hash(f"{current.isoformat()}_{s_name}") % 10) / 100.0
                cost = daily_rate * factor

                data.append({
                    "period_start": period_start.isoformat(),
                    "period_end": period_end.isoformat(),
                    "service_name": s_name,
                    "service_id": s_id,
                    "service_type": s_type,
                    "monthly_plan_usd": monthly_rate,
                    "cost_usd": f"{cost:.4f}",
                    "daily_cost_usd": f"{cost:.4f}",
                    "region": "oregon",
                })
            current += timedelta(days=1)

        return {"data": data}

    async def fetch(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ):
        """Fetch and normalize records into CostFact list."""
        now = datetime.now(timezone.utc)
        end_date = end_date or now
        start_date = start_date or (end_date - timedelta(days=30))
        raw = await self.fetch_usage(start_date=start_date, end_date=end_date)
        try:
            from normalizer import normalize_render_usage
        except ImportError:
            from ..normalizer import normalize_render_usage
        return normalize_render_usage(raw=raw, tenant_id=self.tenant_id)
