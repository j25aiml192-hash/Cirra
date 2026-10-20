from datetime import datetime
from typing import Dict, Optional, Any
from pydantic import BaseModel, ConfigDict


class CreateConnectionRequest(BaseModel):
    name: str
    provider: str
    credentials: Dict[str, Any]


class ConnectionResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    provider: str
    status: str
    last_synced_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
