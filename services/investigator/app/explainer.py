import logging
from typing import Any, Dict, List, Optional
from groq import Groq

from app.config import settings

logger = logging.getLogger("cirra.investigator.explainer")


class ResultExplainer:
    """
    Explains ClickHouse query results in plain English.
    Uses Groq LLM when available; falls back to deterministic structured summary.
    Enforces the critical rule that all numbers shown originate strictly from query results.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 350,
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

    def explain(
        self,
        question: str,
        columns: List[str],
        rows: List[List[Any]],
    ) -> str:
        """
        Explain query results in natural language.
        Attempts Groq LLM first, falls back to structured deterministic summary.
        """
        if not rows:
            return "No cost or usage data was found for this query."

        client = self._get_groq_client()
        if client:
            models_to_try = [self.model] + [m for m in self.fallback_models if m != self.model]
            prompt = (
                f"User Question: {question}\n\n"
                f"Query Result Columns: {columns}\n"
                f"Query Result Rows (up to 20): {rows[:20]}\n\n"
                "Instructions:\n"
                "- Provide a concise, clear, professional answer answering the user's question in plain English.\n"
                "- STRICT RULE: You MUST cite only the exact numbers, currency, and categories present in the Query Result Rows above.\n"
                "- Do NOT extrapolate, hallucinate, or invent numbers.\n"
                "- If a currency or dollar amount is present, format it nicely (e.g. $45.31).\n"
            )

            for m in models_to_try:
                try:
                    response = client.chat.completions.create(
                        messages=[
                            {
                                "role": "system",
                                "content": "You are Ask Cirra, a cloud cost intelligence assistant.",
                            },
                            {"role": "user", "content": prompt},
                        ],
                        model=m,
                        temperature=self.temperature,
                        max_tokens=self.max_tokens,
                    )
                    content = (response.choices[0].message.content or "").strip()
                    if content:
                        return content
                except Exception as e:
                    logger.warning(f"Groq explainer failed with model '{m}': {e}")
                    if "Connection error" in str(e) or "ConnectError" in str(type(e).__name__):
                        break
                    continue

        return self._deterministic_explain(question, columns, rows)

    def _deterministic_explain(
        self,
        question: str,
        columns: List[str],
        rows: List[List[Any]],
    ) -> str:
        """Structured deterministic explanation strictly formatted from ClickHouse results."""
        if not rows:
            return "No data found matching your query."

        # Case 1: Single row, single scalar value (e.g. total spend)
        if len(rows) == 1 and len(rows[0]) == 1:
            val = rows[0][0]
            col = columns[0].lower() if columns else "amount"
            if isinstance(val, (int, float)):
                formatted_val = f"${val:,.2f}" if "spend" in col or "cost" in col else f"{val:,}"
                return f"Your {col.replace('_', ' ')} is {formatted_val}."
            return f"The result is {val}."

        # Case 2: Single row with multiple aggregate metrics
        if len(rows) == 1:
            row = rows[0]
            parts = []
            for col, val in zip(columns, row):
                if isinstance(val, (int, float)):
                    fval = f"${val:,.2f}" if "cost" in col or "spend" in col else f"{val:,}"
                else:
                    fval = str(val)
                parts.append(f"{col.replace('_', ' ').capitalize()}: {fval}")
            return "Summary: " + ", ".join(parts) + "."

        # Case 3: Multiple rows (category breakdown or time series)
        lines = [f"Found {len(rows)} results:"]
        total_sum = 0.0
        has_cost_col = False
        cost_idx = -1

        for idx, col in enumerate(columns):
            if "cost" in col.lower() or "spend" in col.lower():
                cost_idx = idx
                has_cost_col = True
                break

        for row in rows[:10]:
            label = str(row[0])
            if has_cost_col and len(row) > cost_idx:
                val = row[cost_idx]
                if isinstance(val, (int, float)):
                    total_sum += float(val)
                    lines.append(f"- **{label}**: ${val:,.2f}")
                else:
                    lines.append(f"- **{label}**: {val}")
            else:
                lines.append(f"- " + ", ".join(f"{c}: {v}" for c, v in zip(columns, row)))

        if len(rows) > 10:
            lines.append(f"... and {len(rows) - 10} more rows.")

        if has_cost_col and total_sum > 0:
            lines.append(f"\n**Total**: ${total_sum:,.2f}")

        return "\n".join(lines)
