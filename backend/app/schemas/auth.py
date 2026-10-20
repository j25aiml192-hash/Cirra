from pydantic import BaseModel, ConfigDict


class SessionRequest(BaseModel):
    token: str


class SessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tenant_id: str
    role: str

    model_config = ConfigDict(from_attributes=True)
