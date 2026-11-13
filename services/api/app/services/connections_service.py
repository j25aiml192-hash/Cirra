import hashlib
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

from app.core.encryption import decrypt_string, encrypt_string

logger = logging.getLogger("cirra.api.connections_service")

PROVIDER_TEST_CONFIGS = {
    "openai": {
        "test_url": "https://api.openai.com/v1/models",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer",
        "success_codes": [200],
    },
    "groq": {
        "test_url": "https://api.groq.com/openai/v1/models",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer",
        "success_codes": [200],
    },
    "anthropic": {
        "test_url": "https://api.anthropic.com/v1/models",
        "auth_header": "x-api-key",
        "auth_prefix": "",
        "success_codes": [200],
    },
    "gemini": {
        "test_url": "https://generativelanguage.googleapis.com/v1/models",
        "auth_header": "x-goog-api-key",
        "auth_prefix": "",
        "success_codes": [200],
    },
    "github": {
        "test_url": "https://api.github.com/user",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer",
        "success_codes": [200],
    },
    "vercel": {
        "test_url": "https://api.vercel.com/v2/user",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer",
        "success_codes": [200],
    },
    "render": {
        "test_url": "https://api.render.com/v1/services",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer",
        "success_codes": [200, 401],
    },
}


async def _resolve_conn(conn: Any) -> Any:
    if hasattr(conn, "fetch") and callable(getattr(conn, "fetch")):
        return conn
    if hasattr(conn, "connection") and callable(getattr(conn, "connection")):
        c = await conn.connection()
        raw = await c.get_raw_connection()
        return raw.driver_connection
    return conn


def _format_connection_dict(row: Any) -> Dict[str, Any]:
    d = dict(row)
    prefix = d.get("prefix")
    label = d.get("label") or d.get("name") or ""
    key_preview = f"{prefix}..." if prefix else (f"{label[:4]}****" if label else "****")

    spend_cap = d.get("monthly_spend_cap")
    if spend_cap is not None:
        try:
            spend_cap = float(spend_cap)
        except (ValueError, TypeError):
            pass

    last_tested_at = d.get("last_tested_at")
    if isinstance(last_tested_at, datetime):
        last_tested_at = last_tested_at.isoformat()

    created_at = d.get("created_at")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()

    return {
        "id": str(d.get("id")),
        "tenant_id": str(d.get("tenant_id")),
        "provider": d.get("provider"),
        "label": label,
        "name": d.get("name") or label,
        "source": d.get("source", "manual"),
        "monthly_spend_cap": spend_cap,
        "is_monitored": bool(d.get("is_monitored", True)),
        "status": d.get("status", "active"),
        "last_tested_at": last_tested_at,
        "last_test_status": d.get("last_test_status"),
        "created_at": created_at,
        "key_preview": key_preview,
    }


class ConnectionsService:
    async def list_connections(self, tenant_id: str, conn: Any) -> List[Dict[str, Any]]:
        """
        Returns active/monitored connections from api_keys (exclude deleted),
        with key_preview (LEFT(label, 4) + '****' or prefix).
        NEVER return encrypted_key or key_hash.
        """
        try:
            c = await _resolve_conn(conn)
            rows = await c.fetch(
                """
                SELECT id, tenant_id, provider, label, name, source, monthly_spend_cap,
                       is_monitored, status, last_tested_at, last_test_status, created_at, prefix
                FROM api_keys
                WHERE tenant_id = $1::uuid AND (status IS NULL OR status != 'deleted')
                ORDER BY created_at DESC
                """,
                uuid.UUID(str(tenant_id)),
            )
            return [_format_connection_dict(r) for r in rows]
        except Exception:
            return []

    async def add_connection(
        self,
        tenant_id: str,
        provider: str,
        api_key: str,
        label: str,
        monthly_spend_cap: Optional[float],
        conn: Any,
    ) -> Dict[str, Any]:
        """
        Validate provider. Encrypt with Fernet. sha256 key_hash.
        Check duplicate key_hash: return duplicate error if exists.
        INSERT INTO api_keys (tenant_id, provider, label, key_hash, encrypted_key,
        monthly_spend_cap, status='active', source='manual', name=label, prefix=api_key[:8]).
        Run test_connection() immediately after insert.
        Return { connection_id, provider, label, test_result, key_preview }.
        """
        provider_clean = (provider or "").lower().strip()
        if provider_clean not in PROVIDER_TEST_CONFIGS:
            valid_providers = ", ".join(PROVIDER_TEST_CONFIGS.keys())
            raise ValueError(f"Unsupported provider '{provider}'. Must be one of: {valid_providers}")

        if not api_key:
            raise ValueError("API key cannot be empty.")

        c = await _resolve_conn(conn)
        tenant_uuid = uuid.UUID(str(tenant_id))

        key_hash = hashlib.sha256(api_key.encode("utf-8")).hexdigest()

        # Check duplicate key_hash
        existing_id = await c.fetchval(
            """
            SELECT id::text FROM api_keys
            WHERE tenant_id = $1::uuid AND key_hash = $2 AND (status IS NULL OR status != 'deleted')
            LIMIT 1
            """,
            tenant_uuid,
            key_hash,
        )
        if existing_id:
            raise ValueError(f"Connection with this API key already exists for this tenant (id: {existing_id}).")

        encrypted_key = encrypt_string(api_key)
        prefix = api_key[:8]
        key_preview = f"{prefix}..."

        connection_id = await c.fetchval(
            """
            INSERT INTO api_keys (
                id, tenant_id, provider, label, key_hash, encrypted_key,
                monthly_spend_cap, status, source, name, prefix, created_at
            ) VALUES (
                gen_random_uuid(), $1::uuid, $2, $3, $4, $5,
                $6, 'active', 'manual', $7, $8, now()
            )
            RETURNING id::text
            """,
            tenant_uuid,
            provider_clean,
            label,
            key_hash,
            encrypted_key,
            monthly_spend_cap,
            label,
            prefix,
        )

        # Run test immediately after insert
        test_result = await self.test_connection(str(connection_id), str(tenant_id), conn)

        return {
            "connection_id": str(connection_id),
            "id": str(connection_id),
            "provider": provider_clean,
            "label": label,
            "name": label,
            "status": "active",
            "test_result": test_result,
            "key_preview": key_preview,
        }

    async def test_connection(self, api_key_id: str, tenant_id: str, conn: Any) -> Dict[str, Any]:
        """
        Fetch and decrypt key. Call test_url with 5s timeout.
        Update last_tested_at=now(), last_test_status ('ok'/'failed'/'untested').
        Return { status, http_code, latency_ms, tested_at, error }.
        """
        c = await _resolve_conn(conn)
        row = await c.fetchrow(
            """
            SELECT id, provider, encrypted_key
            FROM api_keys
            WHERE id = $1::uuid AND tenant_id = $2::uuid AND (status IS NULL OR status != 'deleted')
            """,
            uuid.UUID(str(api_key_id)),
            uuid.UUID(str(tenant_id)),
        )

        if not row:
            raise ValueError(f"Connection '{api_key_id}' not found for tenant '{tenant_id}'.")

        provider = (row["provider"] or "").lower().strip()
        encrypted_key = row["encrypted_key"]

        if not encrypted_key:
            test_res = {
                "status": "failed",
                "http_code": None,
                "latency_ms": None,
                "tested_at": datetime.now(timezone.utc).isoformat(),
                "error": "No encrypted key found on record",
            }
            await c.execute(
                """
                UPDATE api_keys
                SET last_tested_at = now(), last_test_status = 'failed'
                WHERE id = $1::uuid
                """,
                uuid.UUID(str(api_key_id)),
            )
            return test_res

        try:
            api_key = decrypt_string(encrypted_key)
        except Exception as e:
            test_res = {
                "status": "failed",
                "http_code": None,
                "latency_ms": None,
                "tested_at": datetime.now(timezone.utc).isoformat(),
                "error": f"Failed to decrypt key: {e}",
            }
            await c.execute(
                """
                UPDATE api_keys
                SET last_tested_at = now(), last_test_status = 'failed'
                WHERE id = $1::uuid
                """,
                uuid.UUID(str(api_key_id)),
            )
            return test_res

        cfg = PROVIDER_TEST_CONFIGS.get(provider)
        if not cfg:
            test_res = {
                "status": "untested",
                "http_code": None,
                "latency_ms": None,
                "tested_at": datetime.now(timezone.utc).isoformat(),
                "error": f"No test configuration for provider '{provider}'",
            }
            await c.execute(
                """
                UPDATE api_keys
                SET last_tested_at = now(), last_test_status = 'untested'
                WHERE id = $1::uuid
                """,
                uuid.UUID(str(api_key_id)),
            )
            return test_res

        # Call test_url with 5s timeout
        start_time = time.perf_counter()
        auth_header = cfg.get("auth_header", "Authorization")
        auth_prefix = cfg.get("auth_prefix", "")
        header_val = f"{auth_prefix} {api_key}".strip() if auth_prefix else api_key

        headers = {
            auth_header: header_val,
            "User-Agent": "Cirra/1.0",
        }
        if provider == "anthropic":
            headers["anthropic-version"] = "2023-06-01"

        status_str = "failed"
        http_code = None
        latency_ms = None
        err_msg = None

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(cfg["test_url"], headers=headers)
                latency_ms = int((time.perf_counter() - start_time) * 1000)
                http_code = resp.status_code
                if http_code in cfg.get("success_codes", [200]):
                    status_str = "ok"
                    err_msg = None
                else:
                    status_str = "failed"
                    err_msg = f"HTTP {resp.status_code}: {resp.text[:200]}"
        except Exception as e:
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            status_str = "failed"
            err_msg = str(e)
            resp_obj = getattr(e, "response", None)
            if resp_obj is not None:
                http_code = resp_obj.status_code

        now_iso = datetime.now(timezone.utc).isoformat()
        await c.execute(
            """
            UPDATE api_keys
            SET last_tested_at = now(), last_test_status = $1
            WHERE id = $2::uuid AND tenant_id = $3::uuid
            """,
            status_str,
            uuid.UUID(str(api_key_id)),
            uuid.UUID(str(tenant_id)),
        )

        return {
            "status": status_str,
            "http_code": http_code,
            "latency_ms": latency_ms,
            "tested_at": now_iso,
            "error": err_msg,
        }

    async def delete_connection(self, api_key_id: str, tenant_id: str, conn: Any) -> bool:
        """
        Soft delete: UPDATE api_keys SET status='deleted', is_monitored=false WHERE id=$1 AND tenant_id=$2.
        Return True if updated.
        """
        c = await _resolve_conn(conn)
        res = await c.execute(
            """
            UPDATE api_keys
            SET status = 'deleted', is_monitored = false
            WHERE id = $1::uuid AND tenant_id = $2::uuid AND (status IS NULL OR status != 'deleted')
            """,
            uuid.UUID(str(api_key_id)),
            uuid.UUID(str(tenant_id)),
        )
        if isinstance(res, str):
            # e.g. "UPDATE 1"
            parts = res.split()
            if len(parts) >= 2 and parts[1] != "0":
                return True
            return False
        return bool(res)

    async def update_connection(
        self,
        api_key_id: str,
        tenant_id: str,
        label: Optional[str],
        monthly_spend_cap: Optional[float],
        is_monitored: Optional[bool],
        conn: Any,
    ) -> Dict[str, Any]:
        """
        Update api_keys fields. Return updated dict without key values.
        """
        c = await _resolve_conn(conn)
        updates = []
        params = [uuid.UUID(str(api_key_id)), uuid.UUID(str(tenant_id))]
        idx = 3

        if label is not None:
            updates.append(f"label = ${idx}, name = ${idx + 1}")
            params.append(label)
            params.append(label)
            idx += 2

        if monthly_spend_cap is not None:
            updates.append(f"monthly_spend_cap = ${idx}")
            params.append(monthly_spend_cap)
            idx += 1

        if is_monitored is not None:
            updates.append(f"is_monitored = ${idx}")
            params.append(is_monitored)
            idx += 1

        if not updates:
            row = await c.fetchrow(
                """
                SELECT id, tenant_id, provider, label, name, source, monthly_spend_cap,
                       is_monitored, status, last_tested_at, last_test_status, created_at, prefix
                FROM api_keys
                WHERE id = $1::uuid AND tenant_id = $2::uuid AND (status IS NULL OR status != 'deleted')
                """,
                params[0],
                params[1],
            )
            if not row:
                raise ValueError(f"Connection '{api_key_id}' not found.")
            return _format_connection_dict(row)

        set_clause = ", ".join(updates)
        query = f"""
            UPDATE api_keys
            SET {set_clause}
            WHERE id = $1::uuid AND tenant_id = $2::uuid AND (status IS NULL OR status != 'deleted')
            RETURNING id, tenant_id, provider, label, name, source, monthly_spend_cap,
                      is_monitored, status, last_tested_at, last_test_status, created_at, prefix
        """
        row = await c.fetchrow(query, *params)
        if not row:
            raise ValueError(f"Connection '{api_key_id}' not found.")

        return _format_connection_dict(row)
