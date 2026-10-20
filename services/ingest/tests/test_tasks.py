import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime, timezone
from celery.exceptions import Retry
from tasks import ingest_cost_explorer, ingest_openai_usage
from db import sanitize_error_message


def test_sanitize_error_message_redacts_credentials():
    """Verify that sanitize_error_message strips sensitive tokens and masks credentials."""
    raw_error = "Failed to authenticate with key sk-ant-api03-abcdef1234567890abcdef123456 and secret AKIAIOSFODNN7EXAMPLE"
    sanitized = sanitize_error_message(raw_error)

    assert "sk-" not in sanitized
    assert "AKIA" not in sanitized
    assert "[REDACTED_CREDENTIAL]" in sanitized


@patch("tasks.get_connection_by_id")
@patch("tasks.update_connection_status")
@patch("tasks.AWSCostExplorerConnector.fetch_cost_and_usage")
def test_task_retries_on_500_error(mock_fetch, mock_update, mock_get_conn):
    """Verify that a provider 500 error triggers a Celery retry."""
    conn_id = "test-conn-uuid"
    mock_get_conn.return_value = {
        "id": conn_id,
        "tenant_id": "tenant-isolated-123",
        "provider": "aws",
        "name": "AWS Production",
        "credentials_encrypted": "dummy_encrypted",
        "status": "pending",
        "last_synced_at": None,
    }

    # Simulate provider HTTP 500 / ServiceUnavailable
    mock_fetch.side_effect = RuntimeError("500 Server Error: AWS Cost Explorer temporarily unavailable")

    with patch("tasks.decrypt_credentials", return_value={"access_key_id": "test", "secret_access_key": "test"}):
        res = ingest_cost_explorer.apply(args=[conn_id])
        assert res.status == "FAILURE"
        assert isinstance(res.result, RuntimeError)
        # Celery retried until max_retries
        assert mock_fetch.call_count > 1


@patch("tasks.get_connection_by_id")
@patch("tasks.update_connection_status")
@patch("tasks.OpenAIConnector.fetch_usage")
def test_task_permanent_failure_sets_safe_error_status(mock_fetch, mock_update, mock_get_conn):
    """Verify that after retries are exhausted, the task sets status='error' with a sanitized message."""
    conn_id = "openai-conn-uuid"
    mock_get_conn.return_value = {
        "id": conn_id,
        "tenant_id": "tenant-isolated-123",
        "provider": "openai",
        "name": "OpenAI Prod",
        "credentials_encrypted": "dummy_encrypted",
        "status": "syncing",
        "last_synced_at": None,
    }

    # Permanent fatal error with credential in raw exception
    mock_fetch.side_effect = Exception("401 Unauthorized for secret key sk-abcdef1234567890abcdef1234567890")

    with patch("tasks.decrypt_credentials", return_value={"api_key": "sk-mock"}):
        task = ingest_openai_usage
        res = task.apply(args=[conn_id])

        assert res.status == "FAILURE"
        # Verify update_connection_status was called with status='error'
        mock_update.assert_called()
        last_call_args = mock_update.call_args[1]
        assert last_call_args["status"] == "error"
        assert "sk-" not in str(last_call_args.get("last_error", ""))
        assert "[REDACTED_CREDENTIAL]" in str(last_call_args.get("last_error", ""))
