import logging
from contextlib import asynccontextmanager
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
import uuid

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import settings
from app.db import close_db_pool, get_db_connection, init_db_pool
from app.kill_switch import KillSwitchEngine
from app.github_pr import GitHubPREngine
from app.savings_ledger import SavingsLedgerEngine
from app.workflow import ActionWorkflow

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("cirra.action_engine")

# Initialize shared components
kill_switch_engine = KillSwitchEngine()
github_pr_engine = GitHubPREngine()
savings_ledger_engine = SavingsLedgerEngine()
workflow = ActionWorkflow(
    kill_switch_engine=kill_switch_engine,
    github_pr_engine=github_pr_engine,
    savings_ledger_engine=savings_ledger_engine,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Cirra Action Engine service on port %s", settings.PORT)
    await init_db_pool()
    yield
    logger.info("Shutting down Cirra Action Engine service")
    await close_db_pool()


app = FastAPI(
    title="Cirra Action Engine",
    version="0.1.0",
    description="Autonomous remediation engine: kill switches, spend caps, savings ledger & GitHub PR generation",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request & Response Models ---

class ProposeActionRequest(BaseModel):
    anomaly_id: Optional[str] = Field(None, description="UUID of linked anomaly")
    action_type: str = Field(..., description="Action type: kill_switch, spend_cap, github_pr, scheduled_shutdown")
    provider: Optional[str] = Field(None, description="Provider name (e.g. openai, anthropic, groq, gemini)")
    target_key_id: Optional[str] = Field(None, description="Target API key or resource identifier")
    tenant_id: str = Field(..., description="Tenant UUID")
    proposal_details: Optional[Dict[str, Any]] = Field(None, description="Extra context for proposal")


class ApproveActionRequest(BaseModel):
    approved_by_user_id: str = Field(..., description="UUID of human approver")


class RollbackActionRequest(BaseModel):
    reason: Optional[str] = Field("Manual rollback requested", description="Rollback reason")


def _sanitize_output(val: Any) -> Any:
    """Recursively convert Decimals, UUIDs, and datetimes to serializable types."""
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, (datetime, uuid.UUID)):
        return str(val)
    if isinstance(val, dict):
        return {k: _sanitize_output(v) for k, v in val.items()}
    if isinstance(val, (list, tuple)):
        return [_sanitize_output(v) for v in val]
    return val


# --- Health Endpoints ---

@app.get("/health", tags=["system"])
async def health_check():
    return {
        "status": "ok",
        "service": "cirra-action-engine",
        "port": settings.PORT,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/ready", tags=["system"])
async def ready_check():
    return {
        "status": "ready",
        "service": "cirra-action-engine",
        "mock_mode": settings.INGEST_MOCK,
    }


# --- Action Endpoints ---

@app.post("/actions/propose", status_code=status.HTTP_201_CREATED, tags=["actions"])
async def propose_action(req: ProposeActionRequest):
    """
    Creates a proposed action and automatically executes its dry-run simulation.
    Returns action with dry_run_result.
    """
    try:
        async with get_db_connection(tenant_id=req.tenant_id) as conn:
            action = await workflow.propose_action(
                tenant_id=req.tenant_id,
                anomaly_id=req.anomaly_id,
                action_type=req.action_type,
                provider=req.provider,
                target_key_id=req.target_key_id,
                conn=conn,
                proposal_details=req.proposal_details,
            )
            return _sanitize_output(action)
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except Exception as exc:
        logger.error("Error in propose_action: %s", str(exc), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to propose action: {str(exc)}",
        )


@app.post("/actions/{action_id}/approve", tags=["actions"])
async def approve_action(action_id: str, req: ApproveActionRequest):
    """
    Executes the action immediately after human approval recorded in DB.
    Returns execution result including PR URL or kill switch result.
    """
    try:
        async with get_db_connection() as conn:
            res = await workflow.execute_approved_action(
                action_id=action_id,
                approved_by=req.approved_by_user_id,
                conn=conn,
            )
            return _sanitize_output(res)
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except Exception as exc:
        logger.error("Error in approve_action: %s", str(exc), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute action: {str(exc)}",
        )


@app.post("/actions/{action_id}/rollback", tags=["actions"])
async def rollback_action(action_id: str, req: RollbackActionRequest):
    """Marks action as rolled_back and logs reason."""
    try:
        async with get_db_connection() as conn:
            res = await workflow.rollback_action(
                action_id=action_id,
                reason=req.reason,
                conn=conn,
            )
            return _sanitize_output(res)
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except Exception as exc:
        logger.error("Error in rollback_action: %s", str(exc), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rollback action: {str(exc)}",
        )


@app.get("/actions", tags=["actions"])
async def list_actions(
    tenant_id: str = Query(..., description="Tenant UUID"),
):
    """List all actions for tenant, ordered by created_at DESC."""
    try:
        async with get_db_connection(tenant_id=tenant_id) as conn:
            sql = "SELECT * FROM actions WHERE tenant_id = $1::uuid ORDER BY created_at DESC;"
            rows = await conn.fetch(sql, tenant_id)
            actions = [dict(r) for r in rows]
            return _sanitize_output(actions)
    except Exception as exc:
        logger.error("Error listing actions: %s", str(exc), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list actions: {str(exc)}",
        )


# --- Savings Endpoints ---

@app.get("/savings", tags=["savings"])
async def list_savings(
    tenant_id: str = Query(..., description="Tenant UUID"),
):
    """
    List all savings_entries for tenant with totals:
    {
      identified_total: Decimal,
      approved_total: Decimal,
      verified_total: Decimal,
      entries: List[SavingsEntry]
    }
    """
    try:
        async with get_db_connection(tenant_id=tenant_id) as conn:
            data = await savings_ledger_engine.list_savings_with_totals(tenant_id, conn)
            return _sanitize_output(data)
    except Exception as exc:
        logger.error("Error listing savings: %s", str(exc), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list savings: {str(exc)}",
        )
