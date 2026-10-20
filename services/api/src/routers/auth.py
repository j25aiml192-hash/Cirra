from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from src.core.security import create_access_token

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tenant_id: str
    role: str


@router.post("/login", response_model=AuthTokenResponse)
async def login(credentials: LoginRequest):
    # Authenticate against PostgreSQL or Supabase
    token = create_access_token({
        "sub": "usr_demo_1",
        "email": credentials.email,
        "tenant_id": "00000000-0000-0000-0000-000000000001",
        "role": "admin"
    })
    return AuthTokenResponse(
        access_token=token,
        tenant_id="00000000-0000-0000-0000-000000000001",
        role="admin"
    )
