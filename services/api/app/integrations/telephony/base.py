from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class CallRequest:
    to_number: str
    from_number: str
    webhook_url: str        # Twilio posts call events here
    anomaly_snapshot: dict  # Real values from DB
    tenant_id: str
    anomaly_id: str
    voice_call_db_id: str


@dataclass  
class CallResult:
    success: bool
    call_sid: Optional[str]
    provider: str
    error: Optional[str] = None
    mocked: bool = False


class TelephonyProvider(ABC):
    @abstractmethod
    async def initiate_call(self, req: CallRequest) -> CallResult:
        """Initiate outbound call to destination number."""
        pass

    @abstractmethod
    async def get_call_status(self, call_sid: str) -> dict:
        """Fetch call status and metadata."""
        pass

    @abstractmethod
    async def terminate_call(self, call_sid: str) -> bool:
        """Terminate active call."""
        pass

