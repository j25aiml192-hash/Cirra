export type Provider =
  | "aws"
  | "gcp"
  | "azure"
  | "kubernetes"
  | "openai"
  | "anthropic"
  | "bedrock"
  | "vertex"
  | "stripe";

export type AllocationMethod =
  | "tag_exact"
  | "pro_rata"
  | "fixed_percentage"
  | "unallocated"
  | "rule_based"
  | "heuristic";

export interface CostFact {
  tenantId: string;
  chargePeriodStart: string; // ISO 8601 string
  chargePeriodEnd: string;   // ISO 8601 string
  provider: Provider;
  serviceName: string;
  resourceId: string;
  skuId: string;
  billedCost: number;
  effectiveCost: number;
  currency: string;
  tags: Record<string, string>;
  allocatedTeam?: string | null;
  allocatedCustomer?: string | null;
  allocatedFeature?: string | null;
  allocationMethod: AllocationMethod;
  insertedAt: string;        // ISO 8601 string
}

export interface AiUsageFact {
  tenantId: string;
  ts: string;                // ISO 8601 string
  provider: Provider;
  model: string;
  apiKeyId: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  teamTag?: string | null;
  customerTag?: string | null;
  featureTag?: string | null;
  insertedAt: string;        // ISO 8601 string
}
