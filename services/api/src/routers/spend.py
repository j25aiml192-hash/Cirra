from fastapi import APIRouter, Request, Query
from typing import Optional, List
from src.schemas import SpendResponse, AiSpendRowResponse

router = APIRouter()


@router.get("/cloud", response_model=SpendResponse)
async def get_cloud_spend(
    request: Request,
    start_date: str = Query("2026-10-01"),
    end_date: str = Query("2026-10-20"),
    provider: Optional[str] = None,
):
    tenant_id = getattr(request.state, "tenant_id", "00000000-0000-0000-0000-000000000001")
    return SpendResponse(
        totalCost=33120.5,
        billedCost=34500.0,
        effectiveCost=33120.5,
        currency="USD",
        timeSeries=[
            {"period": "2026-10-18", "cost": 1290.0},
            {"period": "2026-10-19", "cost": 1340.0},
            {"period": "2026-10-20", "cost": 1380.0},
        ],
        breakdown=[
            {"key": "AmazonEC2", "provider": "aws", "cost": 14200.0, "billedCost": 15000.0, "effectiveCost": 14200.0, "percentage": 42.8},
            {"key": "Google Kubernetes Engine", "provider": "gcp", "cost": 5900.0, "billedCost": 5900.0, "effectiveCost": 5900.0, "percentage": 17.8},
        ],
    )


@router.get("/ai", response_model=List[AiSpendRowResponse])
async def get_ai_spend(
    request: Request,
    start_date: str = Query("2026-10-01"),
    end_date: str = Query("2026-10-20"),
):
    tenant_id = getattr(request.state, "tenant_id", "00000000-0000-0000-0000-000000000001")
    return [
        AiSpendRowResponse(
            model="gpt-4o",
            provider="openai",
            apiKeyId="key_prod_copilot_912",
            inputTokens=18450000,
            outputTokens=4120000,
            totalTokens=22570000,
            costUsd=133.45,
            teamTag="Search & Recs",
            customerTag="Acme Enterprise",
            featureTag="Semantic Search",
            requestCount=48200,
        )
    ]
