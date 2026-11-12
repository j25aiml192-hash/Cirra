import sys
import pytest
from app.sql_validator import SQLValidator

TENANT_ID = "00000000-0000-0000-0000-000000000001"


def test_tenant_id_auto_injected_when_missing():
    validator = SQLValidator()
    sql = "SELECT sum(cost_usd) FROM ai_usage_facts"
    res = validator.validate_and_transform(sql, TENANT_ID)

    assert res.is_valid is True
    assert res.injected_tenant_filter is True
    assert f"tenant_id = '{TENANT_ID}'" in res.transformed_sql
    assert res.transformed_sql.lower().count("tenant_id") == 1


def test_tenant_id_idempotent_when_already_present():
    validator = SQLValidator()
    sql = f"SELECT sum(cost_usd) FROM ai_usage_facts WHERE tenant_id = '{TENANT_ID}'"
    res = validator.validate_and_transform(sql, TENANT_ID)

    assert res.is_valid is True
    # Should not add another filter if already present
    assert res.injected_tenant_filter is False
    assert res.transformed_sql.lower().count("tenant_id") == 1
    assert f"tenant_id = '{TENANT_ID}'" in res.transformed_sql


def test_tenant_id_idempotent_with_compound_where():
    validator = SQLValidator()
    sql = f"SELECT * FROM cost_facts WHERE provider = 'aws' AND tenant_id = '{TENANT_ID}' AND billed_cost > 10"
    res = validator.validate_and_transform(sql, TENANT_ID)

    assert res.is_valid is True
    assert res.injected_tenant_filter is False
    assert res.transformed_sql.lower().count("tenant_id") == 1
    assert f"tenant_id = '{TENANT_ID}'" in res.transformed_sql
    assert "provider = 'aws'" in res.transformed_sql


def test_tenant_id_overwrite_and_idempotent_when_wrong_tenant():
    validator = SQLValidator()
    sql = "SELECT * FROM cost_facts WHERE tenant_id = 'unauthorized_tenant'"
    res = validator.validate_and_transform(sql, TENANT_ID)

    assert res.is_valid is True
    assert res.injected_tenant_filter is True
    # Overwritten to correct tenant, NOT duplicated
    assert res.transformed_sql.lower().count("tenant_id") == 1
    assert f"tenant_id = '{TENANT_ID}'" in res.transformed_sql
    assert "unauthorized_tenant" not in res.transformed_sql


def test_tenant_id_multi_pass_idempotency():
    validator = SQLValidator()
    raw_sql = "SELECT sum(cost_usd) AS spend FROM ai_usage_facts"

    # Pass 1: Raw SQL without tenant_id -> should inject tenant_id and LIMIT
    res1 = validator.validate_and_transform(raw_sql, TENANT_ID)
    assert res1.is_valid is True
    assert res1.injected_tenant_filter is True
    assert res1.transformed_sql.lower().count("tenant_id") == 1
    assert res1.transformed_sql.lower().count("limit") == 1

    # Pass 2: Pass output of Pass 1 back into validator -> MUST be idempotent
    res2 = validator.validate_and_transform(res1.transformed_sql, TENANT_ID)
    assert res2.is_valid is True
    assert res2.injected_tenant_filter is False  # Already present, not injected again
    assert res2.transformed_sql.lower().count("tenant_id") == 1  # Exactly 1 occurrence
    assert res2.transformed_sql.lower().count("limit") == 1  # Exactly 1 limit

    # Pass 3: Pass output of Pass 2 back into validator -> MUST remain identical
    res3 = validator.validate_and_transform(res2.transformed_sql, TENANT_ID)
    assert res3.is_valid is True
    assert res3.injected_tenant_filter is False
    assert res3.transformed_sql == res2.transformed_sql
    assert res3.transformed_sql.lower().count("tenant_id") == 1


if __name__ == "__main__":
    test_tenant_id_auto_injected_when_missing()
    test_tenant_id_idempotent_when_already_present()
    test_tenant_id_idempotent_with_compound_where()
    test_tenant_id_overwrite_and_idempotent_when_wrong_tenant()
    test_tenant_id_multi_pass_idempotency()
    print("ALL 5 IDEMPOTENCY UNIT TESTS PASSED!")

