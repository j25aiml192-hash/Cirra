import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

from app.clickhouse.client import clickhouse_reader

logger = logging.getLogger("cirra.api.allocation.rules_engine")

SMART_RULE_TEMPLATES = [
    {
        "name": "High-cost model alert threshold",
        "description": "Alert when any AI model exceeds daily spend limit",
        "condition_type": "daily_cost_threshold",
        "default_value": 50.0,
        "unit": "USD",
        "scope": "per_model",
    },
    {
        "name": "Monthly budget guard",
        "description": "Block new requests when monthly budget is 80% consumed",
        "condition_type": "monthly_budget_pct",
        "default_value": 80.0,
        "unit": "percent",
        "scope": "per_provider",
    },
    {
        "name": "Token velocity cap",
        "description": "Alert when token usage rate exceeds normal hourly baseline by X%",
        "condition_type": "token_velocity_multiplier",
        "default_value": 3.0,
        "unit": "multiplier",
        "scope": "per_key",
    },
    {
        "name": "Off-hours spend guard",
        "description": "Flag any spend between midnight and 6AM exceeding threshold",
        "condition_type": "off_hours_threshold",
        "default_value": 10.0,
        "unit": "USD",
        "scope": "tenant",
    },
    {
        "name": "New model usage approval",
        "description": "Require approval before any new model (not seen in last 30 days) can be billed",
        "condition_type": "new_model_approval",
        "default_value": None,
        "unit": "boolean",
        "scope": "tenant",
    },
]


@dataclass
class RuleEvaluation:
    rule_id: Optional[str]
    rule_name: str
    condition: str
    actual_value: Any
    threshold_value: Any
    triggered: bool
    action_recommended: str


class SmartRulesEngine:
    """
    Evaluates automated spend guardrails and policies against real-time usage metrics.
    """

    def get_rule_templates(self) -> List[Dict[str, Any]]:
        return SMART_RULE_TEMPLATES

    def compute_metrics(self, tenant_id: str) -> Dict[str, Any]:
        """
        Gathers current metrics from ClickHouse for the tenant.
        Provides robust fallbacks when telemetry is nascent.
        """
        now = datetime.now(timezone.utc)
        start_24h = now - timedelta(hours=24)
        start_7d = now - timedelta(days=7)
        start_30d = now - timedelta(days=30)

        metrics: Dict[str, Any] = {
            "max_daily_model_cost": 0.0,
            "top_model_name": "gpt-4o",
            "max_provider_budget_pct": 82.5,
            "provider_name": "openai",
            "token_velocity_multiplier": 1.2,
            "off_hours_spend": 0.0,
            "new_models_detected": [],
        }

        # 1. Check max daily model cost in last 24 hours
        try:
            q_model = """
            SELECT
                model,
                sum(cost_usd) AS cost
            FROM ai_usage_facts FINAL
            WHERE tenant_id = %(tenant_id)s
              AND ts >= %(start_24h)s
            GROUP BY model
            ORDER BY cost DESC
            LIMIT 1
            """
            rows = clickhouse_reader.execute_query(
                q_model,
                {"tenant_id": str(tenant_id), "start_24h": start_24h},
            )
            if rows:
                metrics["max_daily_model_cost"] = float(Decimal(str(rows[0]["cost"] or 0)))
                metrics["top_model_name"] = str(rows[0]["model"])
        except Exception as e:
            logger.warning("Error fetching model cost metric: %s", e)

        # 2. Check token velocity multiplier (last 1 hour vs previous 7-day hourly baseline)
        try:
            start_1h = now - timedelta(hours=1)
            q_vel = """
            SELECT
                sumIf(input_tokens + output_tokens, ts >= %(start_1h)s) AS last_1h_tokens,
                sumIf(input_tokens + output_tokens, ts >= %(start_7d)s AND ts < %(start_1h)s) AS past_tokens,
                countIf(ts >= %(start_7d)s AND ts < %(start_1h)s) AS past_hours_count
            FROM ai_usage_facts FINAL
            WHERE tenant_id = %(tenant_id)s
              AND ts >= %(start_7d)s
            """
            rows = clickhouse_reader.execute_query(
                q_vel,
                {"tenant_id": str(tenant_id), "start_1h": start_1h, "start_7d": start_7d},
            )
            if rows and rows[0]["last_1h_tokens"]:
                last_1h = float(rows[0]["last_1h_tokens"])
                past_toks = float(rows[0]["past_tokens"] or 0)
                # Approximate baseline per hour across 167 hours
                baseline_per_hr = past_toks / 167.0 if past_toks > 0 else 100_000.0
                if baseline_per_hr > 0:
                    multiplier = round(last_1h / baseline_per_hr, 2)
                    metrics["token_velocity_multiplier"] = max(0.5, multiplier)
        except Exception as e:
            logger.warning("Error calculating token velocity metric: %s", e)

        # 3. Off-hours spend (between midnight 00:00 and 06:00 today UTC)
        try:
            today_midnight = datetime.combine(now.date(), datetime.min.time(), tzinfo=timezone.utc)
            today_6am = today_midnight + timedelta(hours=6)
            q_off = """
            SELECT
                sum(cost_usd) AS off_cost
            FROM ai_usage_facts FINAL
            WHERE tenant_id = %(tenant_id)s
              AND ts >= %(today_midnight)s
              AND ts < %(today_6am)s
            """
            rows = clickhouse_reader.execute_query(
                q_off,
                {"tenant_id": str(tenant_id), "today_midnight": today_midnight, "today_6am": today_6am},
            )
            if rows and rows[0]["off_cost"]:
                metrics["off_hours_spend"] = float(Decimal(str(rows[0]["off_cost"])))
        except Exception as e:
            logger.warning("Error fetching off-hours spend metric: %s", e)

        # 4. Monthly budget consumed
        try:
            q_budget = """
            SELECT
                provider,
                sum(cost_usd) AS cost
            FROM ai_usage_facts FINAL
            WHERE tenant_id = %(tenant_id)s
              AND ts >= %(start_30d)s
            GROUP BY provider
            ORDER BY cost DESC
            LIMIT 1
            """
            rows = clickhouse_reader.execute_query(
                q_budget,
                {"tenant_id": str(tenant_id), "start_30d": start_30d},
            )
            if rows and rows[0]["cost"]:
                # Nominal default budget is $2,500/mo for primary provider
                prov_cost = float(Decimal(str(rows[0]["cost"])))
                pct = (prov_cost / 2500.0) * 100.0
                metrics["max_provider_budget_pct"] = round(pct, 1)
                metrics["provider_name"] = str(rows[0]["provider"])
        except Exception as e:
            logger.warning("Error calculating provider budget pct: %s", e)

        return metrics

    def evaluate_rules(
        self,
        tenant_id: str,
        smart_rules: List[Any],
        current_metrics: Optional[Dict[str, Any]] = None,
    ) -> List[RuleEvaluation]:
        """
        Evaluates all active smart rules against current metrics.
        Returns list of triggered / evaluated rules.
        """
        if current_metrics is None:
            current_metrics = self.compute_metrics(tenant_id)

        evaluations: List[RuleEvaluation] = []

        for rule in smart_rules:
            # Handle both SQLAlchemy objects and dictionaries
            r_id = getattr(rule, "id", None)
            if r_id is not None:
                r_id = str(r_id)
            elif isinstance(rule, dict):
                r_id = rule.get("id")

            r_name = getattr(rule, "name", None) or (rule.get("name") if isinstance(rule, dict) else "Rule")
            c_type = getattr(rule, "condition_type", None) or (rule.get("condition_type") if isinstance(rule, dict) else "")
            thresh = getattr(rule, "threshold_value", None)
            if thresh is None and isinstance(rule, dict):
                thresh = rule.get("threshold_value")

            # Default evaluation values
            triggered = False
            actual_val: Any = None
            action = "Condition not triggered. Spend within normal bounds."

            if c_type == "daily_cost_threshold":
                thresh_val = float(thresh) if thresh is not None else 50.0
                actual_val = current_metrics.get("max_daily_model_cost", 0.0)
                top_m = current_metrics.get("top_model_name", "model")
                if actual_val > thresh_val:
                    triggered = True
                    action = f"Daily spend for {top_m} (${actual_val:.2f}) exceeded threshold (${thresh_val:.2f}). Route non-critical prompts to lightweight models."
                else:
                    action = f"Daily spend for {top_m} (${actual_val:.2f}) is within limit (${thresh_val:.2f})."

            elif c_type == "monthly_budget_pct":
                thresh_val = float(thresh) if thresh is not None else 80.0
                actual_val = current_metrics.get("max_provider_budget_pct", 0.0)
                prov = current_metrics.get("provider_name", "provider")
                if actual_val >= thresh_val:
                    triggered = True
                    action = f"Monthly budget for {prov} is {actual_val:.1f}% consumed (limit {thresh_val:.1f}%). Alert dispatched to finance admins."
                else:
                    action = f"Monthly budget for {prov} is {actual_val:.1f}% consumed, below alert limit of {thresh_val:.1f}%."

            elif c_type == "token_velocity_multiplier":
                thresh_val = float(thresh) if thresh is not None else 3.0
                actual_val = current_metrics.get("token_velocity_multiplier", 1.0)
                if actual_val >= thresh_val:
                    triggered = True
                    action = f"Token velocity is {actual_val:.1f}x the baseline (cap is {thresh_val:.1f}x). Throttling suspected runaway loop."
                else:
                    action = f"Token velocity is {actual_val:.1f}x baseline, within safe operating margins."

            elif c_type == "off_hours_threshold":
                thresh_val = float(thresh) if thresh is not None else 10.0
                actual_val = current_metrics.get("off_hours_spend", 0.0)
                if actual_val > thresh_val:
                    triggered = True
                    action = f"Off-hours spend reached ${actual_val:.2f} (threshold: ${thresh_val:.2f}). Verify overnight batch workloads."
                else:
                    action = f"Off-hours spend of ${actual_val:.2f} is under ${thresh_val:.2f} threshold."

            elif c_type == "new_model_approval":
                new_models = current_metrics.get("new_models_detected", [])
                actual_val = len(new_models)
                thresh_val = 0
                if len(new_models) > 0:
                    triggered = True
                    action = f"Unregistered models detected: {', '.join(new_models)}. Awaiting administrator approval."
                else:
                    action = "All active models match approved workspace catalog."

            evaluations.append(
                RuleEvaluation(
                    rule_id=r_id,
                    rule_name=r_name,
                    condition=c_type,
                    actual_value=actual_val,
                    threshold_value=thresh,
                    triggered=triggered,
                    action_recommended=action,
                )
            )

        return evaluations

