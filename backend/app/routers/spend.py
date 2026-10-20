from fastapi import APIRouter
from app.schemas.spend import CloudSpendResponse, AiSpendResponse

router = APIRouter(prefix="/spend", tags=["spend"])

@router.get("/cloud", response_model=CloudSpendResponse)
async def get_cloud_spend():
    return {
        "totalCost": 98400.00,
        "items": [
            {
                "service": "Amazon Elastic Compute Cloud - Compute",
                "provider": "AWS",
                "billedCost": 42500.00,
                "effectiveCost": 39800.00,
                "team": "core-infra"
            },
            {
                "service": "Amazon Simple Storage Service",
                "provider": "AWS",
                "billedCost": 18200.00,
                "effectiveCost": 18200.00,
                "team": "data-platform"
            },
            {
                "service": "Compute Engine",
                "provider": "GCP",
                "billedCost": 37700.00,
                "effectiveCost": 35400.00,
                "team": "ai-services"
            }
        ]
    }

@router.get("/ai", response_model=AiSpendResponse)
async def get_ai_spend():
    return {
        "totalCostUsd": 26100.50,
        "items": [
            {
                "model": "gpt-4o",
                "provider": "OpenAI",
                "apiKeyId": "key_prod_app",
                "inputTokens": 450000000,
                "outputTokens": 95000000,
                "costUsd": 14250.00,
                "team": "copilot-eng",
                "customer": "enterprise-tier"
            },
            {
                "model": "claude-3-5-sonnet-20241022",
                "provider": "Anthropic",
                "apiKeyId": "key_anthropic_main",
                "inputTokens": 320000000,
                "outputTokens": 75000000,
                "costUsd": 11850.50,
                "team": "agent-eng",
                "customer": "all"
            }
        ]
    }
