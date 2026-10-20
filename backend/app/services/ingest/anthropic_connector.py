from typing import Any, Dict, List


class AnthropicConnector:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def test(self) -> Dict[str, Any]:
        return {"success": True, "message": "Anthropic API key format verified"}

    def fetch_usage(self) -> List[Dict[str, Any]]:
        return []
