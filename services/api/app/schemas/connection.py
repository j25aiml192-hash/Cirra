from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class CreateConnectionRequest(BaseModel):
    provider: str = Field(..., min_length=1, max_length=50)
    api_key: Optional[str] = None
    label: Optional[str] = None
    name: Optional[str] = None
    credentials: Optional[Dict[str, Any]] = None
    monthly_spend_cap: Optional[float] = None


class UpdateConnectionRequest(BaseModel):
    label: Optional[str] = None
    monthly_spend_cap: Optional[float] = None
    is_monitored: Optional[bool] = None


class ConnectionResponse(BaseModel):
    id: str
    connection_id: Optional[str] = None
    tenant_id: str
    provider: Optional[str] = None
    label: Optional[str] = None
    name: Optional[str] = None
    source: Optional[str] = "manual"
    monthly_spend_cap: Optional[float] = None
    is_monitored: bool = True
    status: str = "active"
    last_tested_at: Optional[Any] = None
    last_test_status: Optional[str] = None
    created_at: Optional[Any] = None
    key_preview: Optional[str] = None
    test_result: Optional[Dict[str, Any]] = None
    last_synced_at: Optional[datetime] = None
    last_error: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ConnectionTestResponse(BaseModel):
    status: Optional[str] = None
    ok: Optional[bool] = None
    http_code: Optional[int] = None
    latency_ms: Optional[int] = None
    tested_at: Optional[str] = None
    error: Optional[str] = None
