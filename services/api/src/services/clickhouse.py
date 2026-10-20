from typing import Any, Dict, List, Optional
from src.core.database import get_clickhouse_client


class ClickHouseService:
    """
    Typed, read-only ClickHouse service wrapper.
    Strictly injects tenant_id filter into all queries to guarantee multi-tenant data isolation.
    """

    def __init__(self):
        self.client = get_clickhouse_client()

    def query_cost_facts(
        self,
        tenant_id: str,
        start_date: str,
        end_date: str,
        group_by: Optional[str] = "service_name",
        limit: int = 1000,
    ) -> List[Dict[str, Any]]:
        """
        Query normalized FOCUS cost_facts with mandatory tenant isolation.
        """
        # Whitelist allowed group_by dimensions to prevent SQL injection
        allowed_groupings = {
            "service_name": "service_name",
            "provider": "provider",
            "charge_period_start": "toStartOfDay(charge_period_start) AS day",
            "allocated_team": "allocated_team",
        }
        dim = allowed_groupings.get(group_by, "service_name")

        query = f"""
            SELECT
                {dim},
                provider,
                sum(billed_cost) AS total_billed_cost,
                sum(effective_cost) AS total_effective_cost
            FROM cost_facts
            WHERE tenant_id = %(tenant_id)s
              AND charge_period_start >= %(start_date)s
              AND charge_period_end <= %(end_date)s
            GROUP BY {dim.split(' AS ')[0]}, provider
            ORDER BY total_billed_cost DESC
            LIMIT %(limit)s
        """

        parameters = {
            "tenant_id": tenant_id,
            "start_date": start_date,
            "end_date": end_date,
            "limit": limit,
        }

        result = self.client.query(query, parameters=parameters)
        columns = result.column_names
        return [dict(zip(columns, row)) for row in result.result_rows]

    def query_ai_usage_facts(
        self,
        tenant_id: str,
        start_date: str,
        end_date: str,
        limit: int = 1000,
    ) -> List[Dict[str, Any]]:
        """
        Query ai_usage_facts with mandatory tenant isolation.
        """
        query = """
            SELECT
                model,
                provider,
                api_key_id,
                sum(input_tokens) AS total_input_tokens,
                sum(output_tokens) AS total_output_tokens,
                sum(cost_usd) AS total_cost_usd,
                team_tag,
                customer_tag,
                feature_tag,
                count() AS request_count
            FROM ai_usage_facts
            WHERE tenant_id = %(tenant_id)s
              AND ts >= %(start_date)s
              AND ts <= %(end_date)s
            GROUP BY model, provider, api_key_id, team_tag, customer_tag, feature_tag
            ORDER BY total_cost_usd DESC
            LIMIT %(limit)s
        """

        parameters = {
            "tenant_id": tenant_id,
            "start_date": start_date,
            "end_date": end_date,
            "limit": limit,
        }

        result = self.client.query(query, parameters=parameters)
        columns = result.column_names
        return [dict(zip(columns, row)) for row in result.result_rows]

    def execute_validated_readonly_query(
        self,
        tenant_id: str,
        validated_sql: str,
        parameters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Executes a validated, read-only SELECT query with tenant parameters.
        """
        params = parameters.copy() if parameters else {}
        params["tenant_id"] = tenant_id

        result = self.client.query(validated_sql, parameters=params)
        columns = result.column_names
        return [dict(zip(columns, row)) for row in result.result_rows]
