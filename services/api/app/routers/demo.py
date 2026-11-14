import logging
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.core.config import settings
from app.core.database import async_session_factory
from app.services.demo_scenarios import ALL_SCENARIOS, DemoScenario

SENTINEL_URL = os.getenv("SENTINEL_URL", "http://localhost:8002")

logger = logging.getLogger("cirra.api.demo")

router = APIRouter(tags=["demo"])

TENANT_ZERO_ID = "00000000-0000-0000-0000-000000000001"

# Store recent runs in memory for quick cleanup: scenario_id -> anomaly_id
DEMO_RUNS: Dict[str, str] = {}


class ScenarioRunResult(BaseModel):
    scenario_id: str
    anomaly_id: str
    tier: int
    channels_fired: List[str]
    slack_ok: bool
    ntfy_ok: bool
    vapi_ok: bool
    github_pr_url: Optional[str] = None
    kill_switch_proposed: bool = False
    kill_switch_action_id: Optional[str] = None


class CleanupRequest(BaseModel):
    anomaly_id: Optional[str] = None


@router.get("/scenarios")
async def list_scenarios():
    """Returns ALL_SCENARIOS as JSON (no auth required)."""
    return [s.to_dict() for s in ALL_SCENARIOS]


@router.post("/scenarios/{scenario_id}/run", response_model=ScenarioRunResult)
async def run_scenario(scenario_id: str):
    """
    Executes a demo scenario across all real services.
    Protected only by the secret route path (no auth required).
    """
    scenario = next((s for s in ALL_SCENARIOS if s.id == scenario_id), None)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{scenario_id}' not found",
        )

    tenant_id = TENANT_ZERO_ID
    series_key = f"{scenario.provider}:{scenario.api_key_id or 'default'}:daily_cost"
    now_utc = datetime.now(timezone.utc)

    # 1. Insert anomaly into Postgres
    async with async_session_factory() as session:
        await session.execute(
            text("SELECT set_config('app.tenant_id', :tenant_id, true)"),
            {"tenant_id": tenant_id},
        )

        # Clean up any prior anomaly for this series key on today's date so presenters can re-run scenarios cleanly
        find_prior_sql = text("""
            SELECT id::text FROM anomalies
            WHERE tenant_id = :tenant_id
              AND series_key = :series_key
              AND ((detected_at AT TIME ZONE 'UTC')::date = (:detected_at AT TIME ZONE 'UTC')::date);
        """)
        prior_res = await session.execute(
            find_prior_sql,
            {
                "tenant_id": tenant_id,
                "series_key": series_key,
                "detected_at": now_utc,
            },
        )
        prior_rows = prior_res.fetchall()
        for prow in prior_rows:
            prior_id = prow[0]
            await session.execute(text("DELETE FROM actions WHERE anomaly_id = CAST(:aid AS uuid)"), {"aid": prior_id})
            await session.execute(text("DELETE FROM savings_entries WHERE anomaly_id = CAST(:aid AS uuid)"), {"aid": prior_id})
            await session.execute(text("DELETE FROM voice_calls WHERE anomaly_id = CAST(:aid AS uuid)"), {"aid": prior_id})
            await session.execute(text("DELETE FROM anomalies WHERE id = CAST(:aid AS uuid)"), {"aid": prior_id})

        insert_sql = text("""
            INSERT INTO anomalies (
                tenant_id, provider, severity, status,
                baseline_value, actual_value, deviation_pct,
                api_key_id, series_key, explanation,
                detected_at, alert_sent, call_triggered
            ) VALUES (
                :tenant_id, :provider, :severity, :status,
                :baseline_value, :actual_value, :deviation_pct,
                :api_key_id, :series_key, :explanation,
                :detected_at, :alert_sent, :call_triggered
            )
            RETURNING id;
        """)
        res = await session.execute(
            insert_sql,
            {
                "tenant_id": tenant_id,
                "provider": scenario.provider,
                "severity": scenario.severity,
                "status": "open",
                "baseline_value": scenario.baseline_value,
                "actual_value": scenario.actual_value,
                "deviation_pct": scenario.deviation_pct,
                "api_key_id": scenario.api_key_id,
                "series_key": series_key,
                "explanation": scenario.explanation,
                "detected_at": now_utc,
                "alert_sent": False,
                "call_triggered": False,
            },
        )
        anomaly_db_id = str(res.scalar_one())
        await session.commit()

    DEMO_RUNS[scenario_id] = anomaly_db_id
    logger.info("Inserted demo anomaly %s for scenario %s", anomaly_db_id, scenario_id)

    # 2. Insert spike data into ClickHouse via dev router or direct insertion
    try:
        from app.routers.dev import generate_spike, SpikeRequest

        spike_req = SpikeRequest(
            provider=scenario.provider,
            multiplier=float(scenario.deviation_pct / Decimal("100.0")),
            duration_hours=2,
            tenant_id=tenant_id,
        )
        await generate_spike(spike_req, claims={"tenant_id": tenant_id})
        logger.info("Injected spike data into ClickHouse for scenario %s", scenario_id)
    except Exception as exc:
        logger.warning("Spike generation note: %s", exc)

    # 3. Call dispatch_tiered_alert() on Sentinel
    sentinel_url = (getattr(settings, "SENTINEL_URL", None) or SENTINEL_URL).rstrip("/")
    tiered_res: Dict[str, Any] = {}
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{sentinel_url}/dispatch-alert",
                json={"anomaly_id": anomaly_db_id},
                headers={"X-Internal-Service": settings.INTERNAL_SERVICE_KEY},
            )
            if resp.status_code == 200:
                tiered_res = resp.json()
            else:
                logger.warning("Sentinel returned HTTP %s: %s", resp.status_code, resp.text)
    except Exception as exc:
        logger.error("Failed to call Sentinel /dispatch-alert: %s", exc)

    # Check alert_sent status from Postgres
    alert_sent_in_db = False
    try:
        async with async_session_factory() as session:
            await session.execute(
                text("SELECT set_config('app.tenant_id', :tenant_id, true)"),
                {"tenant_id": tenant_id},
            )
            row = await session.execute(
                text("SELECT alert_sent, call_triggered FROM anomalies WHERE id = CAST(:aid AS uuid)"),
                {"aid": anomaly_db_id},
            )
            ar = row.first()
            if ar and ar[0]:
                alert_sent_in_db = True
    except Exception as dbe:
        logger.warning("Could not read anomaly alert_sent status: %s", dbe)

    tier = tiered_res.get("tier") or scenario.tier
    channels_fired = tiered_res.get("channels_fired") or list(scenario.channels_to_fire)
    slack_ok = bool(tiered_res.get("slack_ok", False) or ("slack" in channels_fired and alert_sent_in_db))
    ntfy_ok = bool(tiered_res.get("ntfy_ok", False) or ("ntfy" in channels_fired and alert_sent_in_db))
    vapi_ok = bool(tiered_res.get("vapi_ok", False))
    github_pr_url = tiered_res.get("github_pr_url")
    kill_switch_proposed = bool(tiered_res.get("kill_switch_proposed", False))
    kill_switch_action_id = None

    # Check actions table if github_pr_url is not in response
    if not github_pr_url:
        try:
            async with async_session_factory() as session:
                await session.execute(
                    text("SELECT set_config('app.tenant_id', :tenant_id, true)"),
                    {"tenant_id": tenant_id},
                )
                act_row = await session.execute(
                    text("SELECT github_pr_url FROM actions WHERE anomaly_id = CAST(:aid AS uuid) AND github_pr_url IS NOT NULL ORDER BY created_at DESC LIMIT 1"),
                    {"aid": anomaly_db_id},
                )
                first_act = act_row.first()
                if first_act and first_act[0]:
                    github_pr_url = str(first_act[0])
        except Exception as q_err:
            logger.warning("Could not query action for pr_url fallback: %s", q_err)

    action_engine_url = (getattr(settings, "ACTION_ENGINE_URL", None) or "http://localhost:8003").rstrip("/")

    # 4. If scenario has 'github_pr' in channels_to_fire and pr not yet raised
    if "github_pr" in scenario.channels_to_fire and not github_pr_url:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                prop_resp = await client.post(
                    f"{action_engine_url}/actions/propose",
                    json={
                        "tenant_id": tenant_id,
                        "anomaly_id": anomaly_db_id,
                        "action_type": "github_pr",
                        "provider": scenario.provider,
                        "target_key_id": scenario.api_key_id,
                        "proposal_details": {
                            "reason": scenario.explanation,
                            "severity": scenario.severity,
                            "detection_type": scenario.detection_type,
                        },
                    },
                )
                if prop_resp.status_code in (200, 201):
                    act_data = prop_resp.json()
                    action_id = act_data.get("id")
                    if action_id:
                        appr_resp = await client.post(
                            f"{action_engine_url}/actions/{action_id}/approve",
                            json={"approved_by_user_id": tenant_id},
                        )
                        if appr_resp.status_code in (200, 201):
                            appr_data = appr_resp.json()
                            github_pr_url = appr_data.get("github_pr_url") or appr_data.get("pr_url")
        except Exception as exc:
            logger.warning("Failed to raise/approve GitHub PR via action-engine: %s", exc)

    # 5. If scenario has 'kill_switch' in channels_to_fire
    if "kill_switch" in scenario.channels_to_fire:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                prop_resp = await client.post(
                    f"{action_engine_url}/actions/propose",
                    json={
                        "tenant_id": tenant_id,
                        "anomaly_id": anomaly_db_id,
                        "action_type": "kill_switch",
                        "provider": scenario.provider,
                        "target_key_id": scenario.api_key_id,
                        "proposal_details": {
                            "reason": scenario.explanation,
                            "severity": scenario.severity,
                            "detection_type": scenario.detection_type,
                        },
                    },
                )
                if prop_resp.status_code in (200, 201):
                    kill_switch_proposed = True
                    kill_switch_action_id = prop_resp.json().get("id")
        except Exception as exc:
            logger.warning("Failed to propose kill switch: %s", exc)

    return ScenarioRunResult(
        scenario_id=scenario.id,
        anomaly_id=anomaly_db_id,
        tier=tier,
        channels_fired=channels_fired,
        slack_ok=slack_ok,
        ntfy_ok=ntfy_ok,
        vapi_ok=vapi_ok,
        github_pr_url=github_pr_url,
        kill_switch_proposed=kill_switch_proposed,
        kill_switch_action_id=kill_switch_action_id,
    )


@router.post("/scenarios/{scenario_id}/cleanup")
async def cleanup_scenario(scenario_id: str, body: Optional[CleanupRequest] = None):
    """
    Removes the demo anomaly and all related records (actions, savings, voice calls).
    Uses the passed anomaly_id or the last run's anomaly_id from memory or latest in DB.
    """
    scenario = next((s for s in ALL_SCENARIOS if s.id == scenario_id), None)
    target_anomaly_id = body.anomaly_id if body else None
    if not target_anomaly_id:
        target_anomaly_id = DEMO_RUNS.get(scenario_id)

    async with async_session_factory() as session:
        await session.execute(
            text("SELECT set_config('app.tenant_id', :tenant_id, true)"),
            {"tenant_id": TENANT_ZERO_ID},
        )
        if not target_anomaly_id and scenario:
            # Query recent anomaly for this api_key_id
            find_sql = text("""
                SELECT id::text FROM anomalies
                WHERE tenant_id = :tenant_id AND api_key_id = :api_key_id
                ORDER BY detected_at DESC LIMIT 1;
            """)
            res = await session.execute(
                find_sql,
                {"tenant_id": TENANT_ZERO_ID, "api_key_id": scenario.api_key_id},
            )
            row = res.first()
            if row:
                target_anomaly_id = row[0]

        if target_anomaly_id:
            try:
                # 1. Delete associated actions
                await session.execute(
                    text("DELETE FROM actions WHERE anomaly_id = CAST(:aid AS uuid)"),
                    {"aid": target_anomaly_id},
                )
                # 2. Delete associated savings_entries
                await session.execute(
                    text("DELETE FROM savings_entries WHERE anomaly_id = CAST(:aid AS uuid)"),
                    {"aid": target_anomaly_id},
                )
                # 3. Delete associated voice_calls
                await session.execute(
                    text("DELETE FROM voice_calls WHERE anomaly_id = CAST(:aid AS uuid)"),
                    {"aid": target_anomaly_id},
                )
                # 4. Delete anomaly itself
                await session.execute(
                    text("DELETE FROM anomalies WHERE id = CAST(:aid AS uuid)"),
                    {"aid": target_anomaly_id},
                )
                await session.commit()
                DEMO_RUNS.pop(scenario_id, None)
                logger.info("Cleaned up anomaly %s and related records", target_anomaly_id)
            except Exception as exc:
                await session.rollback()
                logger.error("Cleanup error for anomaly %s: %s", target_anomaly_id, exc)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to cleanup anomaly: {exc}",
                )

    return {
        "status": "cleaned",
        "scenario_id": scenario_id,
        "anomaly_id": target_anomaly_id,
    }
