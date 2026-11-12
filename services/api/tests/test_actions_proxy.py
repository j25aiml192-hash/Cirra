import pytest
from unittest.mock import AsyncMock, patch
from httpx import Response
from starlette.testclient import TestClient

from app.main import app
from app.core.security import create_cirra_token

client = TestClient(app)

TENANT_ID = "00000000-0000-0000-0000-000000000001"
USER_ID = "00000000-0000-0000-0000-000000000002"
AUTH_TOKEN = create_cirra_token(tenant_id=TENANT_ID, user_id=USER_ID, role="admin")
AUTH_HEADERS = {"Authorization": f"Bearer {AUTH_TOKEN}"}


@patch("httpx.AsyncClient.post")
def test_proxy_propose_action(mock_post):
    mock_post.return_value = Response(
        status_code=201,
        json={
            "id": "action-123",
            "status": "dry_run",
            "dry_run_result_json": {"action_executable": True},
        },
    )

    resp = client.post(
        "/api/v1/actions/propose",
        headers=AUTH_HEADERS,
        json={
            "action_type": "kill_switch",
            "provider": "openai",
            "target_key_id": "mock_key_1",
            "tenant_id": TENANT_ID,
        },
    )
    assert resp.status_code == 201
    assert resp.json()["id"] == "action-123"
    assert resp.json()["status"] == "dry_run"


@patch("httpx.AsyncClient.post")
def test_proxy_approve_action(mock_post):
    mock_post.return_value = Response(
        status_code=200,
        json={
            "status": "verified",
            "action": {"id": "action-123", "status": "verified"},
            "pr_url": "https://github.com/j25aiml192-hash/cirra-demo-infra/pull/1",
        },
    )

    resp = client.post(
        "/api/v1/actions/action-123/approve",
        headers=AUTH_HEADERS,
        json={"approved_by_user_id": USER_ID},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "verified"


@patch("httpx.AsyncClient.get")
def test_proxy_list_savings(mock_get):
    mock_get.return_value = Response(
        status_code=200,
        json={
            "identified_total": 5000.0,
            "approved_total": 0.0,
            "verified_total": 3500.0,
            "entries": [],
        },
    )

    resp = client.get(
        "/api/v1/savings",
        headers=AUTH_HEADERS,
    )
    assert resp.status_code == 200
    assert resp.json()["identified_total"] == 5000.0
