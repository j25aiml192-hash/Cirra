from typing import List
from pydantic import BaseModel, ConfigDict


class SpendItem(BaseModel):
    name: str
    cost: float
    percentage: float


class DashboardSummary(BaseModel):
    totalSpend: float
    projectedSpend: float
    cloudSpend: float
    aiSpend: float
    wasteEstimate: float
    coverageScore: float
    topDrivers: List[SpendItem]

    model_config = ConfigDict(from_attributes=True)
