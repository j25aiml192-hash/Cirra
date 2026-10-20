from typing import List
from fastapi import APIRouter, status
from app.schemas.allocation import (
    CreateAllocationRuleRequest,
    AllocationRuleResponse,
    AllocationCoverageResponse
)

router = APIRouter(prefix="/allocation", tags=["allocation"])

_rules = [
    {
        "id": "r1111111-1111-1111-1111-111111111111",
        "priority": 1,
        "match_type": "tag",
        "match_value": "env=production",
        "assign_team": "core-infra",
        "assign_customer": None,
        "assign_feature": "platform"
    },
    {
        "id": "r2222222-2222-2222-2222-222222222222",
        "priority": 2,
        "match_type": "prefix",
        "match_value": "ai-copilot-",
        "assign_team": "copilot-eng",
        "assign_customer": None,
        "assign_feature": "ai-copilot"
    }
]

@router.get("/rules", response_model=List[AllocationRuleResponse])
async def list_allocation_rules():
    return _rules

@router.post("/rules", response_model=AllocationRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_allocation_rule(payload: CreateAllocationRuleRequest):
    new_rule = {
        "id": "r3333333-3333-3333-3333-333333333333",
        "priority": payload.priority,
        "match_type": payload.match_type,
        "match_value": payload.match_value,
        "assign_team": payload.assign_team,
        "assign_customer": payload.assign_customer,
        "assign_feature": payload.assign_feature
    }
    _rules.append(new_rule)
    return new_rule

@router.get("/coverage", response_model=AllocationCoverageResponse)
async def get_allocation_coverage():
    return {
        "totalSpend": 124500.50,
        "attributedSpend": 105825.42,
        "unallocatedSpend": 18675.08,
        "coveragePercentage": 85.0
    }
