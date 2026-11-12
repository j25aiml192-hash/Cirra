from dataclasses import dataclass
from typing import Optional, Set
import sqlglot
from sqlglot import exp


@dataclass
class ValidationResult:
    is_valid: bool
    transformed_sql: Optional[str] = None
    injected_tenant_filter: bool = False
    error: Optional[str] = None


class SQLValidator:
    """
    AST-based SQL Validator using sqlglot.
    Enforces security isolation:
      - Strictly SELECT queries only
      - Allowed tables only ('cost_facts', 'ai_usage_facts')
      - Rejection of DDL/DML (DROP, INSERT, UPDATE, DELETE, CREATE, etc.)
      - Mandatory tenant_id isolation filter
      - Automatic LIMIT 1000 enforcement
    """

    ALLOWED_TABLES: Set[str] = {"cost_facts", "ai_usage_facts"}
    MAX_LIMIT: int = 1000

    def validate_and_transform(self, sql: str, tenant_id: str) -> ValidationResult:
        if not sql or not sql.strip():
            return ValidationResult(is_valid=False, error="Query cannot be empty")

        if not tenant_id or not tenant_id.strip():
            return ValidationResult(is_valid=False, error="tenant_id is required for validation")

        try:
            expressions = sqlglot.parse(sql, read="clickhouse")
        except Exception as e:
            return ValidationResult(is_valid=False, error=f"SQL syntax error: {e}")

        if not expressions:
            return ValidationResult(is_valid=False, error="Failed to parse SQL")

        if len(expressions) > 1:
            return ValidationResult(
                is_valid=False,
                error="Multiple SQL statements are strictly forbidden",
            )

        tree = expressions[0]

        # 1. Enforce SELECT only
        if not isinstance(tree, exp.Select):
            return ValidationResult(
                is_valid=False,
                error=f"Forbidden query type: {type(tree).__name__}. Only SELECT queries are permitted.",
            )

        # 2. Check for any forbidden AST nodes (DROP, INSERT, UPDATE, DELETE, CREATE, etc.)
        forbidden_node_types = (
            exp.Drop,
            exp.Insert,
            exp.Update,
            exp.Delete,
            exp.Create,
            exp.Alter,
            exp.TruncateTable,
            exp.Command,
        )
        for node in tree.find_all(forbidden_node_types):
            return ValidationResult(
                is_valid=False,
                error=f"Forbidden operation '{type(node).__name__}' detected in SQL",
            )

        # 3. Check allowed tables (including subqueries and joins)
        # Collect CTE aliases defined in WITH
        cte_aliases: Set[str] = set()
        with_clause = tree.args.get("with")
        if with_clause:
            for cte in with_clause.expressions:
                if cte.alias:
                    cte_aliases.add(cte.alias.lower())

        table_nodes = list(tree.find_all(exp.Table))
        if not table_nodes:
            return ValidationResult(
                is_valid=False,
                error="Query must query from at least one valid table (cost_facts or ai_usage_facts)",
            )

        for tbl in table_nodes:
            tbl_name = tbl.name.lower()
            if tbl_name not in self.ALLOWED_TABLES and tbl_name not in cte_aliases:
                return ValidationResult(
                    is_valid=False,
                    error=f"Access to table '{tbl.name}' is prohibited. Allowed tables: {sorted(self.ALLOWED_TABLES)}",
                )

        # 4. Mandatory tenant_id filter enforcement
        injected_tenant_filter = False
        has_tenant_filter = False

        where = tree.args.get("where")
        if where:
            for eq in where.find_all(exp.EQ):
                col = None
                val = None
                if isinstance(eq.this, exp.Column) and eq.this.name.lower() == "tenant_id":
                    col = eq.this
                    val = eq.expression
                elif isinstance(eq.expression, exp.Column) and eq.expression.name.lower() == "tenant_id":
                    col = eq.expression
                    val = eq.this

                if col and val:
                    # Check if value matches requested tenant_id
                    if isinstance(val, exp.Literal) and str(val.this) == tenant_id:
                        has_tenant_filter = True
                    else:
                        # Overwrite with caller's tenant_id to prevent privilege escalation
                        val.replace(exp.Literal.string(tenant_id))
                        has_tenant_filter = True
                        injected_tenant_filter = True

        if not has_tenant_filter:
            # Inject WHERE tenant_id = '{tenant_id}'
            tree = tree.where(f"tenant_id = '{tenant_id}'", copy=False)
            injected_tenant_filter = True

        # 5. Enforce LIMIT <= 1000
        limit_node = tree.args.get("limit")
        if limit_node:
            limit_val_expr = limit_node.expression
            try:
                curr_limit = int(limit_val_expr.this)
                if curr_limit > self.MAX_LIMIT:
                    limit_val_expr.replace(exp.Literal.number(self.MAX_LIMIT))
            except (ValueError, AttributeError):
                limit_node.set("expression", exp.Literal.number(self.MAX_LIMIT))
        else:
            tree = tree.limit(self.MAX_LIMIT)

        try:
            transformed_sql = tree.sql(dialect="clickhouse")
        except Exception as e:
            return ValidationResult(is_valid=False, error=f"Dialect generation error: {e}")

        return ValidationResult(
            is_valid=True,
            transformed_sql=transformed_sql,
            injected_tenant_filter=injected_tenant_filter,
            error=None,
        )
