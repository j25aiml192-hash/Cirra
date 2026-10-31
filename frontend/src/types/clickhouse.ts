/**
 * ClickHouse Type Definitions
 * Exact mapping of ClickHouse DDL columns for cost_facts and ai_usage_facts
 */

export interface CostFactRecord {
  tenant_id: string;
  charge_period_start: string;
  charge_period_end: string;
  billed_cost: number | string;
  effective_cost: number | string;
  currency: string;
  provider: string;
  service_name: string;
  service_category: string;
  region: string;
  resource_id: string;
  sku_id: string;
  tags: Record<string, string>;
  allocation_method: string;
  row_hash?: string;
  ingested_at?: string;
  version?: number | string;
}

export interface CostRow {
  tenant_id?: string;
  charge_period_start?: string;
  charge_period_end?: string;
  billed_cost: number;
  effective_cost: number;
  currency?: string;
  provider: string;
  service_name: string;
  service_category?: string;
  region?: string;
  resource_id?: string;
  sku_id?: string;
  tags?: Record<string, string>;
  allocation_method?: string;
  team?: string;
}

export interface AiFactRecord {
  tenant_id: string;
  timestamp: string;
  provider: string;
  model: string;
  api_key_id: string;
  input_tokens: number | string;
  output_tokens: number | string;
  cached_tokens: number | string;
  cost_usd: number | string;
  row_hash?: string;
  tags: Record<string, string>;
  ingested_at?: string;
  version?: number | string;
}

export interface AiRow {
  tenant_id?: string;
  timestamp?: string;
  provider: string;
  model: string;
  api_key_id: string;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  cost_usd: number;
  tags?: Record<string, string>;
  team?: string;
}

export interface TopServiceItem {
  service_name: string;
  provider: string;
  spend: number;
  share?: number;
}

export interface TopAiKeyItem {
  api_key_id: string;
  provider: string;
  model?: string;
  team?: string;
  spend: number;
  tokens?: number;
}

export interface DashboardSummary {
  totalSpend: number;
  momChange: number;
  topServices: TopServiceItem[];
  topAiKeys: TopAiKeyItem[];
  unallocatedPct: number;
  coverageScore: number;
  hasData: boolean;
}

export interface AllocationServiceItem {
  service_name: string;
  provider: string;
  total_spend: number;
  allocated_spend: number;
  unallocated_spend: number;
  coverage_pct: number;
}

export interface AllocationCoverage {
  allocatedPct: number;
  unallocatedPct: number;
  byService: AllocationServiceItem[];
}

export interface CloudSpendFilters {
  provider?: string;
  service?: string;
  region?: string;
  team?: string;
  dateFrom: string;
  dateTo: string;
  page?: number;
  pageSize?: number;
}

export interface CloudSpendResult {
  rows: CostRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AiSpendFilters {
  model?: string;
  apiKey?: string;
  team?: string;
  dateFrom: string;
  dateTo: string;
}

export interface AiSpendResult {
  rows: AiRow[];
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

