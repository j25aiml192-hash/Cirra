-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS vector;

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

-- Connections (encrypted credentials in JSONB)
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'default',
  credentials_encrypted JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_connections_tenant_id ON connections(tenant_id);

-- Allocation rules
CREATE TABLE IF NOT EXISTS allocation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 1,
  name TEXT,
  match_type TEXT NOT NULL,
  match_value TEXT NOT NULL,
  assign_team TEXT,
  assign_customer TEXT,
  assign_feature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_allocation_rules_tenant_id ON allocation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS ix_allocation_rules_priority ON allocation_rules(tenant_id, priority);

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hashed_key TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_api_keys_tenant_id ON api_keys(tenant_id);

-- Anomalies
CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  series_key TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  severity TEXT NOT NULL,
  explanation_json JSONB,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_anomalies_tenant_id ON anomalies(tenant_id);

-- Actions
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  proposal_json JSONB NOT NULL,
  dry_run_result_json JSONB,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'proposed',
  audit_log_json JSONB
);
CREATE INDEX IF NOT EXISTS ix_actions_tenant_id ON actions(tenant_id);

-- Savings entries
CREATE TABLE IF NOT EXISTS savings_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action_id UUID REFERENCES actions(id),
  method TEXT NOT NULL,
  baseline_cost DECIMAL(12,4),
  realized_cost DECIMAL(12,4),
  period_start DATE,
  period_end DATE,
  confidence DECIMAL(4,3),
  status TEXT NOT NULL DEFAULT 'identified'
);
CREATE INDEX IF NOT EXISTS ix_savings_entries_tenant_id ON savings_entries(tenant_id);
