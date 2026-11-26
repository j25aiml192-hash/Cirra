import asyncio
import logging
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

from app.clickhouse.client import clickhouse_reader
from app.services.allocation.model_catalog import (
    get_model_info,
    get_cheaper_alternatives,
)

logger = logging.getLogger("cirra.api.allocation.recommender")

AI_PROVIDERS = {"openai", "anthropic", "groq", "gemini"}


@dataclass
class ModelSwapRecommendation:
    current_provider: str
    current_model: str
    current_monthly_cost: float
    recommended_provider: str
    recommended_model: str
    projected_monthly_cost: float
    monthly_savings: float
    savings_pct: float
    quality_tier_change: str  # 'same'|'downgrade'|'upgrade'
    trade_off: str
    confidence: str  # 'high'|'medium'|'low'


@dataclass
class ScalingRecommendation:
    provider: str
    service: str
    current_weekly_cost: float
    avg_weekly_growth_pct: float
    recommendation_type: str  # 'optimization'|'horizontal_scaling'|'vertical_scaling'
    recommendation: str
    estimated_monthly_impact: float
    priority: str  # 'high'|'medium'|'low'


class AllocationRecommender:
    """
    Engine to identify model optimization opportunities and cost-scaling anomalies.
    """

    async def generate_model_swap_recommendations(
        self,
        tenant_id: str,
        lookback_days: int = 30,
    ) -> List[ModelSwapRecommendation]:
        """
        For each (provider, model) in ai_usage_facts:
        1. Get monthly spend and token volumes.
        2. Query cheaper alternatives from model catalog.
        3. Project monthly savings and filter minimum $10/mo savings.
        4. Sort by monthly_savings DESC.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=lookback_days)

        query = """
        SELECT
            provider,
            model,
            sum(cost_usd) AS monthly_cost,
            sum(input_tokens) AS total_input_tokens,
            sum(output_tokens) AS total_output_tokens,
            count(*) AS call_count
        FROM ai_usage_facts FINAL
        WHERE tenant_id = %(tenant_id)s
          AND ts >= %(cutoff)s
        GROUP BY provider, model
        """

        try:
            rows = await asyncio.to_thread(
                clickhouse_reader.execute_query,
                query,
                {"tenant_id": str(tenant_id), "cutoff": cutoff},
            )
        except Exception as e:
            logger.error("Failed to query ai_usage_facts: %s", e)
            rows = []

        recommendations: List[ModelSwapRecommendation] = []

        for row in rows:
            provider = str(row["provider"]).lower()
            model = str(row["model"])
            monthly_cost = float(Decimal(str(row["monthly_cost"] or 0)))
            input_tokens = int(row["total_input_tokens"] or 0)
            output_tokens = int(row["total_output_tokens"] or 0)
            call_count = int(row["call_count"] or 0)

            if monthly_cost <= 0 or (input_tokens == 0 and output_tokens == 0):
                continue

            cheaper_alts = get_cheaper_alternatives(provider, model)
            for alt in cheaper_alts:
                alt_prov = alt["provider"]
                alt_model = alt["model"]
                alt_info = get_model_info(alt_prov, alt_model)
                if not alt_info:
                    continue

                alt_in_rate = alt_info["input_per_1m_tokens"]
                alt_out_rate = alt_info["output_per_1m_tokens"]

                projected_cost = (
                    (input_tokens / 1_000_000.0) * alt_in_rate
                    + (output_tokens / 1_000_000.0) * alt_out_rate
                )
                monthly_savings = monthly_cost - projected_cost
                savings_pct = (monthly_savings / monthly_cost) * 100.0

                if monthly_savings > 10.0:
                    # Determine confidence level
                    if call_count >= 100 and savings_pct >= 25.0:
                        confidence = "high"
                    elif call_count >= 20:
                        confidence = "medium"
                    else:
                        confidence = "low"

                    recommendations.append(
                        ModelSwapRecommendation(
                            current_provider=provider,
                            current_model=model,
                            current_monthly_cost=round(monthly_cost, 2),
                            recommended_provider=alt_prov,
                            recommended_model=alt_model,
                            projected_monthly_cost=round(projected_cost, 2),
                            monthly_savings=round(monthly_savings, 2),
                            savings_pct=round(savings_pct, 1),
                            quality_tier_change=alt.get("quality_tier_change", "same"),
                            trade_off=alt.get("trade_off_description", ""),
                            confidence=confidence,
                        )
                    )

        # Sort recommendations by monthly savings descending
        recommendations.sort(key=lambda r: r.monthly_savings, reverse=True)
        return recommendations

    async def generate_scaling_recommendations(
        self,
        tenant_id: str,
        lookback_days: int = 30,
    ) -> List[ScalingRecommendation]:
        """
        Analyzes cost growth trends per provider/service.
        Calculates week-over-week growth rate over 4 weeks (28 days).
        Flags services with >20% average weekly growth.
        """
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=28)

        query = """
        SELECT
            provider,
            service_name,
            toDate(charge_period_start) AS day,
            sum(effective_cost) AS daily_cost
        FROM cost_facts FINAL
        WHERE tenant_id = %(tenant_id)s
          AND charge_period_start >= %(start_date)s
        GROUP BY provider, service_name, day
        ORDER BY day ASC
        """

        try:
            rows = await asyncio.to_thread(
                clickhouse_reader.execute_query,
                query,
                {"tenant_id": str(tenant_id), "start_date": start_date},
            )
        except Exception as e:
            logger.error("Failed to query cost_facts for scaling trends: %s", e)
            rows = []

        # Group daily costs by (provider, service_name)
        service_history: Dict[tuple, Dict[str, float]] = {}
        for r in rows:
            key = (str(r["provider"]), str(r["service_name"]))
            day_str = str(r["day"])
            c = float(Decimal(str(r["daily_cost"] or 0)))
            if key not in service_history:
                service_history[key] = {}
            service_history[key][day_str] = c

        scaling_recs: List[ScalingRecommendation] = []

        # 4 weeks buckets:
        # week 1: days 1-7 (earliest 28 to 22 days ago)
        # week 2: days 8-14 (21 to 15 days ago)
        # week 3: days 15-21 (14 to 8 days ago)
        # week 4: days 22-28 (7 to 1 days ago - most recent)
        for (provider, service), daily_map in service_history.items():
            if len(daily_map) < 14:
                continue

            sorted_days = sorted(daily_map.keys())
            total_days = len(sorted_days)
            
            # Slice into 4 chronological segments
            seg_len = max(3, total_days // 4)
            w1_costs = [daily_map[d] for d in sorted_days[0:seg_len]]
            w2_costs = [daily_map[d] for d in sorted_days[seg_len:2*seg_len]]
            w3_costs = [daily_map[d] for d in sorted_days[2*seg_len:3*seg_len]]
            w4_costs = [daily_map[d] for d in sorted_days[3*seg_len:]]

            w1 = sum(w1_costs)
            w2 = sum(w2_costs)
            w3 = sum(w3_costs)
            w4 = sum(w4_costs)

            current_weekly_cost = w4 if w4 > 0 else (w3 if w3 > 0 else sum(daily_map.values()) / 4)

            # Week-over-week growth rates
            growths = []
            if w1 > 0:
                growths.append((w2 - w1) / w1)
            if w2 > 0:
                growths.append((w3 - w2) / w2)
            if w3 > 0:
                growths.append((w4 - w3) / w3)

            if not growths:
                continue

            avg_growth = sum(growths) / len(growths)

            if avg_growth > 0.20:
                prov_lower = provider.lower()
                srv_lower = service.lower()

                if prov_lower in AI_PROVIDERS:
                    rec_type = "optimization"
                    rec_text = "Consider caching repeated queries and routing prompts to smaller models"
                    impact = current_weekly_cost * 4 * 0.30
                elif current_weekly_cost > 200.0 and avg_growth > 0.30:
                    rec_type = "horizontal_scaling"
                    monthly_threshold = int(current_weekly_cost * 4)
                    rec_text = f"Evaluate horizontal scaling with request queuing at ${monthly_threshold}/month threshold"
                    impact = current_weekly_cost * 4 * 0.25
                elif prov_lower in ["aws", "gcp", "azure", "render", "vercel"]:
                    if any(term in srv_lower for term in ["compute", "ec2", "functions", "edge", "lpu"]):
                        rec_type = "vertical_scaling"
                        rec_text = "Right-size instance types or configure concurrency limits based on peak memory usage"
                    else:
                        rec_type = "optimization"
                        rec_text = "Apply automated lifecycle retention policies to reduce dormant storage costs"
                    impact = current_weekly_cost * 4 * 0.20
                else:
                    rec_type = "optimization"
                    rec_text = f"Spend is accelerating at {avg_growth*100:.0f}% week-over-week. Review resource allocation."
                    impact = current_weekly_cost * 4 * 0.20

                # Priority logic
                if avg_growth > 0.40 or current_weekly_cost > 100.0:
                    priority = "high"
                elif avg_growth > 0.25:
                    priority = "medium"
                else:
                    priority = "low"

                scaling_recs.append(
                    ScalingRecommendation(
                        provider=provider,
                        service=service,
                        current_weekly_cost=round(current_weekly_cost, 2),
                        avg_weekly_growth_pct=round(avg_growth * 100.0, 1),
                        recommendation_type=rec_type,
                        recommendation=rec_text,
                        estimated_monthly_impact=round(impact, 2),
                        priority=priority,
                    )
                )

        scaling_recs.sort(key=lambda s: s.estimated_monthly_impact, reverse=True)
        return scaling_recs

