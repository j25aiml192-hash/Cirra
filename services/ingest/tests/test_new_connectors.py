import asyncio
import os
import pytest
from decimal import Decimal
from connectors.groq_connector import GroqConnector
from connectors.gemini_connector import GeminiConnector
from connectors.vercel_connector import VercelConnector
from connectors.render_connector import RenderConnector
from normalizer import (
    normalize_groq_usage,
    normalize_gemini_usage,
    normalize_vercel_usage,
    normalize_render_usage,
    CostFact,
    AIUsageFact,
)


@pytest.mark.asyncio
async def test_groq_connector_mock():
    os.environ["INGEST_MOCK"] = "true"
    os.environ["COST_MULTIPLIER"] = "25.0"
    g = GroqConnector(api_key="test", tenant_id="test-tenant")
    data = await g.fetch()
    assert len(data) >= 20
    assert isinstance(data[0], AIUsageFact)
    assert data[0].provider == "groq"
    assert isinstance(data[0].cost_usd, Decimal)
    assert data[0].cost_usd > 0
    print(f"Groq: {len(data)} records, first cost: {data[0].cost_usd}")


@pytest.mark.asyncio
async def test_gemini_connector_mock():
    os.environ["INGEST_MOCK"] = "true"
    os.environ["COST_MULTIPLIER"] = "25.0"
    gem = GeminiConnector(api_key="test", tenant_id="test-tenant")
    data = await gem.fetch()
    assert len(data) >= 20
    assert isinstance(data[0], AIUsageFact)
    assert data[0].provider == "gemini"
    assert isinstance(data[0].cost_usd, Decimal)
    assert data[0].cost_usd > 0
    print(f"Gemini: {len(data)} records, first cost: {data[0].cost_usd}")


@pytest.mark.asyncio
async def test_vercel_connector_mock():
    os.environ["INGEST_MOCK"] = "true"
    os.environ["COST_MULTIPLIER"] = "25.0"
    v = VercelConnector(api_key="test", tenant_id="test-tenant")
    data = await v.fetch()
    assert len(data) >= 20
    assert isinstance(data[0], CostFact)
    assert data[0].provider == "vercel"
    assert data[0].service_category == "Platform"
    assert isinstance(data[0].billed_cost, Decimal)
    assert data[0].billed_cost > 0
    print(f"Vercel: {len(data)} records, first cost: {data[0].billed_cost}")


@pytest.mark.asyncio
async def test_render_connector_mock():
    os.environ["INGEST_MOCK"] = "true"
    os.environ["COST_MULTIPLIER"] = "25.0"
    r = RenderConnector(api_key="test", tenant_id="test-tenant")
    data = await r.fetch()
    assert len(data) >= 20
    assert isinstance(data[0], CostFact)
    assert data[0].provider == "render"
    assert data[0].service_category == "Platform"
    assert isinstance(data[0].billed_cost, Decimal)
    assert data[0].billed_cost > 0
    print(f"Render: {len(data)} records, first cost: {data[0].billed_cost}")


def test_read_only_assertions():
    from connectors.groq_connector import assert_read_only_request as groq_check
    from connectors.gemini_connector import assert_read_only_request as gemini_check
    from connectors.vercel_connector import assert_read_only_request as vercel_check
    from connectors.render_connector import assert_read_only_request as render_check

    with pytest.raises(PermissionError):
        groq_check("POST", "https://api.groq.com/openai/v1/organization/usage")
    with pytest.raises(PermissionError):
        groq_check("GET", "https://api.groq.com/openai/v1/delete")

    with pytest.raises(PermissionError):
        gemini_check("POST", "https://generativelanguage.googleapis.com/v1beta/models")
    with pytest.raises(PermissionError):
        gemini_check("GET", "https://generativelanguage.googleapis.com/v1beta/bad")

    with pytest.raises(PermissionError):
        vercel_check("DELETE", "https://api.vercel.com/v9/projects")
    with pytest.raises(PermissionError):
        vercel_check("GET", "https://api.vercel.com/v1/bad")

    with pytest.raises(PermissionError):
        render_check("POST", "https://api.render.com/v1/services")
    with pytest.raises(PermissionError):
        render_check("GET", "https://api.render.com/v1/other")
