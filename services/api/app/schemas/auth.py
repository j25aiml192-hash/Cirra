from typing import Optional
from pydantic import BaseModel, EmailStr


class SessionRequest(BaseModel):
    supabase_token: str


class SessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tenant_id: str
    user_id: str
    role: str
    email: Optional[str] = None


class RegisterRequest(BaseModel):
    email: str
    password: str
    company_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class DemoLoginRequest(BaseModel):
    user_email: Optional[str] = "hiten@cirra.dev"
