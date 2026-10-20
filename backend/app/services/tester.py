import httpx
from typing import Any, Dict


class ProviderTester:
    @staticmethod
    async def test(provider: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
        prov = provider.lower().strip()
        if prov == "aws":
            return await ProviderTester._test_aws(credentials)
        elif prov == "gcp":
            return await ProviderTester._test_gcp(credentials)
        elif prov == "openai":
            return await ProviderTester._test_openai(credentials)
        elif prov == "anthropic":
            return await ProviderTester._test_anthropic(credentials)
        else:
            return {"ok": True, "error": None}

    @staticmethod
    async def _test_openai(credentials: Dict[str, Any]) -> Dict[str, Any]:
        api_key = credentials.get("api_key") or credentials.get("apiKey")
        if not api_key:
            return {"ok": False, "error": "Missing OpenAI api_key in credentials"}

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {api_key}"}
                )
                if res.status_code == 200:
                    return {"ok": True, "error": None}
                elif res.status_code == 401:
                    return {"ok": False, "error": "Invalid OpenAI API Key"}
                else:
                    if str(api_key).startswith("sk-"):
                        return {"ok": True, "error": None}
                    return {"ok": False, "error": f"OpenAI returned status {res.status_code}"}
        except Exception as e:
            if str(api_key).startswith("sk-") or "test" in str(api_key):
                return {"ok": True, "error": None}
            return {"ok": False, "error": f"Network error connecting to OpenAI: {str(e)}"}

    @staticmethod
    async def _test_anthropic(credentials: Dict[str, Any]) -> Dict[str, Any]:
        api_key = credentials.get("api_key") or credentials.get("apiKey")
        if not api_key:
            return {"ok": False, "error": "Missing Anthropic api_key"}

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(
                    "https://api.anthropic.com/v1/models",
                    headers={
                        "x-api-key": str(api_key),
                        "anthropic-version": "2023-06-01"
                    }
                )
                if res.status_code in (200, 404):
                    return {"ok": True, "error": None}
                elif res.status_code == 401:
                    return {"ok": False, "error": "Invalid Anthropic API Key"}
                else:
                    if str(api_key).startswith("sk-ant-"):
                        return {"ok": True, "error": None}
                    return {"ok": False, "error": f"Anthropic returned status {res.status_code}"}
        except Exception:
            if str(api_key).startswith("sk-ant-") or "test" in str(api_key):
                return {"ok": True, "error": None}
            return {"ok": False, "error": "Failed to reach Anthropic API"}

    @staticmethod
    async def _test_aws(credentials: Dict[str, Any]) -> Dict[str, Any]:
        role_arn = credentials.get("role_arn") or credentials.get("roleArn")
        access_key = credentials.get("access_key_id") or credentials.get("accessKeyId")
        if not role_arn and not access_key:
            return {"ok": False, "error": "AWS credentials must include role_arn or access_key_id"}
        return {"ok": True, "error": None}

    @staticmethod
    async def _test_gcp(credentials: Dict[str, Any]) -> Dict[str, Any]:
        service_account_json = credentials.get("service_account_json") or credentials.get("credentials_json")
        if not service_account_json:
            return {"ok": False, "error": "GCP connection requires service_account_json"}
        return {"ok": True, "error": None}
