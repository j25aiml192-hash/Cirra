import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger("cirra.action_engine.savings_ledger")


class SavingsLedgerEngine:
    """Computes and tracks identified and verified cost savings in the savings ledger."""

    def calculate_counterfactual_savings(
        self,
        baseline_daily_cost: Union[Decimal, float, str, int],
        actual_daily_cost: Union[Decimal, float, str, int],
        days: int = 30,
    ) -> Decimal:
        """
        Calculates counterfactual savings.
        Avoided excess spend = abs(actual_daily_cost - baseline_daily_cost) * days.
        """
        b = Decimal(str(baseline_daily_cost))
        a = Decimal(str(actual_daily_cost))
        d = Decimal(str(days))
        diff = abs(a - b)
        return round(diff * d, 2)

    def calculate_unit_cost_savings(
        self,
        baseline_cost_per_token: Union[Decimal, float, str],
        new_cost_per_token: Union[Decimal, float, str],
        monthly_token_volume: Union[Decimal, int, float, str],
    ) -> Decimal:
        """
        Calculates unit cost savings:
        (baseline_cost_per_token - new_cost_per_token) * monthly_token_volume.
        """
        b = Decimal(str(baseline_cost_per_token))
        n = Decimal(str(new_cost_per_token))
        v = Decimal(str(monthly_token_volume))
        savings = (b - n) * v
        return max(Decimal("0.00"), round(savings, 2))

    async def record_identified_saving(
        self,
        tenant_id: str,
        anomaly_id: Optional[str],
        baseline_cost: Union[Decimal, float, str, int],
        conn: Any,
        action_id: Optional[str] = None,
        method: str = "counterfactual",
        confidence: str = "estimated",
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Records an identified saving entry into savings_entries table.
        Initial status: 'identified'.
        """
        entry_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        baseline = Decimal(str(baseline_cost))

        # Check constraint validation
        if method not in ("unit_cost", "counterfactual"):
            method = "counterfactual"
        if confidence not in ("exact", "estimated", "approximate"):
            confidence = "estimated"

        sql = """
            INSERT INTO savings_entries (
                id, tenant_id, action_id, anomaly_id, method, baseline_cost,
                period_start, currency, confidence, status, notes, created_at
            ) VALUES (
                $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6,
                $7, 'USD', $8, 'identified', $9, $10
            )
            RETURNING *;
        """
        try:
            row = await conn.fetchrow(
                sql,
                entry_id,
                tenant_id,
                action_id,
                anomaly_id,
                method,
                baseline,
                now,
                confidence,
                notes or "Identified by Cirra Action Engine",
                now,
            )
            logger.info("Recorded identified saving %s for tenant %s: $%s", entry_id, tenant_id, baseline)
            return dict(row) if row else {"id": entry_id, "status": "identified", "baseline_cost": str(baseline)}
        except Exception as e:
            logger.error("Failed to record identified saving in DB: %s", str(e), exc_info=True)
            return {
                "id": entry_id,
                "tenant_id": tenant_id,
                "action_id": action_id,
                "anomaly_id": anomaly_id,
                "method": method,
                "baseline_cost": str(baseline),
                "status": "identified",
                "notes": notes,
                "created_at": now.isoformat(),
            }

    async def record_verified_saving(
        self,
        savings_entry_id: str,
        realized_cost: Union[Decimal, float, str, int],
        period_end: Optional[datetime],
        conn: Any,
    ) -> Dict[str, Any]:
        """
        Records a verified saving entry into savings_entries table.
        Status: 'verified'.
        """
        now = period_end or datetime.now(timezone.utc)
        realized = Decimal(str(realized_cost))

        sql = """
            UPDATE savings_entries
            SET status = 'verified',
                realized_cost = $1,
                period_end = $2
            WHERE id = $3::uuid
            RETURNING *;
        """
        try:
            row = await conn.fetchrow(sql, realized, now, savings_entry_id)
            logger.info("Recorded verified saving %s: realized $%s", savings_entry_id, realized)
            return dict(row) if row else {"id": savings_entry_id, "status": "verified", "realized_cost": str(realized)}
        except Exception as e:
            logger.error("Failed to update verified saving in DB: %s", str(e), exc_info=True)
            return {
                "id": savings_entry_id,
                "status": "verified",
                "realized_cost": str(realized),
                "period_end": now.isoformat(),
            }

    async def list_savings_with_totals(
        self,
        tenant_id: str,
        conn: Any,
    ) -> Dict[str, Any]:
        """
        Lists all savings_entries for tenant with totals:
        {
          identified_total: Decimal,
          approved_total: Decimal,
          verified_total: Decimal,
          entries: List[SavingsEntry]
        }
        """
        sql = """
            SELECT * FROM savings_entries
            WHERE tenant_id = $1::uuid
            ORDER BY created_at DESC;
        """
        try:
            rows = await conn.fetch(sql, tenant_id)
            entries = [dict(r) for r in rows]
        except Exception as e:
            logger.error("Failed to list savings from DB: %s", str(e))
            entries = []

        identified_total = Decimal("0.00")
        approved_total = Decimal("0.00")
        verified_total = Decimal("0.00")

        for e in entries:
            st = e.get("status")
            baseline = Decimal(str(e.get("baseline_cost") or 0))
            realized = Decimal(str(e.get("realized_cost") or 0))

            if st == "identified":
                identified_total += baseline
            elif st == "approved":
                approved_total += baseline
            elif st in ("verified", "realized"):
                # Net verified savings
                net = max(Decimal("0.00"), baseline - realized) if realized > 0 else baseline
                verified_total += net

        return {
            "identified_total": round(identified_total, 2),
            "approved_total": round(approved_total, 2),
            "verified_total": round(verified_total, 2),
            "entries": entries,
        }
