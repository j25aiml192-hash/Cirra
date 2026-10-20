from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter(prefix="/auth", tags=["auth"])

class SessionRequest(BaseModel):
    provider: str
    token: str

class SessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

@router.post("/session", response_model=SessionResponse)
async def create_session(payload: SessionRequest):
    return {
        "access_token": "dummy_jwt_token",
        "token_type": "bearer",
        "user": {
            "id": "00000000-0000-0000-0000-000000000001",
            "email": "admin@cirra.dev",
            "role": "owner",
            "tenant_id": "00000000-0000-0000-0000-000000000001"
        }
    }
