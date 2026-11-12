import pytest
from fastapi.testclient import TestClient

from app.explainer import ResultExplainer
from app.main import app
from app.rag import rag_retriever
from app.sql_generator import SQLGenerator
from app.sql_validator import SQLValidator

client = TestClient(app)
TENANT_ID = "00000000-0000-0000-0000-000000000001"


def test_health_check():
    from app.main import health
    data = health()
    assert data["status"] == "ok"
    assert data["service"] == "cirra-investigator"


def test_sql_validator_select_only():
    validator = SQLValidator()

    # DDL / DML must be rejected
    res = validator.validate_and_transform("DROP TABLE cost_facts", TENANT_ID)
    assert not res.is_valid
    assert "Forbidden query type" in res.error

    res = validator.validate_and_transform("DELETE FROM cost_facts", TENANT_ID)
    assert not res.is_valid

    res = validator.validate_and_transform("INSERT INTO cost_facts (billed_cost) VALUES (10)", TENANT_ID)
    assert not res.is_valid

    res = validator.validate_and_transform("UPDATE cost_facts SET billed_cost = 0", TENANT_ID)
    assert not res.is_valid


def test_sql_validator_allowed_tables():
    validator = SQLValidator()

    # Disallowed table
    res = validator.validate_and_transform("SELECT * FROM users", TENANT_ID)
    assert not res.is_valid
    assert "prohibited" in res.error

    # Allowed tables
    res1 = validator.validate_and_transform("SELECT sum(billed_cost) FROM cost_facts", TENANT_ID)
    assert res1.is_valid

    res2 = validator.validate_and_transform("SELECT sum(cost_usd) FROM ai_usage_facts", TENANT_ID)
    assert res2.is_valid


def test_sql_validator_tenant_enforcement():
    validator = SQLValidator()

    # Without tenant_id in WHERE -> should inject
    res = validator.validate_and_transform("SELECT * FROM cost_facts", TENANT_ID)
    assert res.is_valid
    assert res.injected_tenant_filter is True
    assert f"tenant_id = '{TENANT_ID}'" in res.transformed_sql
    assert res.transformed_sql.lower().count("tenant_id") == 1
    assert "LIMIT 1000" in res.transformed_sql

    # With existing matching tenant_id -> no duplicate injection (idempotent)
    res2 = validator.validate_and_transform(f"SELECT * FROM cost_facts WHERE tenant_id = '{TENANT_ID}'", TENANT_ID)
    assert res2.is_valid
    assert res2.injected_tenant_filter is False
    assert res2.transformed_sql.lower().count("tenant_id") == 1

    # With compound WHERE clause containing tenant_id -> idempotent
    res_compound = validator.validate_and_transform(
        f"SELECT * FROM cost_facts WHERE provider = 'aws' AND tenant_id = '{TENANT_ID}' AND billed_cost > 10",
        TENANT_ID,
    )
    assert res_compound.is_valid
    assert res_compound.injected_tenant_filter is False
    assert res_compound.transformed_sql.lower().count("tenant_id") == 1

    # With spoofed tenant_id -> should overwrite and mark injected without duplicating
    res3 = validator.validate_and_transform("SELECT * FROM cost_facts WHERE tenant_id = 'attacker'", TENANT_ID)
    assert res3.is_valid
    assert res3.injected_tenant_filter is True
    assert f"tenant_id = '{TENANT_ID}'" in res3.transformed_sql
    assert "attacker" not in res3.transformed_sql
    assert res3.transformed_sql.lower().count("tenant_id") == 1

    # Multi-pass idempotency: passing output of validator back into validator
    res_pass1 = validator.validate_and_transform("SELECT sum(cost_usd) FROM ai_usage_facts", TENANT_ID)
    assert res_pass1.injected_tenant_filter is True
    assert res_pass1.transformed_sql.lower().count("tenant_id") == 1

    res_pass2 = validator.validate_and_transform(res_pass1.transformed_sql, TENANT_ID)
    assert res_pass2.injected_tenant_filter is False
    assert res_pass2.transformed_sql.lower().count("tenant_id") == 1
    assert res_pass2.transformed_sql == res_pass1.transformed_sql


def test_sql_validator_multi_statement_rejection():
    validator = SQLValidator()
    res = validator.validate_and_transform("SELECT 1 FROM cost_facts; DROP TABLE cost_facts;", TENANT_ID)
    assert not res.is_valid
    assert "Multiple SQL statements" in res.error


def test_sql_generator_fallback():
    # Test generator with invalid key falls back cleanly
    gen = SQLGenerator(api_key="")
    sql = gen.generate("What is my total AI spend this month?", TENANT_ID)
    assert "ai_usage_facts" in sql
    assert TENANT_ID in sql

    sql_cloud = gen.generate("What is my total spend by provider?", TENANT_ID)
    assert "cost_facts" in sql_cloud
    assert "provider" in sql_cloud


def test_result_explainer_deterministic():
    explainer = ResultExplainer(api_key="")

    # Scalar cost
    ans = explainer.explain("What is my AI spend?", ["total_ai_spend"], [[45.311588]])
    assert "$45.31" in ans

    # Multiple rows
    rows = [["AWS", 120.50], ["GCP", 80.25]]
    ans_multi = explainer.explain("Spend by provider?", ["provider", "total_spend"], rows)
    assert "AWS" in ans_multi
    assert "$120.50" in ans_multi
    assert "Total" in ans_multi


def test_rag_stub():
    chunks = rag_retriever.retrieve_context("test", TENANT_ID)
    assert isinstance(chunks, list)
    prompt_str = rag_retriever.format_context_for_prompt("test", TENANT_ID)
    assert isinstance(prompt_str, str)
