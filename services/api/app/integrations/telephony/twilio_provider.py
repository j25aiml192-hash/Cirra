import asyncio
import logging
from typing import Optional
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from app.core.config import settings
from app.integrations.telephony.base import TelephonyProvider, CallRequest, CallResult

logger = logging.getLogger("cirra.telephony.twilio")


class TwilioProvider(TelephonyProvider):
    """
    Twilio Programmable Voice client implementation.
    """

    def __init__(
        self,
        account_sid: Optional[str] = None,
        auth_token: Optional[str] = None,
        from_number: Optional[str] = None,
    ):
        self.account_sid = account_sid or settings.TWILIO_ACCOUNT_SID
        self.auth_token = auth_token or settings.TWILIO_AUTH_TOKEN
        self.from_number = from_number or settings.TWILIO_FROM_NUMBER or "+17372508034"

        if not self.account_sid or not self.auth_token:
            logger.warning("TwilioProvider initialized without full credentials.")
            self.client = None
        else:
            self.client = Client(self.account_sid, self.auth_token)

    async def initiate_call(self, req: CallRequest) -> CallResult:
        """
        Uses Twilio REST API to trigger outbound call.
        """
        if not self.client:
            return CallResult(
                success=False,
                call_sid=None,
                provider="twilio",
                error="Twilio client not configured. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.",
            )

        webhook_base = req.webhook_url.rstrip("/")
        twiml_url = (
            f"{webhook_base}/api/v1/voice/webhooks/twilio/twiml"
            f"?voice_call_id={req.voice_call_db_id}"
            f"&tenant_id={req.tenant_id}"
            f"&anomaly_id={req.anomaly_id}"
        )
        status_callback_url = f"{webhook_base}/api/v1/voice/webhooks/twilio/status"
        status_callback_event = ["initiated", "ringing", "answered", "completed"]

        logger.info(
            f"Initiating Twilio call: to={req.to_number}, from={self.from_number}, "
            f"twiml_url={twiml_url}, voice_call_id={req.voice_call_db_id}"
        )

        try:
            call = await asyncio.to_thread(
                self.client.calls.create,
                to=req.to_number,
                from_=self.from_number,
                url=twiml_url,
                status_callback=status_callback_url,
            )
            logger.info(f"Twilio call successfully initiated. CallSid={call.sid}")
            return CallResult(
                success=True,
                call_sid=call.sid,
                provider="twilio",
                mocked=False,
            )
        except TwilioRestException as exc:
            logger.error(
                f"Twilio REST exception during call initiation: code={exc.code}, "
                f"msg={exc.msg}, status={exc.status}",
                exc_info=True,
            )
            return CallResult(
                success=False,
                call_sid=None,
                provider="twilio",
                error=f"Twilio error [{exc.code}]: {exc.msg}",
            )
        except Exception as e:
            logger.error(f"Unexpected error initiating Twilio call: {e}", exc_info=True)
            return CallResult(
                success=False,
                call_sid=None,
                provider="twilio",
                error=str(e),
            )

    async def get_call_status(self, call_sid: str) -> dict:
        """Fetch call status and metadata from Twilio."""
        if not self.client:
            return {"status": "unknown", "error": "Twilio client not configured"}

        try:
            call = await asyncio.to_thread(self.client.calls(call_sid).fetch)
            return {
                "status": call.status,
                "duration": getattr(call, "duration", None),
                "direction": getattr(call, "direction", None),
                "answered_by": getattr(call, "answered_by", None),
            }
        except Exception as e:
            logger.error(f"Error fetching Twilio call status for {call_sid}: {e}")
            return {"status": "error", "error": str(e)}

    async def terminate_call(self, call_sid: str) -> bool:
        """Terminate call via Twilio REST API."""
        if not self.client:
            return False

        try:
            await asyncio.to_thread(self.client.calls(call_sid).update, status="completed")
            return True
        except Exception as e:
            logger.error(f"Error terminating Twilio call {call_sid}: {e}")
            return False

