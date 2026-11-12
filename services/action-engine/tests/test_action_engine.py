import asyncio
import pytest
from datetime import datetime, timezone
from decimal import Decimal
from fastapi.testclient import TestClient

from app.config import settings
from app.db import MockConnection
from app.kill_switch import KillSwitchEngine, KillSwitchResult
from app.github_pr import GitHubPREngine, PRResult
from app.savings_ledger import SavingsLedgerEngine
from app.workflow import ActionWorkflow
from app.main import app

client = TestClient(app)

TENANT_ID = "00000000-0000-0000-0000-000000000001"
USER_ID = "00000000-0000-0000-0000-000000000002"
ANOMALY_ID = "00000000-0000-0000-0000-000000000010"


# --- Kill Switch Tests ---

def test_kill_switch_openai_mock():
    async def _test():
        engine = KillSwitchEngine()
        res = await engine.disable_openai_key("mock_key_openai_123", TENANT_ID)
        assert res.success is True
        assert res.mocked is True
        assert res.provider == "openai"
        assert res.key_id == "mock_key_openai_123"
        assert "MOCK: would have disabled key" in res.message
    asyncio.run(_test())


def test_kill_switch_groq_manual():
    async def _test():
        engine = KillSwitchEngine()
        res = await engine.disable_groq_key("gsk_abc123", TENANT_ID)
        assert res.success is False
        assert res.requires_manual is True
        assert res.provider == "groq"
        assert "console.groq.com/keys" in res.message
    asyncio.run(_test())


def test_kill_switch_anthropic_mock():
    async def _test():
        engine = KillSwitchEngine()
        res = await engine.disable_anthropic_key("mock_key_ant_123", TENANT_ID)
        assert res.success is True
        assert res.mocked is True
        assert res.provider == "anthropic"
    asyncio.run(_test())


def test_kill_switch_gemini_manual():
    async def _test():
        engine = KillSwitchEngine()
        res = await engine.disable_gemini_key("AIzaSyTestKey", TENANT_ID)
        assert res.success is False
        assert res.requires_manual is True
        assert res.provider == "gemini"
        assert "aistudio.google.com/apikey" in res.message
    asyncio.run(_test())


def test_kill_switch_dispatcher():
    async def _test():
        engine = KillSwitchEngine()
        res_openai = await engine.disable_key("OpenAI", "mock_key_1", TENANT_ID)
        assert res_openai.provider == "openai"

        res_groq = await engine.disable_key("Groq", "key_groq", TENANT_ID)
        assert res_groq.requires_manual is True

        res_gemini = await engine.disable_key("gemini", "key_gem", TENANT_ID)
        assert res_gemini.requires_manual is True
    asyncio.run(_test())


# --- GitHub PR Tests ---

def test_github_pr_mock_generation():
    async def _test():
        engine = GitHubPREngine()
        anomaly = {
            "id": ANOMALY_ID,
            "provider": "openai",
            "api_key_id": "mock_key_1",
            "severity": "critical",
            "baseline_value": "50.00",
            "actual_value": "250.00",
            "deviation_pct": "400.00",
            "explanation": "Spend spiked 400%",
        }
        action = {"type": "kill_switch", "target_key_id": "mock_key_1"}
        ks_res = KillSwitchResult(success=True, provider="openai", key_id="mock_key_1", mocked=True, message="Disabled")

        pr = await engine.create_anomaly_pr(anomaly, action, ks_res)
        assert pr.pr_number >= 1
        assert "github.com" in pr.pr_url
        assert "cirra-demo-infra" in pr.pr_url
        assert "remediation" in pr.branch_name
    asyncio.run(_test())


# --- Savings Ledger Tests ---

def test_calculate_counterfactual_savings():
    ledger = SavingsLedgerEngine()
    savings = ledger.calculate_counterfactual_savings(
        baseline_daily_cost=Decimal("50.00"),
        actual_daily_cost=Decimal("250.00"),
        days=30,
    )
    assert savings == Decimal("6000.00")


def test_calculate_unit_cost_savings():
    ledger = SavingsLedgerEngine()
    savings = ledger.calculate_unit_cost_savings(
        baseline_cost_per_token=Decimal("0.0020"),
        new_cost_per_token=Decimal("0.0015"),
        monthly_token_volume=10_000_000,
    )
    assert savings == Decimal("5000.00")


def test_savings_ledger_db_lifecycle():
    async def _test():
        ledger = SavingsLedgerEngine()
        conn = MockConnection(tenant_id=TENANT_ID)

        # 1. Record identified saving
        entry = await ledger.record_identified_saving(
            tenant_id=TENANT_ID,
            anomaly_id=ANOMALY_ID,
            baseline_cost=Decimal("6000.00"),
            conn=conn,
        )
        assert entry["status"] == "identified"
        assert entry["baseline_cost"] == Decimal("6000.00")

        # 2. Record verified saving
        entry_id = entry["id"]
        verified = await ledger.record_verified_saving(
            savings_entry_id=entry_id,
            realized_cost=Decimal("1500.00"),
            period_end=datetime.now(timezone.utc),
            conn=conn,
        )
        assert verified["status"] == "verified"
        assert verified["realized_cost"] == Decimal("1500.00")

        # 3. List savings and totals
        totals = await ledger.list_savings_with_totals(TENANT_ID, conn)
        assert "entries" in totals
        assert totals["verified_total"] > Decimal("0.00")
    asyncio.run(_test())


# --- Workflow Tests ---

def test_workflow_full_lifecycle():
    async def _test():
        wf = ActionWorkflow()
        conn = MockConnection(tenant_id=TENANT_ID)

        # 1. Propose action (runs dry_run automatically)
        action = await wf.propose_action(
            tenant_id=TENANT_ID,
            anomaly_id=ANOMALY_ID,
            action_type="kill_switch",
            provider="openai",
            target_key_id="mock_key_prod_01",
            conn=conn,
        )
        assert action["status"] == "dry_run"
        assert action["dry_run_result_json"] is not None
        assert action["dry_run_result_json"]["action_executable"] is True

        action_id = action["id"]

        # 2. Rejection without human approval
        with pytest.raises(ValueError):
            await wf.execute_approved_action(action_id, approved_by="", conn=conn)

        # 3. Execute approved action
        exec_res = await wf.execute_approved_action(action_id, approved_by=USER_ID, conn=conn)
        assert exec_res["status"] == "verified"
        assert exec_res["action"]["status"] == "verified"
        assert exec_res["action"]["approved_by"] == USER_ID
        assert exec_res["action"]["approved_at"] is not None
        assert exec_res["action"]["executed_at"] is not None
        assert exec_res["action"]["verified_at"] is not None
        assert exec_res["kill_switch_result"]["success"] is True

        # 4. Rollback
        rb = await wf.rollback_action(action_id, reason="Test rollback", conn=conn)
        assert rb["status"] == "rolled_back"
        assert rb["rolled_back_at"] is not None
    asyncio.run(_test())


# --- FastAPI HTTP Endpoint Tests ---

def test_api_health_and_ready():
    r1 = client.get("/health")
    assert r1.status_code == 200
    assert r1.json()["status"] == "ok"
    assert r1.json()["port"] == 8003

    r2 = client.get("/ready")
    assert r2.status_code == 200
    assert r2.json()["status"] == "ready"


def test_api_propose_approve_and_rollback_flow():
    # 1. Propose
    resp = client.post(
        "/actions/propose",
        json={
            "tenant_id": TENANT_ID,
            "anomaly_id": ANOMALY_ID,
            "action_type": "kill_switch",
            "provider": "openai",
            "target_key_id": "mock_key_api_test",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "dry_run"
    assert data["dry_run_result_json"]["action_executable"] is True
    action_id = data["id"]

    # 2. List actions
    list_resp = client.get(f"/actions?tenant_id={TENANT_ID}")
    assert list_resp.status_code == 200
    actions_list = list_resp.json()
    assert len(actions_list) >= 1
    assert any(a["id"] == action_id for a in actions_list)

    # 3. Approve
    appr_resp = client.post(
        f"/actions/{action_id}/approve",
        json={"approved_by_user_id": USER_ID},
    )
    assert appr_resp.status_code == 200
    appr_data = appr_resp.json()
    assert appr_data["status"] == "verified"
    assert appr_data["action"]["approved_by"] == USER_ID

    # 4. Rollback
    rb_resp = client.post(
        f"/actions/{action_id}/rollback",
        json={"reason": "False positive detected by engineering"},
    )
    assert rb_resp.status_code == 200
    assert rb_resp.json()["status"] == "rolled_back"

    # 5. Savings
    sav_resp = client.get(f"/savings?tenant_id={TENANT_ID}")
    assert sav_resp.status_code == 200
    sav_data = sav_resp.json()
    assert "identified_total" in sav_data
    assert "approved_total" in sav_data
    assert "verified_total" in sav_data
    assert "entries" in sav_data
