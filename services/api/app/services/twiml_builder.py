import logging
from typing import Optional
from twilio.twiml.voice_response import VoiceResponse, Gather, Say

from app.core.config import settings

logger = logging.getLogger("cirra.telephony.twiml_builder")


class TwiMLBuilder:
    """
    Builds conversational TwiML responses for Twilio Programmable Voice calls.
    """

    def __init__(self, webhook_base_url: Optional[str] = None):
        self.webhook_base = (webhook_base_url or settings.PUBLIC_WEBHOOK_URL).rstrip("/")

    def build_opening(
        self,
        anomaly_snapshot: dict,
        voice_call_id: str,
        llm_explanation: str,
        tenant_id: Optional[str] = None,
    ) -> str:
        """
        Build the opening TwiML delivered when call connects.
        All numbers strictly originate from anomaly_snapshot.
        """
        provider = str(anomaly_snapshot.get("provider") or "cloud/AI")
        try:
            actual_val = float(anomaly_snapshot.get("actual_value") or 0.0)
        except (ValueError, TypeError):
            actual_val = 0.0

        try:
            baseline_val = float(anomaly_snapshot.get("baseline_value") or 0.0)
        except (ValueError, TypeError):
            baseline_val = 0.0

        try:
            deviation_pct = float(anomaly_snapshot.get("deviation_pct") or 0.0)
        except (ValueError, TypeError):
            deviation_pct = 0.0

        excess_spend = max(0.0, actual_val - baseline_val)

        script_lines = [
            "Hello, this is Cirra's AI monitoring assistant.",
            f"We have detected a critical anomaly on your {provider} account.",
            f"Your spend today is ${actual_val:.2f}, which is {deviation_pct:.0f} percent above your normal baseline of ${baseline_val:.2f}.",
            f"Estimated excess spend so far: ${excess_spend:.2f}.",
            llm_explanation.strip() if llm_explanation else "",
            "To acknowledge this incident, say 'acknowledge'.",
            "To hear your options, say 'options'.",
            "To request a kill switch, say 'disable key'.",
            "To repeat this message, say 'repeat'.",
        ]
        opening_script = " ".join([line for line in script_lines if line])

        response = VoiceResponse()
        tenant_param = f"&tenant_id={tenant_id}" if tenant_id else ""
        gather_action = (
            f"{self.webhook_base}/api/v1/voice/webhooks/twilio/respond"
            f"?voice_call_id={voice_call_id}&turn=1{tenant_param}"
        )

        gather = Gather(
            input="speech",
            action=gather_action,
            method="POST",
            timeout=6,
            speech_timeout="auto",
            language="en-IN",
            hints="acknowledge,options,disable key,repeat,yes,no,help,stop,dashboard",
        )
        gather.say(opening_script, voice="Polly.Joanna")
        response.append(gather)

        response.say(
            "We did not hear a response. Please check your Cirra dashboard for full details. Goodbye.",
            voice="Polly.Joanna",
        )

        return str(response)

    def build_turn_response(
        self,
        groq_reply: str,
        voice_call_id: str,
        turn_number: int,
        is_final: bool = False,
        tenant_id: Optional[str] = None,
    ) -> str:
        """
        Build TwiML for conversational turns (turn 2, 3, etc.).
        """
        response = VoiceResponse()

        if is_final or turn_number >= 3:
            response.say(f"{groq_reply.strip()} Goodbye.", voice="Polly.Joanna")
            return str(response)

        tenant_param = f"&tenant_id={tenant_id}" if tenant_id else ""
        next_action = (
            f"{self.webhook_base}/api/v1/voice/webhooks/twilio/respond"
            f"?voice_call_id={voice_call_id}&turn={turn_number + 1}{tenant_param}"
        )
        gather = Gather(
            input="speech",
            action=next_action,
            method="POST",
            timeout=5,
            speech_timeout="auto",
            language="en-IN",
            hints="acknowledge,options,disable key,repeat,yes,no,help,stop,dashboard",
        )
        gather.say(groq_reply.strip(), voice="Polly.Joanna")
        response.append(gather)

        response.say("No response detected. Thank you. Goodbye.", voice="Polly.Joanna")
        return str(response)

    def build_error_twiml(self) -> str:
        """Fallback TwiML when an error occurs during call processing."""
        response = VoiceResponse()
        response.say(
            "We encountered an issue. Please check your Cirra dashboard. Goodbye.",
            voice="Polly.Joanna",
        )
        return str(response)

