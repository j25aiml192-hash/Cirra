from pydantic import BaseModel


class SessionRequest(BaseModel):
    supabase_token: str


class SessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tenant_id: str
    user_id: str
    role: str
