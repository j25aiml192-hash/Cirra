from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class CloudSpendRecord(BaseModel):
    service: str
    provider: str
    billedCost: float
    effectiveCost: float
    team: Optional[str] = None


class CloudSpendResponse(BaseModel):
    totalCost: float
    items: List[CloudSpendRecord]

    model_config = ConfigDict(from_attributes=True)


class AiSpendRecord(BaseModel):
    model: str
    provider: str
    apiKeyId: str
    inputTokens: int
    outputTokens: int
    costUsd: float
    team: Optional[str] = None
    customer: Optional[str] = None


class AiSpendResponse(BaseModel):
    totalCostUsd: float
    items: List[AiSpendRecord]

    model_config = ConfigDict(from_attributes=True)
