from typing import Dict, Any, List
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/audit", tags=["audit"])

class AuditEventRequest(BaseModel):
    action: str
    target_resource: str
    details: Dict[str, Any]

class AuditEventResponse(BaseModel):
    id: str
    action: str
    target_resource: str
    timestamp: datetime
    status: str

_audit_logs = []

@router.post("", response_model=AuditEventResponse)
async def log_audit_event(payload: AuditEventRequest):
    event = {
        "id": f"aud_{len(_audit_logs)+1}",
        "action": payload.action,
        "target_resource": payload.target_resource,
        "timestamp": datetime.utcnow().isoformat(),
        "status": "recorded"
    }
    _audit_logs.append(event)
    return event
