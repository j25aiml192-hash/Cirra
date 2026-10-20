from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class CreateConnectionRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    provider: str = Field(..., min_length=1, max_length=50)
    credentials: Dict[str, Any] = Field(..., description="Provider credentials to be encrypted")


class ConnectionResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    provider: str
    status: str
    last_synced_at: Optional[datetime] = None
    last_error: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ConnectionTestResponse(BaseModel):
    ok: bool
    error: Optional[str] = None
