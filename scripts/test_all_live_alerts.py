import os
import sys
import time
from pathlib import Path
import httpx
from dotenv import load_dotenv

# Load root .env
repo_root = Path(__file__).resolve().parent.parent
load_dotenv(repo_root / ".env")

print("=" * 60)
print("CIRRA LIVE ALERT CHANNELS TEST")
print("=" * 60)

results = {}

# ─────────────────────────────────────────────────────────────
# 1. NTFY TEST
# ─────────────────────────────────────────────────────────────
print("\n[1/4] Testing ntfy Push Notification...")
ntfy_url = os.getenv("NTFY_TOPIC_URL", "https://ntfy.sh/cirra-alerts-hiten")
print(f"Target: {ntfy_url}")
try:
    headers = {
        "Title": "[LIVE TEST] Cirra Critical Anomaly Alert",
        "Priority": "urgent",
        "Tags": "warning,fire,rotating_light",
        "Click": "https://cirra.dev/dashboard",
        "Actions": "view, View in Cirra, https://cirra.dev/dashboard; view, Approve Kill Switch, https://cirra.dev/actions",
    }
    body = (
        "CRITICAL ALERT: OpenAI GPT-4o spend spiked +341% over baseline.\n"
        "Baseline: $18.00/hr | Actual: $72.00/hr | Extra spend: $54.00/hr\n"
        "Timestamp: " + time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    )
    with httpx.Client(timeout=15.0) as client:
        r = client.post(ntfy_url, headers=headers, content=body.encode("utf-8"))
        print(f"ntfy Response Status: {r.status_code}")
        if r.status_code == 200:
            print("✅ ntfy notification SENT successfully! Check your phone/browser on ntfy.sh/cirra-alerts-hiten")
            results["ntfy"] = "SUCCESS (200)"
        else:
            print(f"❌ ntfy failed: HTTP {r.status_code} - {r.text}")
            results["ntfy"] = f"FAILED ({r.status_code})"
except Exception as e:
    print(f"❌ ntfy exception: {e}")
    results["ntfy"] = f"ERROR: {e}"

# ─────────────────────────────────────────────────────────────
# 2. SLACK WEBHOOK TEST
# ─────────────────────────────────────────────────────────────
print("\n[2/4] Testing Slack Webhook...")
slack_webhook = os.getenv("SLACK_WEBHOOK_URL")
if not slack_webhook or "REPLACE_ME" in slack_webhook:
    print("⚠️ SLACK_WEBHOOK_URL is missing or placeholder.")
    results["slack"] = "SKIPPED (missing URL)"
else:
    print(f"Target: {slack_webhook[:40]}...")
    payload = {
        "text": "<!channel> 🚨 *[LIVE TEST] CIRRA CRITICAL SPEND ANOMALY*",
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🚨 CIRRA LIVE ALERT: CRITICAL Spend Spike",
                    "emoji": True,
                },
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": "*Provider:*\nOpenAI (gpt-4o)"},
                    {"type": "mrkdwn", "text": "*Severity:*\nCRITICAL"},
                    {"type": "mrkdwn", "text": "*Baseline:*\n$18.00/hr"},
                    {"type": "mrkdwn", "text": "*Actual:*\n$72.00/hr (+341%)"},
                ],
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Live test alert generated to verify channel connectivity. All systems operational.",
                },
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "🛑 Kill Key", "emoji": True},
                        "url": "http://localhost:3000/actions",
                        "style": "danger",
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "🔍 View in Cirra", "emoji": True},
                        "url": "http://localhost:3000/dashboard",
                        "style": "primary",
                    },
                ],
            },
        ],
    }
    try:
        with httpx.Client(timeout=15.0) as client:
            r = client.post(slack_webhook, json=payload)
            print(f"Slack Response Status: {r.status_code}")
            if r.status_code == 200:
                print("✅ Slack message POSTED successfully! Check #cirra-alerts in Slack")
                results["slack"] = "SUCCESS (200)"
            else:
                print(f"❌ Slack failed: HTTP {r.status_code} - {r.text}")
                results["slack"] = f"FAILED ({r.status_code})"
    except Exception as e:
        print(f"❌ Slack exception: {e}")
        results["slack"] = f"ERROR: {e}"

# ─────────────────────────────────────────────────────────────
# 3. GITHUB PR TEST
# ─────────────────────────────────────────────────────────────
print("\n[3/4] Testing GitHub PR Generation...")
app_id = os.getenv("GITHUB_APP_ID")
install_id = os.getenv("GITHUB_INSTALLATION_ID")
pk_path = os.getenv("GITHUB_APP_PRIVATE_KEY")
repo_owner = os.getenv("GITHUB_DEMO_REPO_OWNER", "j25aiml192-hash")
repo_name = os.getenv("GITHUB_DEMO_REPO_NAME", "cirra-demo-infra")

print(f"Target Repo: {repo_owner}/{repo_name}")
try:
    from jose import jwt
    from github import Github

    pk_clean = pk_path.strip().strip('"\'')
    if os.path.exists(pk_clean):
        with open(pk_clean, "r", encoding="utf-8") as f:
            private_key = f.read().strip()
    else:
        private_key = pk_path.replace("\\n", "\n").strip()

    now_ts = int(time.time())
    payload = {
        "iat": now_ts - 30,
        "exp": now_ts + 500,
        "iss": str(app_id),
    }
    app_jwt = jwt.encode(payload, private_key, algorithm="RS256")

    token_url = f"https://api.github.com/app/installations/{install_id}/access_tokens"
    headers = {
        "Authorization": f"Bearer {app_jwt}",
        "Accept": "application/vnd.github.v3+json",
    }
    with httpx.Client(timeout=15.0) as client:
        tok_resp = client.post(token_url, headers=headers)
        if tok_resp.status_code not in (200, 201):
            raise Exception(f"Failed to get installation token: HTTP {tok_resp.status_code} - {tok_resp.text}")
        token = tok_resp.json()["token"]

    g = Github(token)
    repo = g.get_repo(f"{repo_owner}/{repo_name}")
    default_branch = repo.get_branch(repo.default_branch or "main")
    
    test_id = int(time.time())
    new_branch = f"cirra/test-alert-{test_id}"
    repo.create_git_ref(ref=f"refs/heads/{new_branch}", sha=default_branch.commit.sha)
    print(f"Created branch: {new_branch}")

    file_path = f"terraform/anomaly-reports/test-alert-{test_id}.md"
    file_content = (
        f"# Cirra Remediation Plan [TEST]\n\n"
        f"**Generated at:** {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}\n"
        f"**Provider:** OpenAI\n"
        f"**Severity:** Critical\n"
        f"**Action:** Auto-quarantine simulated.\n"
    )
    repo.create_file(
        path=file_path,
        message=f"cirra: anomaly alert test {test_id}",
        content=file_content,
        branch=new_branch,
    )
    print(f"Created report file: {file_path}")

    pr = repo.create_pull(
        title=f"[CIRRA ALERT] Critical Anomaly Quarantine Test #{test_id}",
        body="Automated PR generated by Cirra Sentinel alert test suite.\n\n- Provider: `openai`\n- Severity: `CRITICAL`\n- Status: Verified.",
        head=new_branch,
        base=repo.default_branch or "main",
    )
    print(f"✅ GitHub PR CREATED: {pr.html_url}")
    results["github_pr"] = f"SUCCESS ({pr.html_url})"
except Exception as e:
    print(f"❌ GitHub PR exception: {e}")
    results["github_pr"] = f"ERROR: {e}"

# ─────────────────────────────────────────────────────────────
# 4. VOICE CALL TEST (Twilio)
# ─────────────────────────────────────────────────────────────
print("\n[4/4] Testing Voice Call (Twilio Outbound Call)...")
twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
twilio_from = os.getenv("TWILIO_FROM_NUMBER", "+17372508034")
to_phone = os.getenv("VAPI_ALERT_PHONE_NUMBER", "+918910095002")

print(f"From: {twilio_from} -> To: {to_phone}")
try:
    from twilio.rest import Client
    client = Client(twilio_sid, twilio_token)
    
    # Check Twilio account status
    acc = client.api.accounts(twilio_sid).fetch()
    is_trial = acc.type.lower() == "trial"
    
    if is_trial:
        print(f"⚠️ Twilio account '{acc.friendly_name}' is in TRIAL mode.")
        print("Note: In Twilio Trial accounts, destination numbers must be verified in the Twilio Console.")
    
    webhook_base = os.getenv("PUBLIC_WEBHOOK_URL", "https://almanac-unflawed-gents.ngrok-free.dev").rstrip("/")
    twiml_url = f"{webhook_base}/api/v1/voice/webhooks/twilio/twiml?tenant_id=00000000-0000-0000-0000-000000000001"
    status_url = f"{webhook_base}/api/v1/voice/webhooks/twilio/status"
    print(f"Using live webhook URL for Groq conversational speech: {twiml_url}")
    call = client.calls.create(
        url=twiml_url,
        to=to_phone,
        from_=twilio_from,
        status_callback=status_url,
    )
    print(f"✅ Twilio Call INITIATED! CallSid: {call.sid}, Status: {call.status}")
    print(f"📞 Calling {to_phone}... Your phone should ring now!")
    results["voice_call"] = f"SUCCESS (CallSid: {call.sid})"
except Exception as e:
    err_str = str(e)
    print(f"❌ Twilio voice call failed: {err_str}")
    if "trial accounts have limited parameter access" in err_str or "unverified" in err_str.lower():
        print("\n💡 TWILIO TRIAL REQUIREMENT:")
        print(f"   Twilio trial accounts can only call numbers verified in your Twilio Console.")
        print(f"   Please verify '{to_phone}' at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified")
    results["voice_call"] = f"FAILED: {err_str}"

print("\n" + "=" * 60)
print("SUMMARY OF LIVE ALERT CHANNEL TESTS:")
print("=" * 60)
for ch, res in results.items():
    print(f"  {ch.upper():12}: {res}")
print("=" * 60)
