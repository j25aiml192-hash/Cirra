from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class TopServiceItem(BaseModel):
    name: str
    provider: str
    spend: float
    change: str = "+0.0%"
    changePositive: bool = True
    share: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class TopAiKeyItem(BaseModel):
    keyName: str
    provider: str
    team: str
    spend: float
    tokens: str

    model_config = ConfigDict(from_attributes=True)


class MonthlySpendItem(BaseModel):
    month: str
    aws: float = 0.0
    gcp: float = 0.0
    openai: float = 0.0
    anthropic: float = 0.0


class DailyVelocityItem(BaseModel):
    date: str
    amount: float


class AttributionCoverageItem(BaseModel):
    percentage: float = 0.0
    attributed: float = 0.0
    unallocated: float = 0.0
    resourcesCount: int = 0
    totalResources: int = 0


class DashboardSummaryResponse(BaseModel):
    total_spend_mtd: float = 0.0
    total_spend_prior_period: float = 0.0
    mom_change: float = 0.0
    forecasted_spend: float = 0.0
    cloud_spend_mtd: float = 0.0
    ai_spend_mtd: float = 0.0
    total_tokens: Optional[int] = 0
    unallocated_percent: float = 100.0
    coverage_score: float = 0.0
    anomalies_detected: int = 0
    potential_savings_monthly: float = 0.0
    active_connections: int = 0
    last_synced_at: Optional[str] = None
    monthly: List[MonthlySpendItem] = []
    daily_trend: List[DailyVelocityItem] = []
    dailyVelocity: List[DailyVelocityItem] = []
    topServices: List[TopServiceItem] = []
    topAiKeys: List[TopAiKeyItem] = []
    attributionCoverage: AttributionCoverageItem = AttributionCoverageItem()

    model_config = ConfigDict(from_attributes=True)
