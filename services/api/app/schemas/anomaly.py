import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SnoozeRequest(BaseModel):
    hours: int = Field(default=24, ge=1, le=720, description="Hours to snooze the anomaly")


class AnomalyResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    series_key: str
    provider: str
    api_key_id: Optional[str] = None
    detected_at: datetime
    severity: str
    status: str
    baseline_value: Optional[Decimal] = None
    actual_value: Optional[Decimal] = None
    deviation_pct: Optional[Decimal] = None
    explanation: Optional[str] = None
    alert_sent: bool = False
    call_triggered: bool = False
    resolved_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
