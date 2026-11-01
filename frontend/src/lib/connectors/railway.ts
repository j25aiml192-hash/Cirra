import crypto from 'crypto';
import { clickhouseClient } from '@/lib/clickhouse';
import { decryptCredentials } from './crypto';

const RAILWAY_GQL = 'https://backboard.railway.app/graphql/v2';

const USAGE_QUERY = `
  query {
    me {
      projects {
        edges {
          node {
            id
            name
            estimatedUsageCost
            services {
              edges {
                node {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function ingestRailwayCosts(connection: {
  id: string;
  tenant_id: string;
  credentials_encrypted: { iv: string; tag: string; ciphertext: string };
}) {
  const creds = decryptCredentials(connection.credentials_encrypted);
  const token = creds.token || creds.api_key || creds.apiKey || '';

  const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const todayStr = new Date().toISOString().split('T')[0];

  const res = await fetch(RAILWAY_GQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query: USAGE_QUERY }),
  });

  if (!res.ok) {
    throw new Error(`Railway API returned HTTP ${res.status}`);
  }

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Railway GraphQL error: ${json.errors[0]?.message || 'Unknown error'}`);
  }

  const projects = json.data?.me?.projects?.edges ?? [];
  const rows: Record<string, unknown>[] = [];

  for (const edge of projects) {
    const project = edge?.node;
    if (!project) continue;

    // estimatedUsageCost is in USD cents → divide by 100
    const costUsd = Number(project.estimatedUsageCost ?? 0) / 100;

    const rowData = `${connection.tenant_id}|${connection.id}|railway|${project.id}|${todayStr}`;
    const rowHash = crypto.createHash('sha256').update(rowData).digest('hex');

    rows.push({
      tenant_id: connection.tenant_id,
      charge_period_start: `${todayStr} 00:00:00`,
      charge_period_end: `${todayStr} 23:59:59`,
      billed_cost: costUsd,
      effective_cost: costUsd,
      currency: 'USD',
      provider: 'railway',
      service_name: project.name ?? 'unknown',
      service_category: 'Infra',
      region: 'us-west-2',
      resource_id: project.id,
      sku_id: 'railway-usage',
      tags: {},
      allocation_method: 'tag',
      row_hash: rowHash,
      ingested_at: nowIso,
      version: Date.now(),
    });
  }

  if (rows.length === 0) return { inserted: 0 };

  await clickhouseClient.insert({
    table: 'cost_facts',
    values: rows,
    format: 'JSONEachRow',
  });

  return { inserted: rows.length };
}

