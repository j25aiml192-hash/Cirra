import uuid
from unittest.mock import patch, AsyncMock
import pytest
from httpx import AsyncClient, Response


@pytest.mark.asyncio
async def test_add_connection_runs_test_automatically(client: AsyncClient, token_tenant_a_admin):
    """Adding a connection automatically tests it and returns test_result and key_preview."""
    mock_resp = Response(status_code=200, json={"data": [{"id": "gpt-4"}]})
    unique_key = f"sk-mock-auto-{uuid.uuid4().hex}"

    with patch("app.services.connections_service.httpx.AsyncClient") as mock_client_cls:
        mock_instance = AsyncMock()
        mock_instance.__aenter__.return_value = mock_instance
        mock_instance.__aexit__.return_value = None
        mock_instance.get.return_value = mock_resp
        mock_client_cls.return_value = mock_instance

        res = await client.post(
            "/api/v1/connections",
            json={
                "provider": "openai",
                "api_key": unique_key,
                "label": "Auto Test OpenAI Key",
                "monthly_spend_cap": 150.0,
            },
            headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
        )

    assert res.status_code == 201
    data = res.json()
    assert "connection_id" in data
    assert data["provider"] == "openai"
    assert data["label"] == "Auto Test OpenAI Key"
    assert "test_result" in data
    assert data["test_result"]["status"] == "ok"
    assert data["test_result"]["http_code"] == 200
    assert "key_preview" in data
    assert "sk-mock-" in data["key_preview"]

    # Security check: never expose secrets
    assert "encrypted_key" not in data
    assert "key_hash" not in data


@pytest.mark.asyncio
async def test_list_connections_no_encrypted_keys(client: AsyncClient, token_tenant_a_admin):
    """Listing connections returns active connections with key_preview and NEVER reveals encrypted_key or key_hash."""
    res = await client.get(
        "/api/v1/connections",
        headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
    )
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)

    for item in items:
        assert "encrypted_key" not in item
        assert "key_hash" not in item
        assert "key_preview" in item
        assert item["status"] != "deleted"


@pytest.mark.asyncio
async def test_delete_connection_soft_delete(client: AsyncClient, token_tenant_a_admin):
    """Soft delete marks connection deleted and removes it from active list and single fetch."""
    mock_resp = Response(status_code=200, json={"data": []})
    unique_key = f"gsk-mock-del-{uuid.uuid4().hex}"

    with patch("app.services.connections_service.httpx.AsyncClient") as mock_client_cls:
        mock_instance = AsyncMock()
        mock_instance.__aenter__.return_value = mock_instance
        mock_instance.__aexit__.return_value = None
        mock_instance.get.return_value = mock_resp
        mock_client_cls.return_value = mock_instance

        res = await client.post(
            "/api/v1/connections",
            json={
                "provider": "groq",
                "api_key": unique_key,
                "label": "Groq Key To Delete",
            },
            headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
        )
    assert res.status_code == 201
    conn_id = res.json()["connection_id"]

    # Delete connection
    del_res = await client.delete(
        f"/api/v1/connections/{conn_id}",
        headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
    )
    assert del_res.status_code == 204

    # Fetching directly should return 404
    get_res = await client.get(
        f"/api/v1/connections/{conn_id}",
        headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
    )
    assert get_res.status_code == 404

    # Listing connections should not contain this connection
    list_res = await client.get(
        "/api/v1/connections",
        headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
    )
    active_ids = [c["id"] for c in list_res.json()]
    assert conn_id not in active_ids


@pytest.mark.asyncio
async def test_update_connection_metadata(client: AsyncClient, token_tenant_a_admin):
    """Updating connection metadata reflects changes without exposing secret keys."""
    mock_resp = Response(status_code=200, json={"data": []})
    unique_key = f"ant-mock-patch-{uuid.uuid4().hex}"

    with patch("app.services.connections_service.httpx.AsyncClient") as mock_client_cls:
        mock_instance = AsyncMock()
        mock_instance.__aenter__.return_value = mock_instance
        mock_instance.__aexit__.return_value = None
        mock_instance.get.return_value = mock_resp
        mock_client_cls.return_value = mock_instance

        res = await client.post(
            "/api/v1/connections",
            json={
                "provider": "anthropic",
                "api_key": unique_key,
                "label": "Original Anthropic Key",
                "monthly_spend_cap": 100.0,
            },
            headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
        )
    assert res.status_code == 201
    conn_id = res.json()["connection_id"]

    patch_res = await client.patch(
        f"/api/v1/connections/{conn_id}",
        json={
            "label": "Renamed Anthropic Production",
            "monthly_spend_cap": 500.0,
            "is_monitored": False,
        },
        headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
    )
    assert patch_res.status_code == 200
    patched = patch_res.json()
    assert patched["label"] == "Renamed Anthropic Production"
    assert patched["monthly_spend_cap"] == 500.0
    assert patched["is_monitored"] is False
    assert "encrypted_key" not in patched
    assert "key_hash" not in patched


@pytest.mark.asyncio
async def test_duplicate_key_rejected(client: AsyncClient, token_tenant_a_admin):
    """Attempting to add duplicate API key for the same tenant should be rejected with 409 Conflict."""
    mock_resp = Response(status_code=200, json={"data": []})
    shared_key = f"sk-dup-{uuid.uuid4().hex}"

    with patch("app.services.connections_service.httpx.AsyncClient") as mock_client_cls:
        mock_instance = AsyncMock()
        mock_instance.__aenter__.return_value = mock_instance
        mock_instance.__aexit__.return_value = None
        mock_instance.get.return_value = mock_resp
        mock_client_cls.return_value = mock_instance

        res1 = await client.post(
            "/api/v1/connections",
            json={
                "provider": "openai",
                "api_key": shared_key,
                "label": "Duplicate Test 1",
            },
            headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
        )
        assert res1.status_code == 201

        res2 = await client.post(
            "/api/v1/connections",
            json={
                "provider": "openai",
                "api_key": shared_key,
                "label": "Duplicate Test 2",
            },
            headers={"Authorization": f"Bearer {token_tenant_a_admin}"},
        )
        assert res2.status_code == 409
        assert res2.json()["error"]["code"] == "DUPLICATE_KEY"
