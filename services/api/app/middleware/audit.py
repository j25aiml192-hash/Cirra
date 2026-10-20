import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logger = logging.getLogger("cirra.audit")
logging.basicConfig(level=logging.INFO)


def log_audit_event(
    action: str,
    tenant_id: str,
    user_id: str,
    resource_type: str,
    resource_id: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """Audit log sensitive actions with tenant isolation. Never log credentials."""
    safe_metadata = dict(metadata or {})
    # Strip any potential sensitive fields
    for sensitive_key in ["credentials", "password", "secret", "token", "key", "credentials_encrypted"]:
        if sensitive_key in safe_metadata:
            safe_metadata[sensitive_key] = "[REDACTED]"

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "tenant_id": str(tenant_id),
        "user_id": str(user_id),
        "resource_type": resource_type,
        "resource_id": str(resource_id),
        "metadata": safe_metadata,
    }
    logger.info(f"AUDIT_EVENT: {event}")
