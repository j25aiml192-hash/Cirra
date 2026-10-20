from datetime import datetime, timezone
from typing import Any, Dict


def normalize_to_focus(provider: str, raw_dict: Dict[str, Any], tenant_id: str) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "tenant_id": tenant_id,
        "provider": provider.lower(),
        "service_name": raw_dict.get("service_name") or raw_dict.get("service", "Cloud Service"),
        "resource_id": raw_dict.get("resource_id", "res-unknown"),
        "billed_cost": float(raw_dict.get("cost", 0.0)),
        "effective_cost": float(raw_dict.get("effective_cost", raw_dict.get("cost", 0.0))),
        "currency": "USD",
        "tags": raw_dict.get("tags", {}),
        "inserted_at": now,
    }
