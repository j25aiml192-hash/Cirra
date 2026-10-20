import type { Provider, AllocationMethod } from "./focus";

export type UserRole = "owner" | "admin" | "viewer";

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "pending"
  | "error"
  | "syncing";

export interface DashboardSummary {
  tenantId: string;
  totalSpendMonthToDate: number;
  projectedMonthEndSpend: number;
  cloudSpendMonthToDate: number;
  aiSpendMonthToDate: number;
  spendChangePercentage: number;
  activeAnomaliesCount: number;
  potentialSavingsEstimate: number;
  topServices: Array<{
    serviceName: string;
    provider: Provider;
    cost: number;
    pctTotal: number;
  }>;
  dailySpendTrend: Array<{
    date: string;
    cloudCost: number;
    aiCost: number;
    totalCost: number;
  }>;
}

export interface SpendFilters {
  startDate: string;
  endDate: string;
  providers?: Provider[];
  services?: string[];
  teams?: string[];
  customers?: string[];
  features?: string[];
  groupBy?: "day" | "week" | "month" | "service" | "provider" | "team";
}

export interface SpendBreakdownItem {
  key: string;
  provider?: Provider;
  cost: number;
  billedCost: number;
  effectiveCost: number;
  percentage: number;
}

export interface SpendResponse {
  totalCost: number;
  billedCost: number;
  effectiveCost: number;
  currency: string;
  timeSeries: Array<{
    period: string;
    cost: number;
  }>;
  breakdown: SpendBreakdownItem[];
}

export interface AiSpendRow {
  model: string;
  provider: Provider;
  apiKeyId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  teamTag?: string | null;
  customerTag?: string | null;
  featureTag?: string | null;
  requestCount?: number;
}

export interface Connection {
  id: string;
  tenantId: string;
  name: string;
  provider: Provider;
  status: ConnectionStatus;
  lastSyncedAt?: string | null;
  errorMessage?: string | null;
  configMetadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConnectionRequest {
  name: string;
  provider: Provider;
  credentials: Record<string, string>;
  syncScheduleHours?: number;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  latencyMs?: number;
}

export interface AskRequest {
  question: string;
  conversationId?: string;
}

export interface AskResponse {
  answer: string;
  sql: string;
  rows: Array<Record<string, unknown>>;
  confidence: number;
  warning?: string | null;
}

export interface AllocationRule {
  id: string;
  tenantId: string;
  name: string;
  priority: number;
  method: AllocationMethod;
  tagKey?: string | null;
  targetDimension: "team" | "customer" | "feature";
  targetValue: string;
  filterConditions: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AllocationCoverage {
  tenantId: string;
  totalSpend: number;
  allocatedSpend: number;
  unallocatedSpend: number;
  coveragePercentage: number;
  byDimension: {
    teamCoveragePct: number;
    customerCoveragePct: number;
    featureCoveragePct: number;
  };
}

export type AnomalySeverity = "critical" | "high" | "medium" | "low";
export type AnomalyStatus = "active" | "investigating" | "resolved" | "dismissed";

export interface Anomaly {
  id: string;
  tenantId: string;
  serviceName: string;
  provider: Provider;
  detectedAt: string;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  baselineSpend: number;
  actualSpend: number;
  spikePercentage: number;
  explanation: string;
  rootCauseCandidate?: string | null;
}

export type ActionStatus = "proposed" | "pending_approval" | "approved" | "executing" | "completed" | "failed" | "rolled_back";

export interface Action {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  provider: Provider;
  actionType: "scale_down" | "delete_idle" | "migrate_tier" | "purchase_commitment" | "revoke_key";
  estimatedMonthlySavings: number;
  status: ActionStatus;
  proposedBy: string; // "cirra_ai" | "sentinel" | user email
  approvedBy?: string | null;
  executedAt?: string | null;
  createdAt: string;
}

export interface SavingsEntry {
  id: string;
  tenantId: string;
  category: "idle_resources" | "rightsizng" | "commitments" | "ai_caching" | "prompt_optimization";
  title: string;
  description: string;
  potentialMonthlySavingsUsd: number;
  realizedMonthlySavingsUsd: number;
  effort: "low" | "medium" | "high";
  status: "identified" | "in_progress" | "realized" | "ignored";
  detectedAt: string;
}

export interface SessionResponse {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    tenantId: string;
    tenantName: string;
  };
  expires: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
