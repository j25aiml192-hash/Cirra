import logging
from typing import Any, Dict, Optional

logger = logging.getLogger("cirra.ingest.anthropic")


def mask_secret(secret: Optional[str]) -> str:
    if not secret:
        return "[NONE]"
    if len(secret) <= 8:
        return "***"
    return f"{secret[:3]}...{secret[-4:]}"


class AnthropicConnector:
    """
    Anthropic connector.
    Inspects key type and checks whether programmatic usage APIs are available.
    Standard keys (sk-ant-api03-*) do not expose a programmatic /v1/usage endpoint.
    Per specification: Do not fake data. Mark with clear status and document gap.
    """

    def __init__(self, credentials: Dict[str, Any]):
        self.api_key = credentials.get("api_key") or credentials.get("secret_key", "")
        self.admin_key = credentials.get("admin_key")

    def check_capabilities(self) -> Dict[str, Any]:
        masked = mask_secret(self.api_key)
        logger.info(f"Checking Anthropic telemetry capabilities for key: {masked}")

        # Check if an admin key or programmatic usage capability is provided
        if not self.admin_key:
            return {
                "supported": False,
                "status": "gap_manual_export_required",
                "reason": (
                    "Anthropic standard API keys do not support programmatic /v1/usage telemetry. "
                    "Organization Admin Console export or Bedrock CUR billing is required."
                ),
            }

        # If admin key is present in future revisions:
        return {
            "supported": True,
            "status": "connected",
            "reason": None,
        }

    async def fetch_usage(self, start_date, end_date):
        capability = self.check_capabilities()
        if not capability["supported"]:
            logger.warning(
                f"Cannot ingest live Anthropic usage: {capability['reason']} (status: {capability['status']})"
            )
            # Never fabricate fake data
            return {
                "records": [],
                "status": capability["status"],
                "error": capability["reason"],
            }

        return {"records": [], "status": "connected", "error": None}
