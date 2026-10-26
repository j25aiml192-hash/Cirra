export type Period = '30d' | '90d' | '6m' | '12m';

export interface MonthlySpendData {
  month: string;
  aws: number;
  gcp: number;
  openai: number;
  anthropic: number;
}

export interface TopService {
  name: string;
  provider: 'AWS' | 'GCP' | 'Azure' | 'OpenAI' | 'Anthropic';
  spend: number;
  change: string;
  changePositive: boolean;
  share: number;
}

export interface TopAiKey {
  keyName: string;
  provider: 'OpenAI' | 'Anthropic';
  team: string;
  spend: number;
  tokens: string;
}

export interface DashboardSummary {
  total_spend_mtd: number;
  total_spend_prior_period?: number;
  mom_change?: number;
  forecasted_spend: number;
  cloud_spend_mtd: number;
  ai_spend_mtd: number;
  total_tokens?: number;
  anomalies_detected: number;
  potential_savings_monthly: number;
  active_connections: number;
  monthly: MonthlySpendData[];
  topServices: TopService[];
  topAiKeys: TopAiKey[];
  attributionCoverage: {
    percentage: number;
    attributed: number;
    unallocated: number;
    resourcesCount: number;
    totalResources: number;
  };
}

export interface CloudSpendRecord {
  service: string;
  provider: 'AWS' | 'GCP' | 'Azure';
  region: string;
  attributed: boolean;
  spend: number;
  priorPeriodSpend: number;
  change: string;
  changePositive: boolean;
  impactPercent: number;
  team?: string;
  billedCost?: number;
  effectiveCost?: number;
}

export interface CloudSpendResponse {
  totalCost: number;
  items: CloudSpendRecord[];
  dailyVelocity: Array<{ date: string; amount: number }>;
}

export interface AiSpendRecord {
  model: string;
  provider: 'OpenAI' | 'Anthropic' | 'Bedrock';
  apiKeyId: string;
  team: string;
  customer?: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  cacheRate: string;
}

export interface AiSpendResponse {
  totalCostUsd: number;
  totalTokens: number;
  cachedTokensPercent: number;
  items: AiSpendRecord[];
  modelCosts: Array<{ model: string; cost: number; provider: string }>;
}

export interface Connection {
  id: string;
  tenant_id: string;
  name: string;
  provider: 'aws' | 'gcp' | 'azure' | 'kubernetes' | 'openai' | 'anthropic' | 'bedrock' | 'vertex';
  status: 'connected' | 'error' | 'syncing' | 'pending';
  last_synced_at?: string;
  errorMessage?: string;
  created_at?: string;
}

export interface AllocationRule {
  id: string;
  priority: number;
  match_type: 'tag' | 'prefix' | 'regex' | 'service';
  match_value: string;
  assign_team?: string;
  assign_customer?: string;
  assign_feature?: string;
  spendAttributed?: number;
}

export interface SuggestedRule {
  id: string;
  pattern: string;
  suggestedTeam: string;
  confidence: number;
  estimatedSpend: number;
}

export interface AllocationCoverage {
  totalSpend: number;
  attributedSpend: number;
  unallocatedSpend: number;
  coveragePercentage: number;
}

export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Anomaly {
  id: string;
  series_key: string;
  serviceName: string;
  detected_at: string;
  severity: AnomalySeverity;
  status: 'open' | 'dismissed' | 'resolved';
  surgePercent?: string;
  currentCost?: number;
  expectedCost?: number;
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
  action_type: string;
  method?: string;
  baseline_cost: number;
  realized_cost: number;
  savings_amount: number;
  confidence_badge: string;
  status: 'realized' | 'approved' | 'pending_approval' | 'identified';
  date: string;
}

export interface SavingsOverview {
  total_realized_savings: number;
  total_pipeline_savings: number;
  entries: SavingsEntry[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'viewer';
  status: 'active' | 'invited';
  avatarInitials: string;
}

export interface SpendFilters {
  period?: Period;
  provider?: string;
  team?: string;
  search?: string;
}
