from typing import Any, Dict, List
from google.cloud import bigquery
from google.oauth2 import service_account


class GCPConnector:
    """
    GCP Connector querying BigQuery Standard or Detailed Billing Export.
    """

    def __init__(self, service_account_info: Dict[str, Any], billing_table_id: str):
        self.service_account_info = service_account_info
        self.billing_table_id = billing_table_id

    def _get_client(self) -> bigquery.Client:
        credentials = service_account.Credentials.from_service_account_info(
            self.service_account_info
        )
        return bigquery.Client(credentials=credentials, project=credentials.project_id)

    def test(self) -> Dict[str, Any]:
        """Test BigQuery access and billing table existence."""
        try:
            client = self._get_client()
            table = client.get_table(self.billing_table_id)
            return {"success": True, "message": f"Successfully accessed GCP table {table.table_id}"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    def fetch_billing_export(self, days: int = 30) -> List[Dict[str, Any]]:
        """Query BigQuery billing records for the past N days."""
        client = self._get_client()
        query = f"""
            SELECT
                usage_start_time,
                usage_end_time,
                service,
                sku,
                cost,
                currency,
                labels
            FROM `{self.billing_table_id}`
            WHERE usage_start_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL {days} DAY)
            ORDER BY usage_start_time DESC
            LIMIT 5000
        """
        query_job = client.query(query)
        rows = [dict(row) for row in query_job]
        return rows
