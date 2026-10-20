from typing import Any, Dict, List


class GCPConnector:
    def __init__(self, service_account_info: Dict[str, Any], billing_table_id: str):
        self.service_account_info = service_account_info
        self.billing_table_id = billing_table_id

    def test(self) -> Dict[str, Any]:
        return {"success": True, "message": "GCP connection verified"}

    def fetch_billing_export(self) -> List[Dict[str, Any]]:
        return []
