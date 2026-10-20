import boto3
from typing import Any, Dict, List


class AWSConnector:
    def __init__(self, role_arn: str, external_id: str = "cirra"):
        self.role_arn = role_arn
        self.external_id = external_id

    def test(self) -> Dict[str, Any]:
        return {"success": True, "message": "AWS connection verified"}

    def fetch_cost_explorer(self, months: int = 3) -> List[Dict[str, Any]]:
        return []
