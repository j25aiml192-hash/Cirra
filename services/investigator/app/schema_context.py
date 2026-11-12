"""
FOCUS Schema Context for ClickHouse Cost & AI Usage Intelligence.
Fed into the LLM system prompt for accurate text-to-SQL generation.
"""

SCHEMA_CONTEXT = """
Database: cirra (ClickHouse)

You have access to exactly two tables in ClickHouse:

1. Table: cost_facts
   Purpose: Cloud infrastructure spend aligned with FinOps FOCUS 1.0 specifications (AWS, GCP, Azure, etc.).
   Columns:
     - tenant_id String                  : Unique tenant UUID. Must always be filtered.
     - charge_period_start DateTime       : Start of billing window (UTC).
     - charge_period_end DateTime         : End of billing window (UTC).
     - billed_cost Decimal(18,6)          : Billed cost amount in currency.
     - effective_cost Decimal(18,6)       : Effective amortized cost after commitments/discounts.
     - currency String                   : Currency code (e.g. 'USD').
     - provider String                   : Cloud provider (e.g. 'AWS', 'GCP', 'Azure').
     - service_name String               : Cloud service name (e.g. 'Amazon Elastic Compute Cloud - Compute', 'Amazon Simple Storage Service', 'AWS Lambda', 'Amazon Relational Database Service').
     - service_category String           : Category (e.g. 'Compute', 'Storage', 'Database', 'Networking').
     - region String                     : Region (e.g. 'us-east-1', 'us-west-2', 'global').
     - resource_id String                : Cloud resource identifier.
     - sku_id String                     : Cloud SKU identifier.
     - tags Map(String, String)          : Resource tags key-value map.
     - allocated_team String             : Allocated team (e.g. 'engineering', 'product', 'data').
     - allocated_customer String         : Allocated customer or tier.
     - allocated_feature String          : Allocated feature name.
     - allocation_method String          : Rule-based allocation method (e.g. 'rule:tag_exact', 'unallocated').

2. Table: ai_usage_facts
   Purpose: AI/LLM model API calls, token counts, and dollar costs.
   Columns:
     - tenant_id String                  : Unique tenant UUID. Must always be filtered.
     - ts DateTime                       : Timestamp of the AI call (UTC).
     - provider String                   : AI model provider (e.g. 'OpenAI', 'Anthropic').
     - model String                      : Model name (e.g. 'gpt-4o', 'gpt-4o-mini', 'o1-preview', 'text-embedding-3-small').
     - api_key_id String                 : Identifier for the API key used.
     - input_tokens UInt64               : Prompt tokens consumed.
     - output_tokens UInt64              : Completion tokens generated.
     - cached_tokens UInt64              : Cached prompt tokens.
     - cost_usd Decimal(18,6)            : Calculated cost of the inference call in USD.
     - team_tag String                   : Attributed internal team tag.
     - customer_tag String               : Attributed customer tag.
     - feature_tag String                : Attributed feature tag.

ClickHouse Query Guidelines:
- Dialect is ClickHouse SQL.
- Use `sum(billed_cost)` for cloud infrastructure spend.
- Use `sum(cost_usd)` for AI / LLM spend.
- For "this month", use date filter: `charge_period_start >= toStartOfMonth(now())` (for cost_facts) or `ts >= toStartOfMonth(now())` (for ai_usage_facts).
- For "last 30 days", use: `charge_period_start >= now() - INTERVAL 30 DAY` or `ts >= now() - INTERVAL 30 DAY`.
- For date grouping, use: `toDate(charge_period_start) AS day` or `toDate(ts) AS day`.
- Always include `tenant_id = '{tenant_id}'` in the WHERE clause.
- Do NOT join postgres tables or any tables outside `cost_facts` and `ai_usage_facts`.
- Only SELECT statements are permitted.
""".strip()
