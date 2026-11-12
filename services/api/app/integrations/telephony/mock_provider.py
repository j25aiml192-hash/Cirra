import logging
from uuid import uuid4
from app.integrations.telephony.base import TelephonyProvider, CallRequest, CallResult

logger = logging.getLogger("cirra.telephony.mock")


class MockTelephonyProvider(TelephonyProvider):
    """Used when INGEST_MOCK=true or telephony creds missing."""

    async def initiate_call(self, req: CallRequest) -> CallResult:
        mock_sid = f"MOCK_CA_{uuid4().hex[:32]}"
        logger.info(
            f"MOCK CALL: Would call {req.to_number} "
            f"about anomaly {req.anomaly_id}. SID={mock_sid}"
        )
        return CallResult(
            success=True,
            call_sid=mock_sid,
            provider="mock",
            mocked=True,
        )

    async def get_call_status(self, call_sid: str) -> dict:
        return {"status": "completed", "duration": "45"}

    async def terminate_call(self, call_sid: str) -> bool:
        return True

