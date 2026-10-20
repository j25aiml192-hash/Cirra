from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.dashboard import DailyVelocityItem


class CloudSpendItem(BaseModel):
    service: str
    provider: str
    region: str
    attributed: bool
    spend: float
    priorPeriodSpend: float = 0.0
    change: str = "+0.0%"
    changePositive: bool = True
    impactPercent: float = 0.0
    team: Optional[str] = "Unallocated"
    billedCost: Optional[float] = None
    effectiveCost: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class CloudSpendResponse(BaseModel):
    totalCost: float = 0.0
    total_cost: float = 0.0
    items: List[CloudSpendItem] = []
    dailyVelocity: List[DailyVelocityItem] = []
    page: int = 1
    page_size: int = 50
    total_rows: int = 0

    model_config = ConfigDict(from_attributes=True)


class ModelCostItem(BaseModel):
    model: str
    cost: float
    provider: str


class AiSpendItem(BaseModel):
    model: str
    provider: str
    apiKeyId: str
    team: str
    customer: Optional[str] = "Standard"
    inputTokens: int = 0
    outputTokens: int = 0
    costUsd: float = 0.0
    cacheRate: str = "0%"

    model_config = ConfigDict(from_attributes=True)


class AiSpendResponse(BaseModel):
    totalCostUsd: float = 0.0
    total_cost_usd: float = 0.0
    totalTokens: int = 0
    cachedTokensPercent: float = 0.0
    modelCosts: List[ModelCostItem] = []
    items: List[AiSpendItem] = []
    page: int = 1
    page_size: int = 50
    total_rows: int = 0

    model_config = ConfigDict(from_attributes=True)
