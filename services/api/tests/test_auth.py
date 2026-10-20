from datetime import timedelta
import pytest
from httpx import AsyncClient
from app.core.security import create_cirra_token


@pytest.mark.asyncio
async def test_missing_token_rejected(client: AsyncClient):
    res = await client.get("/api/v1/connections")
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_malformed_token_rejected(client: AsyncClient):
    res = await client.get(
        "/api/v1/connections",
        headers={"Authorization": "Bearer this-is-not-a-valid-jwt"}
    )
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "INVALID_TOKEN"


@pytest.mark.asyncio
async def test_expired_token_rejected(client: AsyncClient):
    # Create an expired token (-10 minutes)
    expired_token = create_cirra_token(
        tenant_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        user_id="a1111111-1111-1111-1111-111111111111",
        role="admin",
        expires_delta=timedelta(minutes=-10)
    )
    res = await client.get(
        "/api/v1/connections",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "INVALID_TOKEN"
