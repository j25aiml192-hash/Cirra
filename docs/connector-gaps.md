# Known Provider Connector Gaps

## 1. Anthropic API Key Usage Telemetry

### Issue
Standard Anthropic workspace API keys (`sk-ant-api03-*`) do not provide a programmatic `/v1/usage` or billing cost endpoint. Calling usage endpoints with standard keys returns `404 Not Found` or `401 Unauthorized`.

### Current Status
Connections configured with standard Anthropic keys are marked with:
- **Status**: `gap_manual_export_required`
- **Error Diagnostic**: `"Anthropic standard API keys do not support programmatic /v1/usage telemetry. Organization Admin Console export or Bedrock CUR billing is required."`

### Mitigation & Roadmap
1. **AWS Bedrock / GCP Vertex AI**: Customers running Claude via AWS Bedrock or Vertex AI ingest token spend automatically through AWS Cost Explorer (CUR) and GCP BigQuery billing exports without gap.
2. **Anthropic Admin API**: Once Anthropic releases general availability for Workspace Admin Cost APIs, the connector will auto-upgrade.
3. **Never Fake Data**: Cirra strictly refuses to fabricate synthetic cost figures for live connections.
