"""
End-to-end test: trigger a real outbound call via Twilio + Groq.

Prerequisites:
  - ngrok running: https://almanac-unflawed-gents.ngrok-free.dev
  - services/api running: uvicorn app.main:app --port 8000
  - TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env
  - +918910095002 verified in Twilio console

This test:
1. Ensures test anomaly exists in PostgreSQL with real-looking values.
2. Directly calls VoiceAlertService.trigger_alert_call().
3. Prints the voice_call_id and call_sid.
4. Polls GET /api/v1/voice/calls/{id} every 5 seconds for up to 60 seconds.
5. Prints status updates as they arrive.
6. Prints the final transcript when call completes.
"""

import asyncio
import json
import os
import sys
import time
from decimal import Decimal
import asyncpg
import httpx

# Ensure app path is resolvable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from app.core.config import settings
from app.services.voice_alert_service import VoiceAlertService

FAKE_ANOMALY = {
    "id": "00000000-0000-0000-0000-000000000099",
    "provider": "openai",
    "severity": "critical",
    "baseline_value": Decimal("56.20"),
    "actual_value": Decimal("247.80"),
    "deviation_pct": Decimal("340.71"),
    "api_key_id": "mock_key_sk_prod_001",
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "explanation": "OpenAI key mock_key_sk_prod_001 spent $247.80 today, 341% above normal baseline.",
    "series_key": "openai:mock_key_sk_prod_001:daily_cost",
}


async def ensure_anomaly_exists(conn: asyncpg.Connection):
    """Ensure the test anomaly exists in the anomalies table for foreign key integrity."""
    await conn.execute(f"SET app.tenant_id = '{FAKE_ANOMALY['tenant_id']}';")
    await conn.execute("DELETE FROM voice_calls WHERE anomaly_id = $1::uuid;", FAKE_ANOMALY["id"])
    await conn.execute(
        """
        INSERT INTO anomalies (
            id, tenant_id, series_key, provider, api_key_id,
            detected_at, severity, status, baseline_value,
            actual_value, deviation_pct, explanation, alert_sent,
            call_triggered, created_at
        ) VALUES (
            $1::uuid, $2::uuid, $3, $4, $5,
            now(), $6, 'open', $7,
            $8, $9, $10, true,
            true, now()
        )
        ON CONFLICT (id) DO UPDATE SET
            actual_value = EXCLUDED.actual_value,
            deviation_pct = EXCLUDED.deviation_pct,
            explanation = EXCLUDED.explanation;
        """,
        FAKE_ANOMALY["id"],
        FAKE_ANOMALY["tenant_id"],
        FAKE_ANOMALY["series_key"],
        FAKE_ANOMALY["provider"],
        FAKE_ANOMALY["api_key_id"],
        FAKE_ANOMALY["severity"],
        FAKE_ANOMALY["baseline_value"],
        FAKE_ANOMALY["actual_value"],
        FAKE_ANOMALY["deviation_pct"],
        FAKE_ANOMALY["explanation"],
    )
    print(f"Ensured anomaly {FAKE_ANOMALY['id']} exists in PostgreSQL.")


async def main():
    print("=" * 60)
    print("CIRRA VOICE ALERT E2E TEST (TWILIO + GROQ)")
    print("=" * 60)
    print(f"Target recipient : {settings.VAPI_ALERT_PHONE_NUMBER}")
    print(f"Twilio from      : {settings.TWILIO_FROM_NUMBER}")
    print(f"Public Webhook   : {settings.PUBLIC_WEBHOOK_URL}")
    print(f"Twilio Account   : {settings.TWILIO_ACCOUNT_SID[:8]}...")
    print("-" * 60)

    # 1. Connect to PostgreSQL
    admin_url = "postgresql://postgres:postgrespassword@localhost:5432/cirra"
    conn = await asyncpg.connect(admin_url)

    try:
        await ensure_anomaly_exists(conn)

        # 2. Trigger Outbound Call
        service = VoiceAlertService()
        print(f"Provider class   : {service.provider.__class__.__name__}")
        print("Triggering outbound alert call...")

        voice_call_id = await service.trigger_alert_call(
            anomaly=FAKE_ANOMALY,
            tenant_id=FAKE_ANOMALY["tenant_id"],
            conn=conn,
        )

        print(f"\nCreated voice_call_id : {voice_call_id}")

        # Fetch initial call_sid
        row = await conn.fetchrow("SELECT call_sid, status FROM voice_calls WHERE id = $1::uuid", voice_call_id)
        call_sid = row["call_sid"] if row else None
        print(f"Twilio call_sid       : {call_sid}")
        print(f"Initial DB status     : {row['status'] if row else 'unknown'}")
        print("\n--> Outbound call dispatched! Your phone should ring shortly.")
        print("--> Speak to Cirra when prompted (e.g., 'acknowledge', 'options', 'disable key')\n")

        # 3. Poll for call progress and transcript
        print("Polling call status and transcript (up to 120s)...")
        start_time = time.time()
        prev_status = None
        prev_transcript_len = 0

        while time.time() - start_time < 120:
            row = await conn.fetchrow(
                """
                SELECT status, outcome, duration_seconds, turn_count, transcript, error_message
                FROM voice_calls
                WHERE id = $1::uuid
                """,
                voice_call_id,
            )

            if row:
                status = row["status"]
                outcome = row["outcome"]
                duration = row["duration_seconds"]
                transcript = row["transcript"] or []
                if isinstance(transcript, str):
                    transcript = json.loads(transcript)

                if status != prev_status or len(transcript) != prev_transcript_len:
                    elapsed = int(time.time() - start_time)
                    print(f"[{elapsed}s] Status: {status:<12} | Outcome: {str(outcome):<13} | Duration: {str(duration):<4}s | Turns: {len(transcript)}", flush=True)

                    # Print any newly added transcript turns
                    if len(transcript) > prev_transcript_len:
                        for turn in transcript[prev_transcript_len:]:
                            role = turn.get("role", "unknown")
                            text = turn.get("text", "")
                            print(f"      [{role.upper()}]: {text}", flush=True)
                        prev_transcript_len = len(transcript)

                    prev_status = status

                if status in ("completed", "failed", "no-answer"):
                    print(f"\nCall reached terminal state: {status}", flush=True)
                    break

            await asyncio.sleep(4)

        # 4. Final Summary
        final_row = await conn.fetchrow(
            """
            SELECT id::text, call_sid, status, outcome, duration_seconds,
                   turn_count, transcript, error_message, initiated_at, answered_at, ended_at
            FROM voice_calls
            WHERE id = $1::uuid
            """,
            voice_call_id,
        )

        print("\n" + "=" * 60)
        print("FINAL CALL REPORT")
        print("=" * 60)
        if final_row:
            final_transcript = final_row["transcript"] or []
            if isinstance(final_transcript, str):
                final_transcript = json.loads(final_transcript)

            print(f"voice_call_id    : {final_row['id']}")
            print(f"call_sid         : {final_row['call_sid']}")
            print(f"final status     : {final_row['status']}")
            print(f"outcome          : {final_row['outcome']}")
            print(f"duration         : {final_row['duration_seconds']}s")
            print(f"turn count       : {final_row['turn_count']}")
            print(f"error message    : {final_row['error_message']}")
            print(f"initiated_at     : {final_row['initiated_at']}")
            print(f"answered_at      : {final_row['answered_at']}")
            print(f"ended_at         : {final_row['ended_at']}")
            print(f"\nTranscript ({len(final_transcript)} turns):")
            print(json.dumps(final_transcript, indent=2))
        else:
            print("Record not found.")
        print("=" * 60)

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
