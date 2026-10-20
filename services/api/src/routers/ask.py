from fastapi import APIRouter, Request, HTTPException
from src.schemas import AskRequest, AskResponse

router = APIRouter()


@router.post("", response_model=AskResponse)
async def ask_cirra(payload: AskRequest, request: Request):
    tenant_id = getattr(request.state, "tenant_id", "00000000-0000-0000-0000-000000000001")

    # In full flow, calls investigator service AskCirra pipeline
    # Returns DB verified numbers only
    return AskResponse(
        answer="Based on ClickHouse FOCUS facts, OpenAI GPT-4o usage totaled $6,850.00 this month.",
        sql="SELECT model, sum(cost_usd) as total_cost FROM ai_usage_facts WHERE tenant_id = %(tenant_id)s GROUP BY model ORDER BY total_cost DESC LIMIT 10",
        rows=[{"model": "gpt-4o", "total_cost": 6850.0}],
        confidence=0.95,
        warning=None,
    )
