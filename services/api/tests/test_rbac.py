import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_viewer_cannot_post_connections(client: AsyncClient, token_tenant_a_viewer):
    res = await client.post(
        "/api/v1/connections",
        json={
            "name": "Unauthorized Attempt",
            "provider": "aws",
            "credentials": {"access_key_id": "test"}
        },
        headers={"Authorization": f"Bearer {token_tenant_a_viewer}"}
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"
    assert "admin privileges" in res.json()["error"]["message"]


@pytest.mark.asyncio
async def test_viewer_cannot_delete_connections(client: AsyncClient, token_tenant_a_viewer):
    fake_id = "00000000-0000-0000-0000-000000000001"
    res = await client.delete(
        f"/api/v1/connections/{fake_id}",
        headers={"Authorization": f"Bearer {token_tenant_a_viewer}"}
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_viewer_cannot_invite_team_members(client: AsyncClient, token_tenant_a_viewer):
    res = await client.post(
        "/api/v1/team/invite",
        json={"email": "newbie@acme.com", "role": "viewer"},
        headers={"Authorization": f"Bearer {token_tenant_a_viewer}"}
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"
