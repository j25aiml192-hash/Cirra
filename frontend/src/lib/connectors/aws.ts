import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  Granularity,
  GroupDefinitionType,
} from '@aws-sdk/client-cost-explorer';
import crypto from 'crypto';
import { clickhouseClient } from '@/lib/clickhouse';
import { decryptCredentials } from './crypto';

export async function ingestAwsCosts(connection: {
  id: string;
  tenant_id: string;
  credentials_encrypted: { iv: string; tag: string; ciphertext: string };
}) {
  const creds = decryptCredentials(connection.credentials_encrypted);

  const client = new CostExplorerClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: creds.accessKeyId || creds.access_key_id || '',
      secretAccessKey: creds.secretAccessKey || creds.secret_access_key || '',
    },
  });

  // Fetch last 30 days
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  const command = new GetCostAndUsageCommand({
    TimePeriod: {
      Start: start.toISOString().split('T')[0],
      End: end.toISOString().split('T')[0],
    },
    Granularity: Granularity.DAILY,
    Metrics: ['UnblendedCost'],
    GroupBy: [
      { Type: GroupDefinitionType.DIMENSION, Key: 'SERVICE' },
      { Type: GroupDefinitionType.DIMENSION, Key: 'REGION' },
    ],
  });

  const response = await client.send(command);

  const rows: Record<string, unknown>[] = [];
  const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);

  for (const result of response.ResultsByTime ?? []) {
    const startDate = result.TimePeriod?.Start ?? start.toISOString().split('T')[0];
    const endDate = result.TimePeriod?.End ?? end.toISOString().split('T')[0];

    for (const group of result.Groups ?? []) {
      const service = group.Keys?.[0] ?? 'Unknown';
      const region = group.Keys?.[1] ?? 'Unknown';
      const amount = parseFloat(group.Metrics?.UnblendedCost?.Amount ?? '0');
      if (amount === 0) continue;

      const rowData = `${connection.tenant_id}|${connection.id}|aws|${service}|${region}|${startDate}|${amount}`;
      const rowHash = crypto.createHash('sha256').update(rowData).digest('hex');

      rows.push({
        tenant_id: connection.tenant_id,
        charge_period_start: `${startDate} 00:00:00`,
        charge_period_end: `${endDate} 00:00:00`,
        billed_cost: amount,
        effective_cost: amount,
        currency: 'USD',
        provider: 'aws',
        service_name: service,
        service_category: service,
        region,
        resource_id: `arn:aws:${service}:${region}:${connection.id}`,
        sku_id: 'Usage',
        tags: {},
        allocation_method: 'unallocated',
        row_hash: rowHash,
        ingested_at: nowIso,
        version: Date.now(),
      });
    }
  }

  if (rows.length === 0) return { inserted: 0 };

  await clickhouseClient.insert({
    table: 'cost_facts',
    values: rows,
    format: 'JSONEachRow',
  });

  return { inserted: rows.length };
}

