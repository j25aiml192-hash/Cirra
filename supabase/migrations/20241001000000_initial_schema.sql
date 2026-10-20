-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner','admin','viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connections (encrypted credentials)
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  credentials_encrypted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allocation rules
CREATE TABLE allocation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 0,
  match_type TEXT NOT NULL,
  match_value TEXT NOT NULL,
  assign_team TEXT,
  assign_customer TEXT,
  assign_feature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anomalies
CREATE TABLE anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  series_key TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  severity TEXT NOT NULL,
  explanation_json JSONB,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMPTZ
);

-- Actions
CREATE TABLE actions (
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

-- Savings entries
CREATE TABLE savings_entries (
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
