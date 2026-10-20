from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TeamMemberResponse(BaseModel):
    id: str
    tenant_id: str
    email: str
    role: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str = Field(default="viewer", pattern="^(admin|member|viewer)$")


class UpdateRoleRequest(BaseModel):
    role: str = Field(..., pattern="^(admin|member|viewer)$")
