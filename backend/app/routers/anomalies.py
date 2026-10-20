from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/anomalies", tags=["anomalies"])

class AnomalyResponse(BaseModel):
    id: str
    series_key: str
    detected_at: datetime
    severity: str
    status: str
    explanation: Optional[Dict[str, Any]] = None

_anomalies = [
    {
        "id": "a1111111-1111-1111-1111-111111111111",
        "series_key": "aws.ec2.nat_gateway_bytes",
        "detected_at": "2024-10-19T14:00:00Z",
        "severity": "critical",
        "status": "open",
        "explanation": {
            "summary": "Sudden 420% surge in NAT Gateway transfer in us-east-1",
            "root_cause": "Misconfigured internal container pulling Docker image loops without VPC endpoint"
        }
    },
    {
        "id": "a2222222-2222-2222-2222-222222222222",
        "series_key": "openai.gpt-4o.tokens",
        "detected_at": "2024-10-20T08:15:00Z",
        "severity": "warning",
        "status": "open",
        "explanation": {
            "summary": "Token consumption spike on key_prod_app",
            "root_cause": "Batch eval script triggered concurrently by team copilot-eng"
        }
    }
]

@router.get("", response_model=List[AnomalyResponse])
async def list_anomalies():
    return _anomalies

@router.post("/{anomaly_id}/dismiss")
async def dismiss_anomaly(anomaly_id: str):
    for a in _anomalies:
        if a["id"] == anomaly_id:
            a["status"] = "dismissed"
            return {"status": "dismissed", "id": anomaly_id}
    raise HTTPException(status_code=404, detail="Anomaly not found")
