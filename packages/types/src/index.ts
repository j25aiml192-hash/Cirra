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
  forecasted_spend: number;
  cloud_spend_mtd: number;
  ai_spend_mtd: number;
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

export interface Connection {
  id: string;
  tenant_id: string;
  name: string;
  provider: 'aws' | 'gcp' | 'azure' | 'kubernetes' | 'openai' | 'anthropic' | 'bedrock' | 'vertex';
  status: 'connected' | 'error' | 'syncing' | 'pending';
  last_synced_at?: string;
  last_error?: string;
  created_at?: string;
}

export interface CreateConnectionPayload {
  name: string;
  provider: string;
  credentials: Record<string, unknown>;
}

export interface ConnectionTestResult {
  ok: boolean;
  error?: string | null;
}

export interface TeamMember {
  id: string;
  name?: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  status?: 'active' | 'invited';
  created_at?: string;
}

export interface InviteTeamMemberPayload {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface UpdateRolePayload {
  role: 'admin' | 'member' | 'viewer';
}

export interface AuthSessionResponse {
  access_token: string;
  token_type: string;
  tenant_id: string;
  user_id: string;
  role: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
