from fastapi import APIRouter
from app.schemas.dashboard import DashboardSummaryResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary():
    return {
        "total_spend_mtd": 124500.50,
        "forecasted_spend": 142000.00,
        "cloud_spend_mtd": 98400.00,
        "ai_spend_mtd": 26100.50,
        "anomalies_detected": 3,
        "potential_savings_monthly": 18500.00,
        "active_connections": 5
    }
