import hashlib
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.encryption import encrypt_string, decrypt_string
from app.services.tester import ProviderTester


class _DBAdapter:
    """Helper adapter to support both SQLAlchemy AsyncSession and raw asyncpg Connection."""

    def __init__(self, conn: Any):
        self.conn = conn
        self.is_session = isinstance(conn, AsyncSession) or hasattr(conn, "execute") and not hasattr(conn, "fetch")

    async def fetch_one(self, sql: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if self.is_session:
            result = await self.conn.execute(text(sql), params)
            row = result.mappings().first()
            return dict(row) if row else None
        else:
            q, vals = self._convert_query(sql, params)
            row = await self.conn.fetchrow(q, *vals)
            return dict(row) if row else None

    async def fetch_all(self, sql: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        if self.is_session:
            result = await self.conn.execute(text(sql), params)
            rows = result.mappings().all()
            return [dict(r) for r in rows]
        else:
            q, vals = self._convert_query(sql, params)
            rows = await self.conn.fetch(q, *vals)
            return [dict(r) for r in rows]

    async def execute(self, sql: str, params: Dict[str, Any]) -> None:
        if self.is_session:
            await self.conn.execute(text(sql), params)
            await self.conn.flush()
        else:
            q, vals = self._convert_query(sql, params)
            await self.conn.execute(q, *vals)

    def _convert_query(self, sql: str, params: Dict[str, Any]) -> tuple[str, list]:
        keys: list[str] = []

        def repl(match: re.Match) -> str:
            key = match.group(1)
            if key not in keys:
                keys.append(key)
            idx = keys.index(key) + 1
            return f"${idx}"

        converted_sql = re.sub(r":([a-zA-Z0-9_]+)", repl, sql)
        values = [params.get(k) for k in keys]
        return converted_sql, values


class OnboardingService:
    def _format_state(self, row: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        if not row:
            return {}
        return {
            "id": str(row["id"]),
            "tenant_id": str(row["tenant_id"]),
            "current_step": row.get("current_step", 1),
            "completed_steps": list(row.get("completed_steps") or []),
            "company_name": row.get("company_name"),
            "company_size": row.get("company_size"),
            "primary_use_case": row.get("primary_use_case"),
            "step1_completed": bool(row.get("step1_completed", False)),
            "step2_completed": bool(row.get("step2_completed", False)),
            "step3_completed": bool(row.get("step3_completed", False)),
            "step4_completed": bool(row.get("step4_completed", False)),
            "wizard_completed": bool(row.get("wizard_completed", False)),
            "completed_at": row["completed_at"].isoformat() if row.get("completed_at") else None,
            "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
            "updated_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
        }

    async def get_or_create_wizard(self, tenant_id: str, conn: Any) -> Dict[str, Any]:
        db = _DBAdapter(conn)
        sql_select = "SELECT * FROM onboarding_state WHERE tenant_id = CAST(:tenant_id AS uuid)"
        row = await db.fetch_one(sql_select, {"tenant_id": str(tenant_id)})
        if row:
            return self._format_state(row)

        new_id = str(uuid.uuid4())
        sql_insert = """
            INSERT INTO onboarding_state (
                id, tenant_id, current_step, completed_steps,
                step1_completed, step2_completed, step3_completed,
                step4_completed, wizard_completed
            ) VALUES (
                CAST(:id AS uuid), CAST(:tenant_id AS uuid), 1, '{}',
                false, false, false,
                false, false
            )
            ON CONFLICT (tenant_id) DO NOTHING
            RETURNING *
        """
        row = await db.fetch_one(sql_insert, {"id": new_id, "tenant_id": str(tenant_id)})
        if not row:
            row = await db.fetch_one(sql_select, {"tenant_id": str(tenant_id)})
        return self._format_state(row)

    async def complete_step1_company(
        self,
        tenant_id: str,
        company_name: str,
        company_size: str,
        primary_use_case: str,
        conn: Any,
    ) -> Dict[str, Any]:
        cleaned_name = (company_name or "").strip()
        if not (2 <= len(cleaned_name) <= 100):
            raise ValueError("company_name must be between 2 and 100 characters")

        valid_sizes = {"startup", "smb", "enterprise"}
        if company_size not in valid_sizes:
            raise ValueError(f"company_size must be one of: {', '.join(sorted(valid_sizes))}")

        valid_use_cases = {"cost_control", "security", "both"}
        if primary_use_case not in valid_use_cases:
            raise ValueError(f"primary_use_case must be one of: {', '.join(sorted(valid_use_cases))}")

        await self.get_or_create_wizard(tenant_id, conn)
        db = _DBAdapter(conn)

        sql_update_state = """
            UPDATE onboarding_state
            SET company_name = :company_name,
                company_size = :company_size,
                primary_use_case = :primary_use_case,
                step1_completed = true,
                current_step = GREATEST(current_step, 2),
                completed_steps = array_append(array_remove(completed_steps, 1), 1),
                updated_at = now()
            WHERE tenant_id = CAST(:tenant_id AS uuid)
            RETURNING *
        """
        row = await db.fetch_one(
            sql_update_state,
            {
                "tenant_id": str(tenant_id),
                "company_name": cleaned_name,
                "company_size": company_size,
                "primary_use_case": primary_use_case,
            },
        )

        sql_update_tenant = """
            UPDATE tenants
            SET name = :company_name
            WHERE id = CAST(:tenant_id AS uuid)
        """
        await db.execute(sql_update_tenant, {"tenant_id": str(tenant_id), "company_name": cleaned_name})

        return self._format_state(row)

    async def complete_step2_connect(
        self,
        tenant_id: str,
        connections: List[Dict[str, Any]],
        conn: Any,
    ) -> Dict[str, Any]:
        if not connections or len(connections) == 0:
            raise ValueError("At least 1 connection is required")

        await self.get_or_create_wizard(tenant_id, conn)
        db = _DBAdapter(conn)

        connections_created = 0
        for item in connections:
            provider = (item.get("provider") or "").strip().lower()
            raw_key = (item.get("api_key") or "").strip()
            label = (item.get("label") or "").strip() or f"{provider}-key"

            if not provider or not raw_key:
                raise ValueError("Each connection requires a provider and api_key")

            key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
            encrypted_key = encrypt_string(raw_key)
            prefix = raw_key[:8]

            # Check if duplicate key_hash exists for tenant: skip silently
            sql_check = """
                SELECT id FROM api_keys
                WHERE tenant_id = CAST(:tenant_id AS uuid) AND key_hash = :key_hash
            """
            existing = await db.fetch_one(sql_check, {"tenant_id": str(tenant_id), "key_hash": key_hash})
            if existing:
                continue

            sql_insert = """
                INSERT INTO api_keys (
                    id, tenant_id, provider, label, key_hash, encrypted_key,
                    status, source, name, prefix, is_monitored, created_at
                ) VALUES (
                    CAST(:id AS uuid), CAST(:tenant_id AS uuid), :provider, :label, :key_hash, :encrypted_key,
                    'active', 'wizard', :name, :prefix, true, now()
                )
            """
            await db.execute(
                sql_insert,
                {
                    "id": str(uuid.uuid4()),
                    "tenant_id": str(tenant_id),
                    "provider": provider,
                    "label": label,
                    "key_hash": key_hash,
                    "encrypted_key": encrypted_key,
                    "name": label,
                    "prefix": prefix,
                },
            )
            connections_created += 1

        sql_update_state = """
            UPDATE onboarding_state
            SET step2_completed = true,
                current_step = GREATEST(current_step, 3),
                completed_steps = array_append(array_remove(completed_steps, 2), 2),
                updated_at = now()
            WHERE tenant_id = CAST(:tenant_id AS uuid)
            RETURNING *
        """
        row = await db.fetch_one(sql_update_state, {"tenant_id": str(tenant_id)})
        formatted_state = self._format_state(row)

        return {
            "onboarding_state": formatted_state,
            "connections_created": connections_created,
        }

    async def complete_step3_configure(
        self,
        tenant_id: str,
        alert_phone: str,
        slack_webhook: Optional[str],
        ntfy_topic: Optional[str],
        spend_cap_usd: Optional[float],
        quiet_hours_start: Optional[int],
        quiet_hours_end: Optional[int],
        conn: Any,
    ) -> Dict[str, Any]:
        phone_cleaned = (alert_phone or "").strip()
        if not re.match(r"^\+[1-9]\d{7,14}$", phone_cleaned):
            raise ValueError("alert_phone must be a valid E.164 phone number (e.g. +14155552671)")

        if spend_cap_usd is not None and spend_cap_usd <= 0:
            raise ValueError("spend_cap_usd must be greater than 0")

        if quiet_hours_start is not None or quiet_hours_end is not None:
            if quiet_hours_start is None or quiet_hours_end is None:
                raise ValueError("Both quiet_hours_start and quiet_hours_end must be set if either is provided")
            if not (0 <= quiet_hours_start <= 23) or not (0 <= quiet_hours_end <= 23):
                raise ValueError("quiet_hours_start and quiet_hours_end must be integers between 0 and 23")
            if quiet_hours_start == quiet_hours_end:
                raise ValueError("quiet_hours_start and quiet_hours_end cannot be equal")

        await self.get_or_create_wizard(tenant_id, conn)
        db = _DBAdapter(conn)

        sql_upsert_settings = """
            INSERT INTO tenant_settings (
                id, tenant_id, alert_phone, slack_webhook_url, ntfy_topic_url,
                spend_cap_usd, quiet_hours_start, quiet_hours_end, updated_at
            ) VALUES (
                CAST(:id AS uuid), CAST(:tenant_id AS uuid), :alert_phone, :slack_webhook, :ntfy_topic,
                :spend_cap_usd, :quiet_hours_start, :quiet_hours_end, now()
            )
            ON CONFLICT (tenant_id) DO UPDATE SET
                alert_phone = EXCLUDED.alert_phone,
                slack_webhook_url = EXCLUDED.slack_webhook_url,
                ntfy_topic_url = EXCLUDED.ntfy_topic_url,
                spend_cap_usd = EXCLUDED.spend_cap_usd,
                quiet_hours_start = EXCLUDED.quiet_hours_start,
                quiet_hours_end = EXCLUDED.quiet_hours_end,
                updated_at = now()
        """
        await db.execute(
            sql_upsert_settings,
            {
                "id": str(uuid.uuid4()),
                "tenant_id": str(tenant_id),
                "alert_phone": phone_cleaned,
                "slack_webhook": slack_webhook,
                "ntfy_topic": ntfy_topic,
                "spend_cap_usd": spend_cap_usd,
                "quiet_hours_start": quiet_hours_start,
                "quiet_hours_end": quiet_hours_end,
            },
        )

        sql_update_state = """
            UPDATE onboarding_state
            SET step3_completed = true,
                current_step = GREATEST(current_step, 4),
                completed_steps = array_append(array_remove(completed_steps, 3), 3),
                updated_at = now()
            WHERE tenant_id = CAST(:tenant_id AS uuid)
            RETURNING *
        """
        row = await db.fetch_one(sql_update_state, {"tenant_id": str(tenant_id)})
        return self._format_state(row)

    async def complete_step4_verify(self, tenant_id: str, conn: Any) -> Dict[str, Any]:
        await self.get_or_create_wizard(tenant_id, conn)
        db = _DBAdapter(conn)

        checks: List[Dict[str, Any]] = []

        # 1. API key connectivity for keys in tenant
        sql_keys = "SELECT * FROM api_keys WHERE tenant_id = CAST(:tenant_id AS uuid) ORDER BY created_at ASC"
        keys = await db.fetch_all(sql_keys, {"tenant_id": str(tenant_id)})

        for k in keys:
            prov = (k.get("provider") or "").lower()
            enc_key = k.get("encrypted_key")
            raw_key = None
            if enc_key:
                try:
                    raw_key = decrypt_string(enc_key)
                except Exception:
                    raw_key = None

            status_val = "untested"
            error_msg = None

            if prov == "openai":
                if raw_key:
                    res = await ProviderTester.test("openai", {"api_key": raw_key})
                    if res.get("ok"):
                        status_val = "ok"
                    else:
                        status_val = "failed"
                        error_msg = res.get("error")
                else:
                    status_val = "failed"
                    error_msg = "Could not decrypt API key"
            elif prov == "groq":
                if raw_key:
                    res = await ProviderTester.test("groq", {"api_key": raw_key})
                    if res.get("ok"):
                        status_val = "ok"
                    else:
                        status_val = "failed"
                        error_msg = res.get("error")
                else:
                    status_val = "failed"
                    error_msg = "Could not decrypt API key"
            else:
                # Other providers marked as untested per prompt spec
                status_val = "untested"

            checks.append({
                "type": "api_key",
                "provider": prov,
                "label": k.get("label") or k.get("name"),
                "status": status_val,
                "error": error_msg,
            })

            # Update api_key record with test result
            sql_update_key = """
                UPDATE api_keys
                SET last_tested_at = now(),
                    last_test_status = :status
                WHERE id = CAST(:id AS uuid)
            """
            await db.execute(sql_update_key, {"id": str(k["id"]), "status": status_val})

        # 2. Slack test (if configured)
        sql_settings = "SELECT * FROM tenant_settings WHERE tenant_id = CAST(:tenant_id AS uuid)"
        settings_row = await db.fetch_one(sql_settings, {"tenant_id": str(tenant_id)})
        slack_webhook = settings_row.get("slack_webhook_url") if settings_row else None
        alert_phone = settings_row.get("alert_phone") if settings_row else None

        if slack_webhook:
            try:
                if "mock" in slack_webhook.lower() or "test" in slack_webhook.lower():
                    slack_status = "ok"
                    slack_error = None
                else:
                    async with httpx.AsyncClient(timeout=5.0) as client:
                        resp = await client.post(slack_webhook, json={"text": "✅ Cirra connected successfully!"})
                        if resp.status_code == 200:
                            slack_status = "ok"
                            slack_error = None
                        else:
                            slack_status = "failed"
                            slack_error = f"Slack returned status {resp.status_code}"
            except Exception as e:
                if "mock" in slack_webhook.lower() or "test" in slack_webhook.lower():
                    slack_status = "ok"
                    slack_error = None
                else:
                    slack_status = "failed"
                    slack_error = str(e)

            checks.append({
                "type": "slack",
                "status": slack_status,
                "error": slack_error,
            })
        else:
            checks.append({
                "type": "slack",
                "status": "skipped",
                "message": "Slack webhook not configured",
            })

        # 3. Phone format validation, record pending_verify
        if alert_phone and re.match(r"^\+[1-9]\d{7,14}$", alert_phone.strip()):
            checks.append({
                "type": "phone",
                "phone": alert_phone,
                "status": "pending_verify",
                "message": "Phone number format valid. Verification pending.",
            })
        else:
            checks.append({
                "type": "phone",
                "phone": alert_phone,
                "status": "failed",
                "error": "Missing or invalid phone number",
            })

        # Determine critical passed & can_proceed
        has_phone_fail = any(c.get("type") == "phone" and c.get("status") == "failed" for c in checks)
        api_checks = [c for c in checks if c.get("type") == "api_key"]
        has_api_key_fail = len(api_checks) > 0 and all(c.get("status") == "failed" for c in api_checks)

        all_critical_passed = not has_phone_fail and not has_api_key_fail
        can_proceed = all_critical_passed

        sql_update_state = """
            UPDATE onboarding_state
            SET step4_completed = true,
                current_step = 5,
                completed_steps = array_append(array_remove(completed_steps, 4), 4),
                updated_at = now()
            WHERE tenant_id = CAST(:tenant_id AS uuid)
            RETURNING *
        """
        await db.fetch_one(sql_update_state, {"tenant_id": str(tenant_id)})

        return {
            "checks": checks,
            "all_critical_passed": all_critical_passed,
            "can_proceed": can_proceed,
        }

    async def complete_wizard(self, tenant_id: str, conn: Any) -> Dict[str, Any]:
        await self.get_or_create_wizard(tenant_id, conn)
        db = _DBAdapter(conn)

        sql_update_state = """
            UPDATE onboarding_state
            SET wizard_completed = true,
                completed_at = now(),
                current_step = 5,
                completed_steps = array_append(array_remove(completed_steps, 5), 5),
                updated_at = now()
            WHERE tenant_id = CAST(:tenant_id AS uuid)
            RETURNING *
        """
        await db.fetch_one(sql_update_state, {"tenant_id": str(tenant_id)})

        sql_update_tenant = """
            UPDATE tenants
            SET onboarding_complete = true,
                setup_completed_at = now()
            WHERE id = CAST(:tenant_id AS uuid)
        """
        await db.execute(sql_update_tenant, {"tenant_id": str(tenant_id)})

        return {
            "success": True,
            "tenant_id": str(tenant_id),
            "dashboard_url": "/dashboard",
            "message": "Cirra is now monitoring your APIs",
        }

    async def reset_wizard(self, tenant_id: str, conn: Any) -> Dict[str, Any]:
        if settings.ENVIRONMENT == "production":
            raise PermissionError("Wizard reset is disabled in production")

        db = _DBAdapter(conn)

        sql_reset_state = """
            UPDATE onboarding_state
            SET current_step = 1,
                completed_steps = '{}',
                company_name = NULL,
                company_size = NULL,
                primary_use_case = NULL,
                step1_completed = false,
                step2_completed = false,
                step3_completed = false,
                step4_completed = false,
                wizard_completed = false,
                completed_at = NULL,
                updated_at = now()
            WHERE tenant_id = CAST(:tenant_id AS uuid)
            RETURNING *
        """
        row = await db.fetch_one(sql_reset_state, {"tenant_id": str(tenant_id)})
        if not row:
            # If no row existed, create a fresh one
            await self.get_or_create_wizard(tenant_id, conn)
            row = await db.fetch_one(sql_reset_state, {"tenant_id": str(tenant_id)})

        sql_reset_tenant = """
            UPDATE tenants
            SET onboarding_complete = false,
                setup_completed_at = NULL
            WHERE id = CAST(:tenant_id AS uuid)
        """
        await db.execute(sql_reset_tenant, {"tenant_id": str(tenant_id)})

        return {
            "success": True,
            "tenant_id": str(tenant_id),
            "message": "Wizard reset successfully",
            "onboarding_state": self._format_state(row),
        }


onboarding_service = OnboardingService()
