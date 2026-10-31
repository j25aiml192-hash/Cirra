-- Enable and Force RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections FORCE ROW LEVEL SECURITY;

ALTER TABLE allocation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_rules FORCE ROW LEVEL SECURITY;

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys FORCE ROW LEVEL SECURITY;

ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies FORCE ROW LEVEL SECURITY;

ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions FORCE ROW LEVEL SECURITY;

ALTER TABLE savings_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_entries FORCE ROW LEVEL SECURITY;

-- Tenant isolation policies using Supabase JWT claims (auth.jwt()->>'tenant_id')
DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

DROP POLICY IF EXISTS tenant_isolation_connections ON connections;
CREATE POLICY tenant_isolation_connections ON connections
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

DROP POLICY IF EXISTS tenant_isolation_allocation_rules ON allocation_rules;
CREATE POLICY tenant_isolation_allocation_rules ON allocation_rules
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

DROP POLICY IF EXISTS tenant_isolation_api_keys ON api_keys;
CREATE POLICY tenant_isolation_api_keys ON api_keys
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

DROP POLICY IF EXISTS tenant_isolation_anomalies ON anomalies;
CREATE POLICY tenant_isolation_anomalies ON anomalies
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

DROP POLICY IF EXISTS tenant_isolation_actions ON actions;
CREATE POLICY tenant_isolation_actions ON actions
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

DROP POLICY IF EXISTS tenant_isolation_savings ON savings_entries;
CREATE POLICY tenant_isolation_savings ON savings_entries
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);
