import { createClient, type ClickHouseClient } from '@clickhouse/client';

let instance: ClickHouseClient | null = null;

/**
 * Returns the singleton ClickHouse client instance.
 * Connects securely over HTTPS using environment variables.
 */
export function getClickHouseClient(): ClickHouseClient {
  if (!instance) {
    const host = process.env.CLICKHOUSE_HOST;
    const port = process.env.CLICKHOUSE_PORT || '8443';
    const username = process.env.CLICKHOUSE_USER || 'default';
    const password = process.env.CLICKHOUSE_PASSWORD;
    const database = process.env.CLICKHOUSE_DATABASE || 'cirra';

    if (!host || !password) {
      throw new Error(
        'Missing ClickHouse configuration: CLICKHOUSE_HOST and CLICKHOUSE_PASSWORD are required.'
      );
    }

    const url = host.startsWith('http://') || host.startsWith('https://')
      ? host
      : `https://${host}:${port}`;

    instance = createClient({
      url,
      username,
      password,
      database,
      request_timeout: 30000,
    });
  }

  return instance;
}

/**
 * Singleton ClickHouse client export.
 */
export const clickhouseClient: ClickHouseClient = new Proxy({} as ClickHouseClient, {
  get(_target, prop: keyof ClickHouseClient) {
    const client = getClickHouseClient();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

/**
 * Typed query helper for ClickHouse.
 * CRITICAL: Enforces that tenant_id is provided in parameters for tenant isolation.
 * Throws immediately if tenant_id is omitted or empty.
 */
export async function clickhouseQuery<T>(
  query: string,
  params: Record<string, unknown>
): Promise<T[]> {
  if (!params || typeof params !== 'object' || !params.tenant_id) {
    throw new Error('Security Error: tenant_id is required in every ClickHouse query.');
  }

  const client = getClickHouseClient();
  const resultSet = await client.query({
    query,
    query_params: params,
    format: 'JSONEachRow',
  });

  return await resultSet.json<T>();
}

