from typing import List, Optional
from datetime import date
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/savings", tags=["savings"])

class SavingsRecord(BaseModel):
    id: str
    action_id: Optional[str] = None
    method: str
    baseline_cost: float
    realized_cost: float
    monthly_savings: float
    confidence: float
    status: str

class SavingsOverviewResponse(BaseModel):
    total_realized_savings: float
    total_pipeline_savings: float
    entries: List[SavingsRecord]

_savings = [
    {
        "id": "s1111111-1111-1111-1111-111111111111",
        "action_id": "act11111-1111-1111-1111-111111111111",
        "method": "ec2_downsizing",
        "baseline_cost": 2400.00,
        "realized_cost": 1150.00,
        "monthly_savings": 1250.00,
        "confidence": 0.95,
        "status": "realized"
    },
    {
        "id": "s2222222-2222-2222-2222-222222222222",
        "action_id": None,
        "method": "prompt_compression_caching",
        "baseline_cost": 5000.00,
        "realized_cost": 2100.00,
        "monthly_savings": 2900.00,
        "confidence": 0.88,
        "status": "realized"
    }
]

@router.get("", response_model=SavingsOverviewResponse)
async def get_savings():
    realized = sum(s["monthly_savings"] for s in _savings if s["status"] == "realized")
    return {
        "total_realized_savings": realized,
        "total_pipeline_savings": 14350.00,
        "entries": _savings
    }
