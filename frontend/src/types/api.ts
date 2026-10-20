export interface DashboardSummary {
  total_spend_mtd: number;
  forecasted_spend: number;
  cloud_spend_mtd: number;
  ai_spend_mtd: number;
  anomalies_detected: number;
  potential_savings_monthly: number;
  active_connections: number;
}

export interface CloudSpendRecord {
  service: string;
  provider: string;
  billedCost: number;
  effectiveCost: number;
  team?: string;
}

export interface CloudSpendResponse {
  totalCost: number;
  items: CloudSpendRecord[];
}

export interface AiSpendRecord {
  model: string;
  provider: string;
  apiKeyId: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  team?: string;
  customer?: string;
}

export interface AiSpendResponse {
  totalCostUsd: number;
  items: AiSpendRecord[];
}

export interface Connection {
  id: string;
  tenant_id: string;
  name: string;
  provider: string;
  status: string;
  last_synced_at?: string;
  created_at?: string;
}

export interface AllocationRule {
  id: string;
  priority: number;
  match_type: string;
  match_value: string;
  assign_team?: string;
  assign_customer?: string;
  assign_feature?: string;
}

export interface AllocationCoverage {
  totalSpend: number;
  attributedSpend: number;
  unallocatedSpend: number;
  coveragePercentage: number;
}

export interface Anomaly {
  id: string;
  series_key: string;
  detected_at: string;
  severity: string;
  status: string;
  explanation?: {
    summary?: string;
    root_cause?: string;
  };
}

export interface AskResponse {
  answer: string;
  sql: string;
  rows: Array<Record<string, unknown>>;
  confidence: number;
  warning?: string;
}

export interface SavingsEntry {
  id: string;
  action_id?: string;
  method: string;
  baseline_cost: number;
  realized_cost: number;
  monthly_savings: number;
  confidence: number;
  status: string;
}

export interface SavingsOverview {
  total_realized_savings: number;
  total_pipeline_savings: number;
  entries: SavingsEntry[];
}

export interface TeamMember {
  id: string;
  email: string;
  role: string;
  status: string;
}
