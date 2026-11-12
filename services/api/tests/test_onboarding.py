import hashlib
import uuid
import pytest
import pytest_asyncio
import asyncpg
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch

from app.main import app
from app.core.config import settings
from app.core.security import create_cirra_token
from app.core.encryption import decrypt_string
from app.services.onboarding_service import onboarding_service

WIZARD_TENANT_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc"
WIZARD_USER_ID = "c1111111-1111-1111-1111-111111111111"
TENANT_ZERO_ID = "00000000-0000-0000-0000-000000000001"
TENANT_ZERO_USER_ID = "00000000-0000-0000-0000-000000000002"


@pytest_asyncio.fixture(autouse=True)
async def setup_wizard_tenant():
    """Ensure a clean test tenant exists with onboarding_complete=false before tests and is cleaned up after."""
    conn = await asyncpg.connect("postgresql://postgres:postgrespassword@localhost:5432/cirra")
    try:
        # Clean any prior artifacts for this tenant
        await conn.execute("DELETE FROM onboarding_state WHERE tenant_id = $1::uuid", WIZARD_TENANT_ID)
        await conn.execute("DELETE FROM tenant_settings WHERE tenant_id = $1::uuid", WIZARD_TENANT_ID)
        await conn.execute("DELETE FROM api_keys WHERE tenant_id = $1::uuid", WIZARD_TENANT_ID)
        await conn.execute("DELETE FROM users WHERE tenant_id = $1::uuid", WIZARD_TENANT_ID)
        await conn.execute("""
            INSERT INTO tenants (id, name, plan, onboarding_complete)
            VALUES ($1::uuid, 'Test Setup Wizard Co', 'starter', false)
            ON CONFLICT (id) DO UPDATE SET name = 'Test Setup Wizard Co', onboarding_complete = false, setup_completed_at = NULL
        """, WIZARD_TENANT_ID)
        await conn.execute("""
            INSERT INTO users (id, tenant_id, email, role)
            VALUES ($1::uuid, $2::uuid, 'admin@wizardtest.com', 'admin')
            ON CONFLICT (id) DO NOTHING
        """, WIZARD_USER_ID, WIZARD_TENANT_ID)
    finally:
        await conn.close()

    yield

    conn = await asyncpg.connect("postgresql://postgres:postgrespassword@localhost:5432/cirra")
    try:
        await conn.execute("DELETE FROM onboarding_state WHERE tenant_id = $1::uuid", WIZARD_TENANT_ID)
        await conn.execute("DELETE FROM tenant_settings WHERE tenant_id = $1::uuid", WIZARD_TENANT_ID)
        await conn.execute("DELETE FROM api_keys WHERE tenant_id = $1::uuid", WIZARD_TENANT_ID)
        await conn.execute("DELETE FROM users WHERE tenant_id = $1::uuid", WIZARD_TENANT_ID)
        await conn.execute("DELETE FROM tenants WHERE id = $1::uuid", WIZARD_TENANT_ID)
    finally:
        await conn.close()


@pytest.fixture
def wizard_token():
    return create_cirra_token(tenant_id=WIZARD_TENANT_ID, user_id=WIZARD_USER_ID, role="admin")


@pytest.fixture
def wizard_headers(wizard_token):
    return {"Authorization": f"Bearer {wizard_token}"}


@pytest.fixture
def tenant_zero_token():
    return create_cirra_token(tenant_id=TENANT_ZERO_ID, user_id=TENANT_ZERO_USER_ID, role="admin")


@pytest_asyncio.fixture
async def asyncpg_conn():
    conn = await asyncpg.connect("postgresql://postgres:postgrespassword@localhost:5432/cirra")
    yield conn
    await conn.close()


# ══════════════════════════════════════════════════════════════════
# WIZARD ROUTER STEP-BY-STEP TESTS (E2E FLOW)
# ══════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_onboarding_status_initial(client: AsyncClient, wizard_headers):
    """GET /status should return default onboarding state with current_step=1."""
    resp = await client.get("/api/v1/onboarding/status", headers=wizard_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["tenant_id"] == WIZARD_TENANT_ID
    assert data["current_step"] == 1
    assert data["completed_steps"] == []
    assert data["step1_completed"] is False
    assert data["wizard_completed"] is False


@pytest.mark.asyncio
async def test_step1_validation_and_completion(client: AsyncClient, wizard_headers):
    """Step 1 validation and completion."""
    # Invalid: empty company name
    resp = await client.post(
        "/api/v1/onboarding/step/1",
        headers=wizard_headers,
        json={"company_name": " ", "company_size": "startup", "primary_use_case": "cost_control"},
    )
    assert resp.status_code in (400, 422)

    # Invalid company size
    resp = await client.post(
        "/api/v1/onboarding/step/1",
        headers=wizard_headers,
        json={"company_name": "Acme New", "company_size": "colossal", "primary_use_case": "cost_control"},
    )
    assert resp.status_code in (400, 422)

    # Invalid use case
    resp = await client.post(
        "/api/v1/onboarding/step/1",
        headers=wizard_headers,
        json={"company_name": "Acme New", "company_size": "smb", "primary_use_case": "invalid_case"},
    )
    assert resp.status_code in (400, 422)

    # Valid submission
    resp = await client.post(
        "/api/v1/onboarding/step/1",
        headers=wizard_headers,
        json={"company_name": "Initech Systems", "company_size": "startup", "primary_use_case": "both"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["company_name"] == "Initech Systems"
    assert data["company_size"] == "startup"
    assert data["primary_use_case"] == "both"
    assert data["step1_completed"] is True
    assert data["current_step"] == 2
    assert 1 in data["completed_steps"]


@pytest.mark.asyncio
async def test_step2_connect_connections(client: AsyncClient, wizard_headers):
    """Step 2: Connect external API providers, encrypt keys, and handle duplicate silently."""
    # First complete step 1
    await client.post(
        "/api/v1/onboarding/step/1",
        headers=wizard_headers,
        json={"company_name": "Initech Systems", "company_size": "startup", "primary_use_case": "both"},
    )

    # Invalid: empty connections
    resp = await client.post(
        "/api/v1/onboarding/step/2",
        headers=wizard_headers,
        json={"connections": []},
    )
    assert resp.status_code in (400, 422)

    # Valid connections: OpenAI and Groq test keys
    test_openai_key = "sk-test-proj-123456789012345678"
    test_groq_key = "gsk_test_groq_key_123456789012345"
    resp = await client.post(
        "/api/v1/onboarding/step/2",
        headers=wizard_headers,
        json={
            "connections": [
                {"provider": "openai", "api_key": test_openai_key, "label": "OpenAI Prod"},
                {"provider": "groq", "api_key": test_groq_key, "label": "Groq Fast"},
            ]
        },
    )
    assert resp.status_code == 200
    res_data = resp.json()
    assert res_data["connections_created"] == 2
    state = res_data["onboarding_state"]
    assert state["step2_completed"] is True
    assert state["current_step"] == 3
    assert 2 in state["completed_steps"]

    # Verify keys in database
    conn = await asyncpg.connect("postgresql://postgres:postgrespassword@localhost:5432/cirra")
    try:
        rows = await conn.fetch("SELECT * FROM api_keys WHERE tenant_id = $1::uuid", WIZARD_TENANT_ID)
        assert len(rows) == 2
        for r in rows:
            assert r["status"] == "active"
            assert r["source"] == "wizard"
            assert r["is_monitored"] is True
            # Verify Fernet decryption
            decrypted = decrypt_string(r["encrypted_key"])
            assert decrypted in (test_openai_key, test_groq_key)
            assert r["key_hash"] == hashlib.sha256(decrypted.encode("utf-8")).hexdigest()
            assert r["prefix"] == decrypted[:8]

        # Duplicate submission: should skip silently without creating duplicates
        resp_dup = await client.post(
            "/api/v1/onboarding/step/2",
            headers=wizard_headers,
            json={
                "connections": [
                    {"provider": "openai", "api_key": test_openai_key, "label": "OpenAI Prod"},
                ]
            },
        )
        assert resp_dup.status_code == 200
        assert resp_dup.json()["connections_created"] == 0
        rows_after = await conn.fetch("SELECT * FROM api_keys WHERE tenant_id = $1::uuid", WIZARD_TENANT_ID)
        assert len(rows_after) == 2
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_step3_configure_and_upsert_settings(client: AsyncClient, wizard_headers):
    """Step 3: Validation of alert_phone, spend_cap, quiet_hours, and upsert into tenant_settings."""
    # Invalid phone format
    resp = await client.post(
        "/api/v1/onboarding/step/3",
        headers=wizard_headers,
        json={"alert_phone": "12345"},
    )
    assert resp.status_code in (400, 422)

    # Invalid quiet hours: start equals end
    resp = await client.post(
        "/api/v1/onboarding/step/3",
        headers=wizard_headers,
        json={
            "alert_phone": "+14155552671",
            "quiet_hours_start": 10,
            "quiet_hours_end": 10,
        },
    )
    assert resp.status_code in (400, 422)

    # Invalid spend cap: negative
    resp = await client.post(
        "/api/v1/onboarding/step/3",
        headers=wizard_headers,
        json={
            "alert_phone": "+14155552671",
            "spend_cap_usd": -100,
        },
    )
    assert resp.status_code in (400, 422)

    # Valid submission
    resp = await client.post(
        "/api/v1/onboarding/step/3",
        headers=wizard_headers,
        json={
            "alert_phone": "+14155552671",
            "slack_webhook": "https://hooks.slack.com/services/test/mock_webhook",
            "ntfy_topic": "https://ntfy.sh/cirra-test-alerts",
            "spend_cap_usd": 1500.0,
            "quiet_hours_start": 23,
            "quiet_hours_end": 7,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["step3_completed"] is True
    assert data["current_step"] == 4
    assert 3 in data["completed_steps"]

    # Verify tenant_settings in DB
    conn = await asyncpg.connect("postgresql://postgres:postgrespassword@localhost:5432/cirra")
    try:
        setting = await conn.fetchrow("SELECT * FROM tenant_settings WHERE tenant_id = $1::uuid", WIZARD_TENANT_ID)
        assert setting is not None
        assert setting["alert_phone"] == "+14155552671"
        assert setting["slack_webhook_url"] == "https://hooks.slack.com/services/test/mock_webhook"
        assert setting["ntfy_topic_url"] == "https://ntfy.sh/cirra-test-alerts"
        assert float(setting["spend_cap_usd"]) == 1500.0
        assert setting["quiet_hours_start"] == 23
        assert setting["quiet_hours_end"] == 7
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_step4_verify_connectivity_and_step5_complete(client: AsyncClient, wizard_headers):
    """Step 4 connectivity verification and Step 5 wizard completion."""
    # Perform Step 1
    await client.post(
        "/api/v1/onboarding/step/1",
        headers=wizard_headers,
        json={"company_name": "Initech Systems", "company_size": "startup", "primary_use_case": "both"},
    )
    # Perform Step 2
    await client.post(
        "/api/v1/onboarding/step/2",
        headers=wizard_headers,
        json={
            "connections": [
                {"provider": "openai", "api_key": "sk-test-proj-123456789012345678", "label": "OpenAI"},
                {"provider": "groq", "api_key": "gsk_test_groq_key_123456789012345", "label": "Groq"},
                {"provider": "anthropic", "api_key": "sk-ant-test-key-1234567890", "label": "Anthropic"},
            ]
        },
    )
    # Perform Step 3
    await client.post(
        "/api/v1/onboarding/step/3",
        headers=wizard_headers,
        json={
            "alert_phone": "+14155552671",
            "slack_webhook": "https://hooks.slack.com/services/test/mock",
        },
    )

    # Perform Step 4 Verify
    resp_v = await client.post("/api/v1/onboarding/step/4", headers=wizard_headers)
    assert resp_v.status_code == 200
    v_data = resp_v.json()
    assert "checks" in v_data
    assert v_data["all_critical_passed"] is True
    assert v_data["can_proceed"] is True

    # Check verification details
    check_types = {c["type"] for c in v_data["checks"]}
    assert "api_key" in check_types
    assert "slack" in check_types
    assert "phone" in check_types

    # Step 5 Complete Wizard
    resp_c = await client.post("/api/v1/onboarding/complete", headers=wizard_headers)
    assert resp_c.status_code == 200
    c_data = resp_c.json()
    assert c_data["success"] is True
    assert c_data["tenant_id"] == WIZARD_TENANT_ID
    assert c_data["dashboard_url"] == "/dashboard"

    # Verify DB: tenant onboarding_complete is True and wizard_completed is True
    conn = await asyncpg.connect("postgresql://postgres:postgrespassword@localhost:5432/cirra")
    try:
        t_row = await conn.fetchrow("SELECT onboarding_complete, setup_completed_at FROM tenants WHERE id = $1::uuid", WIZARD_TENANT_ID)
        assert t_row["onboarding_complete"] is True
        assert t_row["setup_completed_at"] is not None

        s_row = await conn.fetchrow("SELECT wizard_completed, completed_at, current_step FROM onboarding_state WHERE tenant_id = $1::uuid", WIZARD_TENANT_ID)
        assert s_row["wizard_completed"] is True
        assert s_row["completed_at"] is not None
        assert s_row["current_step"] == 5
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_reset_wizard(client: AsyncClient, wizard_headers):
    """Test reset_wizard in development and verify blocked in production."""
    # First set step 1
    await client.post(
        "/api/v1/onboarding/step/1",
        headers=wizard_headers,
        json={"company_name": "Reset Corp", "company_size": "enterprise", "primary_use_case": "security"},
    )

    # Reset
    resp = await client.post("/api/v1/onboarding/reset", headers=wizard_headers)
    assert resp.status_code == 200
    r_data = resp.json()
    assert r_data["success"] is True
    assert r_data["onboarding_state"]["current_step"] == 1
    assert r_data["onboarding_state"]["step1_completed"] is False

    # Block in production
    with patch.object(settings, "ENVIRONMENT", "production"):
        resp_prod = await client.post("/api/v1/onboarding/reset", headers=wizard_headers)
        assert resp_prod.status_code == 403


# ══════════════════════════════════════════════════════════════════
# ONBOARDING GUARD MIDDLEWARE TESTS
# ══════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_onboarding_guard_blocks_unonboarded_tenant(client: AsyncClient, wizard_headers):
    """Non-onboarded tenant attempting to access protected endpoints receives 403 onboarding_required."""
    # Attempting to access protected endpoint (/api/v1/team)
    resp = await client.get("/api/v1/team", headers=wizard_headers)
    assert resp.status_code == 403
    data = resp.json()
    assert data["error"] == "onboarding_required"
    assert data["redirect"] == "/onboarding"
    assert data["current_step"] == 1


@pytest.mark.asyncio
async def test_onboarding_guard_exempt_routes(client: AsyncClient, wizard_headers):
    """Onboarding routes, auth routes, health, and openapi docs are never blocked by guard."""
    # Onboarding status
    resp = await client.get("/api/v1/onboarding/status", headers=wizard_headers)
    assert resp.status_code == 200

    # Health
    resp_h = await client.get("/health")
    assert resp_h.status_code == 200

    # Docs
    resp_d = await client.get("/docs")
    assert resp_d.status_code == 200


@pytest.mark.asyncio
async def test_onboarding_guard_skips_tenant_zero(client: AsyncClient, tenant_zero_token):
    """Tenant zero is explicitly exempt from OnboardingGuard even if onboarding_complete is false."""
    headers = {"Authorization": f"Bearer {tenant_zero_token}"}
    # Attempting to access an endpoint with tenant zero should not receive 403 onboarding_required
    resp = await client.get("/api/v1/team", headers=headers)
    # Status should be 200 (or regular route response), definitely NOT 403 onboarding_required
    assert resp.status_code != 403 or resp.json().get("error") != "onboarding_required"


@pytest.mark.asyncio
async def test_onboarding_guard_allows_completed_tenant(client: AsyncClient, wizard_headers):
    """Once onboarding is completed, protected endpoints are accessible."""
    conn = await asyncpg.connect("postgresql://postgres:postgrespassword@localhost:5432/cirra")
    try:
        await conn.execute("UPDATE tenants SET onboarding_complete = true WHERE id = $1::uuid", WIZARD_TENANT_ID)
    finally:
        await conn.close()

    resp = await client.get("/api/v1/team", headers=wizard_headers)
    # With onboarding_complete=true, guard passes and user can access team endpoint
    assert resp.status_code == 200


# ══════════════════════════════════════════════════════════════════
# DIRECT ASYNCPG SERVICE COMPATIBILITY TEST
# ══════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_service_direct_with_asyncpg(asyncpg_conn):
    """Verify OnboardingService directly operates with raw asyncpg.Connection."""
    state = await onboarding_service.get_or_create_wizard(WIZARD_TENANT_ID, asyncpg_conn)
    assert state["tenant_id"] == WIZARD_TENANT_ID
    assert state["current_step"] == 1

    updated = await onboarding_service.complete_step1_company(
        tenant_id=WIZARD_TENANT_ID,
        company_name="Asyncpg Directly Tested Inc",
        company_size="enterprise",
        primary_use_case="cost_control",
        conn=asyncpg_conn,
    )
    assert updated["company_name"] == "Asyncpg Directly Tested Inc"
    assert updated["step1_completed"] is True
    assert updated["current_step"] == 2

    # Verify reset with asyncpg
    reset = await onboarding_service.reset_wizard(WIZARD_TENANT_ID, asyncpg_conn)
    assert reset["success"] is True
    assert reset["onboarding_state"]["current_step"] == 1
