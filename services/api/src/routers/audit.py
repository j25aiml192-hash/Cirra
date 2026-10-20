from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()


class AuditTriggerRequest(BaseModel):
    awsRoleArn: str
    openaiApiKey: str


class AuditReportResponse(BaseModel):
    status: str
    reportUrl: str
    summary: Dict[str, Any]


@router.post("/trigger", response_model=AuditReportResponse)
async def trigger_audit(payload: AuditTriggerRequest, request: Request):
    return AuditReportResponse(
        status="completed",
        reportUrl="https://s3.amazonaws.com/cirra-audit-reports/audit-demo.html",
        summary={
            "totalWasteDetectedUsd": 4320.5,
            "untaggedSpendPct": 18.2,
            "idleResourcesCount": 7,
            "aiCachePotentialUsd": 1250.0,
        },
    )
