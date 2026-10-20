from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class AllocationRuleResponse(BaseModel):
    id: str
    priority: int
    name: Optional[str] = None
    match_type: str
    match_value: str
    assign_team: Optional[str] = None
    assign_customer: Optional[str] = None
    assign_feature: Optional[str] = None
    spendAttributed: float = 0.0
    created_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CreateAllocationRuleRequest(BaseModel):
    priority: int = 1
    name: Optional[str] = None
    match_type: str  # tag_key_value, account_id, name_regex, service (or tag, prefix, regex)
    match_value: str
    assign_team: Optional[str] = None
    assign_customer: Optional[str] = None
    assign_feature: Optional[str] = None


class UpdateAllocationRuleRequest(BaseModel):
    priority: Optional[int] = None
    name: Optional[str] = None
    match_type: Optional[str] = None
    match_value: Optional[str] = None
    assign_team: Optional[str] = None
    assign_customer: Optional[str] = None
    assign_feature: Optional[str] = None


class PreviewAllocationRuleRequest(BaseModel):
    match_type: str
    match_value: str
    assign_team: Optional[str] = None


class PreviewAllocationRuleResponse(BaseModel):
    matchedRows: int = 0
    matched_rows: int = 0
    matchedSpend: float = 0.0
    matched_spend: float = 0.0


class UnallocatedServiceItem(BaseModel):
    service_name: str
    spend: float


class AllocationCoverageResponse(BaseModel):
    totalSpend: float = 0.0
    total_spend: float = 0.0
    attributedSpend: float = 0.0
    attributed_spend: float = 0.0
    unallocatedSpend: float = 0.0
    unallocated_spend: float = 0.0
    coveragePercentage: float = 0.0
    coverage_percentage: float = 0.0
    breakdown: Dict[str, float] = {}
    topUnallocatedServices: List[UnallocatedServiceItem] = []
    top_unallocated_services: List[UnallocatedServiceItem] = []

    model_config = ConfigDict(from_attributes=True)


class SuggestedRuleResponse(BaseModel):
    id: str
    pattern: str
    suggestedTeam: str
    confidence: float
    estimatedSpend: float
