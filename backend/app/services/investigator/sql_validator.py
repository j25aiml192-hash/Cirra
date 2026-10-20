import re
import sqlparse

ALLOWED_TABLES = {"cost_facts", "ai_usage_facts"}


def validate_sql(raw_sql: str, tenant_id: str) -> str:
    cleaned = raw_sql.strip().rstrip(";")
    parsed = sqlparse.parse(cleaned)
    if not parsed or parsed[0].get_type() != "SELECT":
        raise ValueError("Only read-only SELECT queries are allowed")

    sql_lower = cleaned.lower()
    for forbidden in ["insert", "update", "delete", "drop", "alter"]:
        if re.search(rf"\b{forbidden}\b", sql_lower):
            raise ValueError(f"Forbidden SQL command: {forbidden}")

    # Inject tenant clause
    tenant_clause = f"tenant_id = '{tenant_id}'"
    if "where" in sql_lower:
        final_sql = re.sub(r"\bwhere\b", f"WHERE {tenant_clause} AND", cleaned, count=1, flags=re.IGNORECASE)
    else:
        for tbl in ALLOWED_TABLES:
            if tbl in sql_lower:
                final_sql = re.sub(rf"(\bfrom\s+{tbl}\b)", rf"\1 WHERE {tenant_clause}", cleaned, count=1, flags=re.IGNORECASE)
                break
        else:
            final_sql = f"{cleaned} WHERE {tenant_clause}"

    if not re.search(r"\blimit\s+\d+\b", final_sql.lower()):
        final_sql = f"{final_sql} LIMIT 1000"

    return final_sql
