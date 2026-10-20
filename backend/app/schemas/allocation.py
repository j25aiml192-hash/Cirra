from typing import Optional
from pydantic import BaseModel, ConfigDict


class CreateAllocationRuleRequest(BaseModel):
    match_type: str
    match_value: str
    assign_team: Optional[str] = None
    assign_customer: Optional[str] = None
    assign_feature: Optional[str] = None
    priority: int = 0


class AllocationRuleResponse(BaseModel):
    id: str
    priority: int
    match_type: str
    match_value: str
    assign_team: Optional[str] = None
    assign_customer: Optional[str] = None
    assign_feature: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AllocationCoverageResponse(BaseModel):
    totalSpend: float
    attributedSpend: float
    unallocatedSpend: float
    coveragePercentage: float

    model_config = ConfigDict(from_attributes=True)
