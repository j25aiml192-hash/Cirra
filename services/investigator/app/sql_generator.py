import asyncio
import concurrent.futures
import logging
import re
from typing import Any, Dict, List, Optional

from groq import Groq

from app.config import settings
from app.schema_context import SCHEMA_CONTEXT

logger = logging.getLogger("cirra.investigator.sql_generator")


def _run_sync(coro):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None
    if loop and loop.is_running():
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            return pool.submit(asyncio.run, coro).result(timeout=15.0)
    else:
        return asyncio.run(coro)


class SQLGenerator:
    """
    Translates natural language questions to ClickHouse SQL queries using Groq.
    If Groq is unavailable, model is deprecated, or API call fails, falls back cleanly
    to a deterministic template/mock SQL generator.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: int = 500,
    ):
        self.api_key = api_key if api_key is not None else settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL
        self.fallback_models = settings.GROQ_FALLBACK_MODELS
        self.temperature = temperature
        self.max_tokens = max_tokens
        self._groq_client: Optional[Groq] = None

    def _get_groq_client(self) -> Optional[Groq]:
        if not self.api_key:
            return None
        if self._groq_client is None:
            self._groq_client = Groq(api_key=self.api_key)
        return self._groq_client

    def _strip_markdown(self, raw_sql: str) -> str:
        """Strip markdown code fences and unnecessary prose."""
        cleaned = raw_sql.strip()
        # Extract content inside ```sql ... ``` or ``` ... ```
        fence_match = re.search(r"```(?:sql)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE)
        if fence_match:
            cleaned = fence_match.group(1).strip()
        else:
            # Strip single backticks or leading/trailing markdown markers
            cleaned = re.sub(r"^```(?:sql)?", "", cleaned, flags=re.IGNORECASE).strip()
            cleaned = re.sub(r"```$", "", cleaned).strip()

        # If there are preamble words before SELECT, find the first SELECT
        select_match = re.search(r"\bSELECT\b[\s\S]*", cleaned, re.IGNORECASE)
        if select_match:
            cleaned = select_match.group(0).strip()

        # Remove trailing semicolon
        cleaned = cleaned.rstrip(";")
        return cleaned.strip()

    def generate(
        self,
        question: str,
        tenant_id: str,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """
        Generate SQL for the given natural language question.
        Attempts LLM Router first; falls back cleanly to deterministic template generator if LLM router fails.
        """
        system_prompt = (
            f"{SCHEMA_CONTEXT}\n\n"
            "CRITICAL INSTRUCTIONS:\n"
            "- Generate ONLY a ClickHouse SQL SELECT query that directly answers the question.\n"
            f"- The query MUST filter by tenant_id = '{tenant_id}'.\n"
            "- Do NOT return explanations, commentary, or markdown text outside the SQL.\n"
            "- Only return the raw SQL statement.\n"
        )

        messages: List[Dict[str, str]] = [
            {"role": "system", "content": system_prompt}
        ]

        if conversation_history:
            for msg in conversation_history[-4:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": str(content)})

        messages.append({"role": "user", "content": question})

        try:
            from app.llm_router import llm_router
            coro = llm_router.complete(
                task_type="text_to_sql",
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
            )
            llm_resp = _run_sync(coro)
            cleaned_sql = self._strip_markdown(llm_resp.content)
            if cleaned_sql and "SELECT" in cleaned_sql.upper():
                logger.info(
                    "Generated SQL using LLM router: provider=%s, model=%s",
                    llm_resp.provider,
                    llm_resp.model,
                )
                return cleaned_sql
        except Exception as e:
            logger.warning("LLM router text_to_sql generation failed: %s", e)

        client = self._get_groq_client()
        if client:
            # Try primary model, then fallback models if decommissioned/not found
            models_to_try = [self.model] + [m for m in self.fallback_models if m != self.model]
            system_prompt = (
                f"{SCHEMA_CONTEXT}\n\n"
                "CRITICAL INSTRUCTIONS:\n"
                "- Generate ONLY a ClickHouse SQL SELECT query that directly answers the question.\n"
                f"- The query MUST filter by tenant_id = '{tenant_id}'.\n"
                "- Do NOT return explanations, commentary, or markdown text outside the SQL.\n"
                "- Only return the raw SQL statement.\n"
            )

            messages: List[Dict[str, str]] = [
                {"role": "system", "content": system_prompt}
            ]

            if conversation_history:
                for msg in conversation_history[-4:]:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if role in ("user", "assistant") and content:
                        messages.append({"role": role, "content": str(content)})

            messages.append({"role": "user", "content": question})

            for m in models_to_try:
                try:
                    response = client.chat.completions.create(
                        messages=messages,
                        model=m,
                        temperature=self.temperature,
                        max_tokens=self.max_tokens,
                    )
                    raw_content = response.choices[0].message.content or ""
                    cleaned_sql = self._strip_markdown(raw_content)
                    if cleaned_sql and "SELECT" in cleaned_sql.upper():
                        logger.info(f"Generated SQL using Groq model {m}")
                        return cleaned_sql
                except Exception as e:
                    logger.warning(f"Groq generation failed with model '{m}': {e}")
                    # If network connection cannot be established, don't retry other models
                    if "Connection error" in str(e) or "ConnectError" in str(type(e).__name__):
                        break
                    continue

        logger.info("Using template/mock SQL generator fallback")
        return self._generate_template_fallback(question, tenant_id)

    def _generate_template_fallback(self, question: str, tenant_id: str) -> str:
        """
        Deterministic, robust fallback SQL generator for standard test and cost queries.
        """
        q = question.lower().strip()

        # 1. Total AI spend this month
        if ("ai" in q or "token" in q or "model" in q) and ("month" in q):
            return (
                f"SELECT sum(cost_usd) AS total_ai_spend "
                f"FROM ai_usage_facts "
                f"WHERE tenant_id = '{tenant_id}' AND ts >= toStartOfMonth(now())"
            )

        # 2. AI spend by model / top models
        if ("ai" in q or "token" in q or "model" in q) and ("by model" in q or "models" in q or "top" in q):
            return (
                f"SELECT model, sum(cost_usd) AS total_cost, sum(input_tokens) AS total_input_tokens, "
                f"sum(output_tokens) AS total_output_tokens "
                f"FROM ai_usage_facts "
                f"WHERE tenant_id = '{tenant_id}' "
                f"GROUP BY model ORDER BY total_cost DESC"
            )

        # 3. Overall AI spend
        if "ai" in q or "tokens" in q or "gpt" in q:
            return (
                f"SELECT sum(cost_usd) AS total_ai_spend "
                f"FROM ai_usage_facts "
                f"WHERE tenant_id = '{tenant_id}'"
            )

        # 4. Total cloud spend this month
        if "month" in q and ("spend" in q or "cost" in q or "total" in q):
            return (
                f"SELECT sum(billed_cost) AS total_spend "
                f"FROM cost_facts "
                f"WHERE tenant_id = '{tenant_id}' AND charge_period_start >= toStartOfMonth(now())"
            )

        # 5. Spend by provider
        if "provider" in q or "cloud" in q or "aws" in q or "gcp" in q or "azure" in q:
            return (
                f"SELECT provider, sum(billed_cost) AS total_spend "
                f"FROM cost_facts "
                f"WHERE tenant_id = '{tenant_id}' "
                f"GROUP BY provider ORDER BY total_spend DESC"
            )

        # 6. Spend by service
        if "service" in q:
            return (
                f"SELECT service_name, sum(billed_cost) AS total_spend "
                f"FROM cost_facts "
                f"WHERE tenant_id = '{tenant_id}' "
                f"GROUP BY service_name ORDER BY total_spend DESC"
            )

        # 7. Spend by team
        if "team" in q:
            return (
                f"SELECT allocated_team, sum(billed_cost) AS total_spend "
                f"FROM cost_facts "
                f"WHERE tenant_id = '{tenant_id}' "
                f"GROUP BY allocated_team ORDER BY total_spend DESC"
            )

        # 8. Daily spend / trend
        if "daily" in q or "trend" in q or "day" in q:
            return (
                f"SELECT toDate(charge_period_start) AS day, sum(billed_cost) AS total_spend "
                f"FROM cost_facts "
                f"WHERE tenant_id = '{tenant_id}' "
                f"GROUP BY day ORDER BY day ASC"
            )

        # Default fallback
        return (
            f"SELECT sum(billed_cost) AS total_spend "
            f"FROM cost_facts "
            f"WHERE tenant_id = '{tenant_id}'"
        )
