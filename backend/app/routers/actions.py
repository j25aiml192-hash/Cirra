from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/actions", tags=["actions"])

class ActionResponse(BaseModel):
    id: str
    type: str
    proposal: Dict[str, Any]
    dry_run_result: Optional[Dict[str, Any]] = None
    status: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    executed_at: Optional[datetime] = None

class CreateActionRequest(BaseModel):
    type: str
    proposal: Dict[str, Any]

_actions = [
    {
        "id": "act11111-1111-1111-1111-111111111111",
        "type": "terminate_idle_ec2",
        "proposal": {
            "resource_id": "i-0987654321fedcba0",
            "reason": "CPU < 1% for 14 consecutive days",
            "estimated_savings_monthly": 184.50
        },
        "dry_run_result": {"status": "success", "safety_checks_passed": True},
        "status": "proposed",
        "approved_by": None,
        "approved_at": None,
        "executed_at": None
    }
]

@router.get("", response_model=List[ActionResponse])
async def list_actions():
    return _actions

@router.post("", response_model=ActionResponse, status_code=status.HTTP_201_CREATED)
async def create_action(payload: CreateActionRequest):
    new_action = {
        "id": "act22222-2222-2222-2222-222222222222",
        "type": payload.type,
        "proposal": payload.proposal,
        "dry_run_result": {"status": "success", "simulated": True},
        "status": "proposed",
        "approved_by": None,
        "approved_at": None,
        "executed_at": None
    }
    _actions.append(new_action)
    return new_action

@router.post("/{action_id}/approve", response_model=ActionResponse)
async def approve_action(action_id: str):
    for a in _actions:
        if a["id"] == action_id:
            a["status"] = "approved"
            a["approved_by"] = "00000000-0000-0000-0000-000000000001"
            a["approved_at"] = datetime.utcnow().isoformat()
            return a
    raise HTTPException(status_code=404, detail="Action not found")

@router.post("/{action_id}/execute", response_model=ActionResponse)
async def execute_action(action_id: str):
    for a in _actions:
        if a["id"] == action_id:
            if a["status"] != "approved":
                raise HTTPException(
                    status_code=400,
                    detail="Human approval required prior to executing any write actions."
                )
            a["status"] = "executed"
            a["executed_at"] = datetime.utcnow().isoformat()
            return a
    raise HTTPException(status_code=404, detail="Action not found")

@router.post("/{action_id}/rollback", response_model=ActionResponse)
async def rollback_action(action_id: str):
    for a in _actions:
        if a["id"] == action_id:
            a["status"] = "rolled_back"
            return a
    raise HTTPException(status_code=404, detail="Action not found")
