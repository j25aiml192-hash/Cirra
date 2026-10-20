import asyncio
import os
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from datetime import timedelta
from app.main import app
from app.core.security import create_cirra_token
from app.core.encryption import encrypt_credentials

TENANT_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
TENANT_B_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"

USER_A_ADMIN_ID = "a1111111-1111-1111-1111-111111111111"
USER_A_VIEWER_ID = "a2222222-2222-2222-2222-222222222222"
USER_B_ADMIN_ID = "b1111111-1111-1111-1111-111111111111"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def token_tenant_a_admin():
    return create_cirra_token(tenant_id=TENANT_A_ID, user_id=USER_A_ADMIN_ID, role="admin")


@pytest.fixture
def token_tenant_a_viewer():
    return create_cirra_token(tenant_id=TENANT_A_ID, user_id=USER_A_VIEWER_ID, role="viewer")


@pytest.fixture
def token_tenant_b_admin():
    return create_cirra_token(tenant_id=TENANT_B_ID, user_id=USER_B_ADMIN_ID, role="admin")
