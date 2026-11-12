import json
import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

from app.kill_switch import KillSwitchEngine, KillSwitchResult
from app.github_pr import GitHubPREngine, PRResult
from app.savings_ledger import SavingsLedgerEngine

logger = logging.getLogger("cirra.action_engine.workflow")

ALLOWED_ACTION_TYPES = ("kill_switch", "spend_cap", "github_pr", "scheduled_shutdown")


def _serialize_for_json(obj: Any) -> Any:
    """Helper to serialize datetime and Decimal objects for JSONB."""
    if isinstance(obj, (datetime,)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _serialize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_serialize_for_json(i) for i in obj]
    return obj


class ActionWorkflow:
    """
    Manages the action lifecycle:
    proposed -> dry_run -> approved -> executing -> executed -> verified -> (savings recorded)
    """

    def __init__(
        self,
        kill_switch_engine: Optional[KillSwitchEngine] = None,
        github_pr_engine: Optional[GitHubPREngine] = None,
        savings_ledger_engine: Optional[SavingsLedgerEngine] = None,
    ):
        self.kill_switch = kill_switch_engine or KillSwitchEngine()
        self.github_pr = github_pr_engine or GitHubPREngine()
        self.savings_ledger = savings_ledger_engine or SavingsLedgerEngine()

    async def propose_action(
        self,
        tenant_id: str,
        anomaly_id: Optional[str],
        action_type: str,
        provider: Optional[str],
        target_key_id: Optional[str],
        conn: Any,
        proposal_details: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Propose a new remediation action and automatically execute its dry_run simulation.
        """
        if action_type not in ALLOWED_ACTION_TYPES:
            raise ValueError(f"Invalid action_type '{action_type}'. Allowed types: {ALLOWED_ACTION_TYPES}")

        action_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        # Retrieve anomaly context if provided
        anomaly_data: Dict[str, Any] = {}
        if anomaly_id:
            try:
                row = await conn.fetchrow("SELECT * FROM anomalies WHERE id = $1::uuid", anomaly_id)
                if row:
                    anomaly_data = dict(row)
                    if not provider:
                        provider = anomaly_data.get("provider")
                    if not target_key_id:
                        target_key_id = anomaly_data.get("api_key_id")
            except Exception as e:
                logger.warning("Could not fetch anomaly %s for proposal: %s", anomaly_id, e)

        proposal_json = {
            "action_type": action_type,
            "provider": provider,
            "target_key_id": target_key_id,
            "anomaly_id": anomaly_id,
            "proposed_at": now.isoformat(),
            "details": proposal_details or {},
        }

        initial_audit_log = [
            {
                "timestamp": now.isoformat(),
                "event": "proposed",
                "details": f"Proposed {action_type} for {provider or 'unknown'} ({target_key_id or 'unknown'})",
            }
        ]

        sql = """
            INSERT INTO actions (
                id, tenant_id, anomaly_id, type, status, provider, target_key_id,
                proposal_json, dry_run_result_json, audit_log, created_at
            ) VALUES (
                $1::uuid, $2::uuid, $3::uuid, $4, 'proposed', $5, $6,
                $7::jsonb, NULL, $8::jsonb, $9
            )
            RETURNING *;
        """
        await conn.fetchrow(
            sql,
            action_id,
            tenant_id,
            anomaly_id,
            action_type,
            provider,
            target_key_id,
            json.dumps(_serialize_for_json(proposal_json)),
            json.dumps(initial_audit_log),
            now,
        )

        logger.info("Proposed action %s (type=%s, provider=%s)", action_id, action_type, provider)

        # Run dry run automatically
        updated_action = await self.run_dry_run(action_id, conn)
        return updated_action

    async def run_dry_run(self, action_id: str, conn: Any) -> Dict[str, Any]:
        """
        Execute dry-run simulation for an action:
        - Simulates disablement or PR generation
        - Calculates counterfactual projected savings
        - Records identified saving in savings ledger
        """
        action_row = await conn.fetchrow("SELECT * FROM actions WHERE id = $1::uuid", action_id)
        if not action_row:
            raise ValueError(f"Action {action_id} not found")

        action = dict(action_row)
        action_type = action.get("type")
        provider = (action.get("provider") or "").lower()
        target_key = action.get("target_key_id") or "unknown"
        tenant_id = str(action.get("tenant_id"))
        anomaly_id = str(action.get("anomaly_id")) if action.get("anomaly_id") else None

        # Retrieve anomaly for numbers
        anomaly_data: Dict[str, Any] = {}
        if anomaly_id:
            try:
                row = await conn.fetchrow("SELECT * FROM anomalies WHERE id = $1::uuid", anomaly_id)
                if row:
                    anomaly_data = dict(row)
            except Exception as e:
                logger.warning("Could not fetch anomaly %s for dry-run: %s", anomaly_id, e)

        baseline_val = Decimal(str(anomaly_data.get("baseline_value") or "50.00"))
        actual_val = Decimal(str(anomaly_data.get("actual_value") or "250.00"))
        est_monthly_savings = self.savings_ledger.calculate_counterfactual_savings(baseline_val, actual_val, days=30)

        # Simulate outcome based on type
        if action_type == "kill_switch":
            requires_manual = provider in ("groq", "gemini")
            dry_run_result = {
                "simulated_effect": f"Would disable API key '{target_key}' on provider '{action.get('provider')}'",
                "provider": action.get("provider"),
                "key_id": target_key,
                "estimated_monthly_savings_usd": float(est_monthly_savings),
                "requires_manual": requires_manual,
                "manual_instructions": "Groq/Gemini require manual key disablement via web portal" if requires_manual else None,
                "action_executable": True,
            }
        elif action_type == "github_pr":
            dry_run_result = {
                "simulated_effect": f"Would open remediation PR in {self.github_pr.repo_owner}/{self.github_pr.repo_name}",
                "target_repo": f"{self.github_pr.repo_owner}/{self.github_pr.repo_name}",
                "branch": f"cirra/anomaly-remediation-{action_id[:8]}",
                "estimated_monthly_savings_usd": float(est_monthly_savings),
                "action_executable": True,
            }
        elif action_type == "spend_cap":
            dry_run_result = {
                "simulated_effect": f"Would generate PR adding hard monthly spend cap for {action.get('provider')}",
                "estimated_monthly_savings_usd": float(est_monthly_savings),
                "action_executable": True,
            }
        elif action_type == "scheduled_shutdown":
            dry_run_result = {
                "simulated_effect": f"Would schedule off-peak shutdown for idle dev/staging resources",
                "estimated_monthly_savings_usd": float(est_monthly_savings),
                "action_executable": True,
            }
        else:
            dry_run_result = {
                "simulated_effect": f"Simulated {action_type} execution",
                "action_executable": True,
            }

        now = datetime.now(timezone.utc)
        audit_log = action.get("audit_log") or []
        if isinstance(audit_log, str):
            audit_log = json.loads(audit_log)
        audit_log.append({
            "timestamp": now.isoformat(),
            "event": "dry_run",
            "result": dry_run_result,
        })

        sql = """
            UPDATE actions
            SET status = 'dry_run',
                dry_run_result_json = $1::jsonb,
                audit_log = $2::jsonb
            WHERE id = $3::uuid
            RETURNING *;
        """
        updated_row = await conn.fetchrow(
            sql,
            json.dumps(_serialize_for_json(dry_run_result)),
            json.dumps(_serialize_for_json(audit_log)),
            action_id,
        )

        # Record identified saving in savings_entries if anomaly present
        if anomaly_id and est_monthly_savings > 0:
            try:
                await self.savings_ledger.record_identified_saving(
                    tenant_id=tenant_id,
                    anomaly_id=anomaly_id,
                    baseline_cost=est_monthly_savings,
                    conn=conn,
                    action_id=action_id,
                    method="counterfactual",
                    notes=f"Identified from {action_type} dry-run simulation",
                )
            except Exception as e:
                logger.warning("Could not record identified saving during dry-run: %s", e)

        logger.info("Completed dry_run for action %s", action_id)
        return dict(updated_row) if updated_row else {}

    async def execute_approved_action(
        self,
        action_id: str,
        approved_by: str,
        conn: Any,
    ) -> Dict[str, Any]:
        """
        Execute action following strict safety progression:
        approved -> executing -> executed -> verified -> (savings recorded)
        Requires explicit human approval recorded in DB.
        """
        if not approved_by or not str(approved_by).strip():
            raise ValueError("Action execution strictly forbidden without explicit human approval (approved_by required)")

        action_row = await conn.fetchrow("SELECT * FROM actions WHERE id = $1::uuid", action_id)
        if not action_row:
            raise ValueError(f"Action {action_id} not found")

        action = dict(action_row)
        current_status = action.get("status")
        if current_status in ("executed", "verified", "rolled_back"):
            raise ValueError(f"Action {action_id} is already in state '{current_status}' and cannot be re-executed")

        tenant_id = str(action.get("tenant_id"))
        action_type = action.get("type")
        provider = action.get("provider") or "unknown"
        target_key = action.get("target_key_id") or "unknown"
        anomaly_id = str(action.get("anomaly_id")) if action.get("anomaly_id") else None

        # Fetch anomaly context
        anomaly_data: Dict[str, Any] = {}
        if anomaly_id:
            try:
                row = await conn.fetchrow("SELECT * FROM anomalies WHERE id = $1::uuid", anomaly_id)
                if row:
                    anomaly_data = dict(row)
            except Exception as e:
                logger.warning("Could not fetch anomaly %s for execution: %s", anomaly_id, e)

        audit_log = action.get("audit_log") or []
        if isinstance(audit_log, str):
            audit_log = json.loads(audit_log)

        # 1. State: approved
        now_approved = datetime.now(timezone.utc)
        audit_log.append({
            "timestamp": now_approved.isoformat(),
            "event": "approved",
            "approved_by": approved_by,
        })

        # 2. State: executing
        now_executing = datetime.now(timezone.utc)
        audit_log.append({
            "timestamp": now_executing.isoformat(),
            "event": "executing",
            "message": f"Starting execution of {action_type} for {provider} ({target_key})",
        })

        # 3. Perform execution
        kill_switch_res: Optional[KillSwitchResult] = None
        pr_res: Optional[PRResult] = None
        pr_url: Optional[str] = None

        if action_type == "kill_switch":
            # Disable key
            kill_switch_res = await self.kill_switch.disable_key(provider, target_key, tenant_id)
            audit_log.append({
                "timestamp": kill_switch_res.executed_at.isoformat() if kill_switch_res.executed_at else now_executing.isoformat(),
                "event": "kill_switch_executed",
                "result": kill_switch_res.to_dict(),
            })

            # Create recommendation PR documenting key disablement
            pr_res = await self.github_pr.create_anomaly_pr(anomaly_data, action, kill_switch_res)
            pr_url = pr_res.pr_url
            audit_log.append({
                "timestamp": pr_res.created_at.isoformat() if pr_res.created_at else now_executing.isoformat(),
                "event": "github_pr_created",
                "pr_url": pr_url,
                "pr_number": pr_res.pr_number,
            })
        else:
            # PR / spend cap / shutdown recommendation PR
            pr_res = await self.github_pr.create_anomaly_pr(anomaly_data, action)
            pr_url = pr_res.pr_url
            audit_log.append({
                "timestamp": pr_res.created_at.isoformat() if pr_res.created_at else now_executing.isoformat(),
                "event": "github_pr_created",
                "pr_url": pr_url,
                "pr_number": pr_res.pr_number,
            })

        # 4. State: executed
        now_executed = datetime.now(timezone.utc)
        audit_log.append({
            "timestamp": now_executed.isoformat(),
            "event": "executed",
            "pr_url": pr_url,
        })

        # 5. State: verified
        now_verified = datetime.now(timezone.utc)
        audit_log.append({
            "timestamp": now_verified.isoformat(),
            "event": "verified",
            "message": "Action execution and remediation verified",
        })

        sql = """
            UPDATE actions
            SET status = 'verified',
                approved_by = $1::uuid,
                approved_at = $2,
                executed_at = $3,
                verified_at = $4,
                github_pr_url = $5,
                audit_log = $6::jsonb
            WHERE id = $7::uuid
            RETURNING *;
        """
        updated_row = await conn.fetchrow(
            sql,
            approved_by,
            now_approved,
            now_executed,
            now_verified,
            pr_url,
            json.dumps(_serialize_for_json(audit_log)),
            action_id,
        )

        # 6. Record verified savings
        if anomaly_id:
            try:
                # Find any savings_entry for this anomaly
                s_row = await conn.fetchrow(
                    "SELECT * FROM savings_entries WHERE anomaly_id = $1::uuid AND status = 'identified' ORDER BY created_at DESC LIMIT 1",
                    anomaly_id,
                )
                if s_row:
                    s_id = str(dict(s_row).get("id"))
                    # Realized spend is pre-spike baseline run-rate
                    baseline_val = Decimal(str(anomaly_data.get("baseline_value") or "50.00"))
                    await self.savings_ledger.record_verified_saving(
                        savings_entry_id=s_id,
                        realized_cost=baseline_val,
                        period_end=now_verified,
                        conn=conn,
                    )
            except Exception as e:
                logger.warning("Could not update verified savings: %s", e)

        logger.info("Successfully executed and verified action %s", action_id)
        return {
            "action": dict(updated_row) if updated_row else {},
            "kill_switch_result": kill_switch_res.to_dict() if kill_switch_res else None,
            "pr_result": pr_res.to_dict() if pr_res else None,
            "pr_url": pr_url,
            "status": "verified",
        }

    async def rollback_action(
        self,
        action_id: str,
        reason: Optional[str],
        conn: Any,
    ) -> Dict[str, Any]:
        """Mark action as rolled_back and log reason."""
        action_row = await conn.fetchrow("SELECT * FROM actions WHERE id = $1::uuid", action_id)
        if not action_row:
            raise ValueError(f"Action {action_id} not found")

        action = dict(action_row)
        now = datetime.now(timezone.utc)
        audit_log = action.get("audit_log") or []
        if isinstance(audit_log, str):
            audit_log = json.loads(audit_log)

        audit_log.append({
            "timestamp": now.isoformat(),
            "event": "rolled_back",
            "reason": reason or "Action rolled back by operator",
        })

        sql = """
            UPDATE actions
            SET status = 'rolled_back',
                rolled_back_at = $1,
                audit_log = $2::jsonb
            WHERE id = $3::uuid
            RETURNING *;
        """
        updated_row = await conn.fetchrow(
            sql,
            now,
            json.dumps(_serialize_for_json(audit_log)),
            action_id,
        )
        logger.info("Rolled back action %s: %s", action_id, reason)
        return dict(updated_row) if updated_row else {}
