import os
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone
from encryption import encrypt_credentials
from tasks import ingest_cost_explorer, ingest_openai_usage


@patch("tasks.clickhouse.insert_cost_facts")
@patch("tasks.get_connection_by_id")
@patch("tasks.update_connection_status")
def test_mock_mode_aws_end_to_end_sync(mock_update, mock_get_conn, mock_insert):
    """
    Integration test:
    Verify that in mock mode, ingest_cost_explorer runs without cloud credentials,
    extracts synthetic fixtures, normalizes them, inserts into ClickHouse, and updates status to connected.
    """
    os.environ["INGEST_MOCK"] = "true"
    conn_id = "mock-aws-conn-uuid"
    tenant_id = "tenant-mock-integration-1"

    raw_creds = {
        "role_arn": "arn:aws:iam::111122223333:role/CirraCostMockRole",
        "external_id": "mock-external-id",
    }
    encrypted = encrypt_credentials(raw_creds)

    mock_get_conn.return_value = {
        "id": conn_id,
        "tenant_id": tenant_id,
        "provider": "aws",
        "name": "AWS Mock Demo",
        "credentials_encrypted": encrypted,
        "status": "pending",
        "last_synced_at": None,
        "last_error": None,
    }
    mock_insert.return_value = 18

    # Execute task
    result = ingest_cost_explorer.apply(args=[conn_id]).get()

    assert result["status"] == "connected"
    assert result["rows_ingested"] == 18

    # Verify ClickHouse insert was called
    mock_insert.assert_called_once()
    inserted_facts = mock_insert.call_args[0][0]
    assert len(inserted_facts) > 0
    for fact in inserted_facts:
        assert fact.tenant_id == tenant_id
        assert fact.provider == "AWS"

    # Verify status transition to connected with last_synced_at timestamp
    mock_update.assert_called()
    last_update_kwargs = mock_update.call_args[1]
    assert last_update_kwargs["status"] == "connected"
    assert last_update_kwargs["last_synced_at"] is not None
    assert last_update_kwargs["last_error"] is None


@patch("tasks.clickhouse.insert_ai_usage_facts")
@patch("tasks.get_connection_by_id")
@patch("tasks.update_connection_status")
def test_mock_mode_openai_end_to_end_sync(mock_update, mock_get_conn, mock_insert):
    """
    Integration test:
    Verify that in mock mode, ingest_openai_usage runs without OpenAI credentials,
    generates token telemetry, inserts into ClickHouse, and marks status as connected.
    """
    os.environ["INGEST_MOCK"] = "true"
    conn_id = "mock-openai-conn-uuid"
    tenant_id = "tenant-mock-integration-2"

    raw_creds = {"api_key": "sk-mock-test-key-for-cirra-dev"}
    encrypted = encrypt_credentials(raw_creds)

    mock_get_conn.return_value = {
        "id": conn_id,
        "tenant_id": tenant_id,
        "provider": "openai",
        "name": "OpenAI Mock Demo",
        "credentials_encrypted": encrypted,
        "status": "pending",
        "last_synced_at": None,
        "last_error": None,
    }
    mock_insert.return_value = 24

    result = ingest_openai_usage.apply(args=[conn_id]).get()

    assert result["status"] == "connected"
    assert result["rows_ingested"] == 24

    mock_insert.assert_called_once()
    inserted_facts = mock_insert.call_args[0][0]
    assert len(inserted_facts) > 0
    for fact in inserted_facts:
        assert fact.tenant_id == tenant_id
        assert fact.provider == "OpenAI"

    mock_update.assert_called()
    last_update = mock_update.call_args[1]
    assert last_update["status"] == "connected"
