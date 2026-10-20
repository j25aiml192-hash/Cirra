from datetime import timedelta
from typing import Any, Dict
from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from src.activities.action_activities import (
        dry_run_activity,
        await_approval_activity,
        execute_activity,
        health_check_activity,
        rollback_activity,
    )


@workflow.defn
class ActionWorkflow:
    """
    Temporal workflow orchestrating automated or human-in-the-loop cost remediation.
    Workflow Steps:
    1. Dry Run Simulation
    2. Await Human Approval (Human-in-the-Loop)
    3. Execute Remediation
    4. Health Check Post-Execution
    5. Rollback on Failure
    """

    @workflow.run
    async def run(self, action_payload: Dict[str, Any]) -> Dict[str, Any]:
        # 1. Dry run
        dry_run_result = await workflow.execute_activity(
            dry_run_activity,
            action_payload,
            start_to_close_timeout=timedelta(minutes=5),
        )

        # 2. Await human approval
        approved = await workflow.execute_activity(
            await_approval_activity,
            action_payload,
            start_to_close_timeout=timedelta(days=7),
        )

        if not approved:
            return {"status": "rejected", "actionId": action_payload.get("id")}

        # 3. Execute remediation
        exec_result = await workflow.execute_activity(
            execute_activity,
            action_payload,
            start_to_close_timeout=timedelta(minutes=10),
        )

        # 4. Post-action health check
        healthy = await workflow.execute_activity(
            health_check_activity,
            action_payload,
            start_to_close_timeout=timedelta(minutes=5),
        )

        # 5. Rollback if unhealthy
        if not healthy:
            rollback_res = await workflow.execute_activity(
                rollback_activity,
                action_payload,
                start_to_close_timeout=timedelta(minutes=10),
            )
            return {"status": "rolled_back", "details": rollback_res}

        return {"status": "completed", "actionId": action_payload.get("id"), "execution": exec_result}
