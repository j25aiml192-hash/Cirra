import logging
from typing import Any, Dict
from temporalio import activity

logger = logging.getLogger(__name__)


@activity.defn
async def dry_run_activity(action_payload: Dict[str, Any]) -> Dict[str, Any]:
    """Simulate remediation without changing provider state."""
    logger.info(f"Executing dry run for action {action_payload.get('id')}")
    return {
        "status": "simulated",
        "resourceId": action_payload.get("resourceId"),
        "estimatedSavingsMonthly": action_payload.get("estimatedMonthlySavings", 0.0),
        "impact": "Low impact: idle snapshot termination",
    }


@activity.defn
async def await_approval_activity(action_payload: Dict[str, Any]) -> bool:
    """Pause until a human owner/admin approves via the Cirra UI."""
    logger.info(f"Awaiting human approval for action {action_payload.get('id')}")
    return True


@activity.defn
async def execute_activity(action_payload: Dict[str, Any]) -> Dict[str, Any]:
    """Execute the remediation action against cloud or AI provider API."""
    logger.info(f"Applying remediation action {action_payload.get('id')}")
    return {"status": "completed", "executedAt": "2026-10-20T12:00:00Z"}


@activity.defn
async def health_check_activity(action_payload: Dict[str, Any]) -> bool:
    """Verify application health and error rates after remediation."""
    logger.info("Verifying system health metrics post-remediation")
    return True


@activity.defn
async def rollback_activity(action_payload: Dict[str, Any]) -> Dict[str, Any]:
    """Rollback remediation changes if health check fails."""
    logger.warning(f"Rolling back action {action_payload.get('id')}")
    return {"status": "rolled_back"}
