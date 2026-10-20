from typing import List, Optional
from fastapi import APIRouter, status
from pydantic import BaseModel

router = APIRouter(prefix="/budgets", tags=["budgets"])

class CreateBudgetRequest(BaseModel):
    name: str
    target_type: str
    target_value: str
    amount: float
    alert_threshold_percent: float = 80.0

class BudgetResponse(BaseModel):
    id: str
    name: str
    target_type: str
    target_value: str
    amount: float
    current_spend: float
    alert_threshold_percent: float

_budgets = [
    {
        "id": "b1111111-1111-1111-1111-111111111111",
        "name": "Core Infrastructure Monthly",
        "target_type": "team",
        "target_value": "core-infra",
        "amount": 50000.00,
        "current_spend": 42500.00,
        "alert_threshold_percent": 80.0
    },
    {
        "id": "b2222222-2222-2222-2222-222222222222",
        "name": "AI Experimentation Cap",
        "target_type": "team",
        "target_value": "copilot-eng",
        "amount": 30000.00,
        "current_spend": 26100.50,
        "alert_threshold_percent": 85.0
    }
]

@router.get("", response_model=List[BudgetResponse])
async def list_budgets():
    return _budgets

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(payload: CreateBudgetRequest):
    new_budget = {
        "id": "b3333333-3333-3333-3333-333333333333",
        "name": payload.name,
        "target_type": payload.target_type,
        "target_value": payload.target_value,
        "amount": payload.amount,
        "current_spend": 0.0,
        "alert_threshold_percent": payload.alert_threshold_percent
    }
    _budgets.append(new_budget)
    return new_budget
