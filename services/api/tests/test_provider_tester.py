import pytest
from app.services.tester import ProviderTester
from app.services.ingest_dispatcher import dispatch_initial_sync


@pytest.mark.asyncio
async def test_tester_groq():
    res = await ProviderTester.test("groq", {"api_key": "gsk_test123456789"})
    assert res["ok"] is True


@pytest.mark.asyncio
async def test_tester_gemini():
    res = await ProviderTester.test("gemini", {"api_key": "AIzaSyTest123456789"})
    assert res["ok"] is True


@pytest.mark.asyncio
async def test_tester_vercel():
    res = await ProviderTester.test("vercel", {"api_key": "test_vercel_token_mock_12345678"})
    assert res["ok"] is True


@pytest.mark.asyncio
async def test_tester_render():
    res = await ProviderTester.test("render", {"api_key": "rnd_test123456789"})
    assert res["ok"] is True


def test_dispatcher_providers():
    # Dispatching with mock celery client should not raise unhandled exception
    assert dispatch_initial_sync("conn-1", "groq") in (True, False)
    assert dispatch_initial_sync("conn-2", "gemini") in (True, False)
    assert dispatch_initial_sync("conn-3", "vercel") in (True, False)
    assert dispatch_initial_sync("conn-4", "render") in (True, False)
    assert dispatch_initial_sync("conn-5", "unknown_provider") is False
