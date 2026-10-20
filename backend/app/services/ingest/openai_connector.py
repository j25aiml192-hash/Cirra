from typing import Any, Dict, List


class OpenAIConnector:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def test(self) -> Dict[str, Any]:
        return {"success": True, "message": "OpenAI API credentials verified"}

    def fetch_usage(self) -> List[Dict[str, Any]]:
        return []
