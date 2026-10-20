from fastapi import APIRouter, Request, Depends
from src.schemas import DashboardSummaryResponse

router = APIRouter()


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(request: Request):
    tenant_id = getattr(request.state, "tenant_id", "00000000-0000-0000-0000-000000000001")
    return DashboardSummaryResponse(
        tenantId=tenant_id,
        totalSpendMonthToDate=42850.25,
        projectedMonthEndSpend=61400.0,
        cloudSpendMonthToDate=33120.5,
        aiSpendMonthToDate=9729.75,
        spendChangePercentage=14.2,
        activeAnomaliesCount=3,
        potentialSavingsEstimate=8350.0,
        topServices=[
            {"serviceName": "AmazonEC2", "provider": "aws", "cost": 14200.0, "pctTotal": 33.1},
            {"serviceName": "OpenAI GPT-4o", "provider": "openai", "cost": 6850.0, "pctTotal": 16.0},
            {"serviceName": "Google Cloud Kubernetes", "provider": "gcp", "cost": 5900.0, "pctTotal": 13.8},
        ],
        dailySpendTrend=[
            {"date": "2026-10-18", "cloudCost": 1290.0, "aiCost": 450.0, "totalCost": 1740.0},
            {"date": "2026-10-19", "cloudCost": 1340.0, "aiCost": 510.0, "totalCost": 1850.0},
            {"date": "2026-10-20", "cloudCost": 1380.0, "aiCost": 540.0, "totalCost": 1920.0},
        ],
    )
