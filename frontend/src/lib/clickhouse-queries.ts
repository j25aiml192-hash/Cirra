import { clickhouseQuery } from './clickhouse';
import type {
  CostRow,
  AiRow,
  DashboardSummary,
  TopServiceItem,
  TopAiKeyItem,
  AllocationCoverage,
  AllocationServiceItem,
  CloudSpendFilters,
  CloudSpendResult,
  AiSpendFilters,
  AiSpendResult,
} from '../types/clickhouse';

/**
 * Normalizes input date/string to ClickHouse DateTime format 'YYYY-MM-DD HH:mm:ss'
 */
function toClickHouseDateTime(input: string | Date | undefined, isEndOfDay = false): string {
  if (!input) {
    const d = new Date();
    if (isEndOfDay) {
      d.setHours(23, 59, 59, 999);
    } else {
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
    }
    return d.toISOString().replace('T', ' ').substring(0, 19);
  }

  if (input instanceof Date) {
    return input.toISOString().replace('T', ' ').substring(0, 19);
  }

  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return `${input} ${isEndOfDay ? '23:59:59' : '00:00:00'}`;
  }

  // Parse ISO string
  const parsed = new Date(input);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date string: ${input}`);
  }
  return parsed.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * 1. getDashboardSummary
 * Queries cost_facts FINAL and ai_usage_facts FINAL to calculate:
 * { totalSpend, momChange, topServices[], topAiKeys[], unallocatedPct, coverageScore }
 */
export async function getDashboardSummary(
  tenant_id: string,
  dateRange?: { from?: string; to?: string }
): Promise<DashboardSummary> {
  if (!tenant_id) {
    throw new Error('Security Error: tenant_id is required');
  }

  const dateFrom = toClickHouseDateTime(dateRange?.from, false);
  const dateTo = toClickHouseDateTime(dateRange?.to, true);

  // Calculate prior month range for MoM change comparison
  const fromDateObj = new Date(dateFrom.replace(' ', 'T') + 'Z');
  const toDateObj = new Date(dateTo.replace(' ', 'T') + 'Z');
  const durationMs = toDateObj.getTime() - fromDateObj.getTime();

  const prevToObj = new Date(fromDateObj.getTime() - 1000);
  const prevFromObj = new Date(prevToObj.getTime() - durationMs);
  const prevDateFrom = toClickHouseDateTime(prevFromObj, false);
  const prevDateTo = toClickHouseDateTime(prevToObj, true);

  const queryParams = {
    tenant_id,
    date_from: dateFrom,
    date_to: dateTo,
    prev_date_from: prevDateFrom,
    prev_date_to: prevDateTo,
  };

  // 1a. Cloud spend for current and previous period
  const cloudRows = await clickhouseQuery<{
    total_effective_cost: string | number;
    allocated_effective_cost: string | number;
    unallocated_effective_cost: string | number;
  }>(
    `SELECT
       sum(effective_cost) as total_effective_cost,
       sumIf(effective_cost, allocation_method != 'unallocated') as allocated_effective_cost,
       sumIf(effective_cost, allocation_method = 'unallocated') as unallocated_effective_cost
     FROM cost_facts FINAL
     WHERE tenant_id = {tenant_id:UUID}
       AND charge_period_start >= {date_from:DateTime}
       AND charge_period_start <= {date_to:DateTime}`,
    queryParams
  );

  const prevCloudRows = await clickhouseQuery<{
    prev_effective_cost: string | number;
  }>(
    `SELECT sum(effective_cost) as prev_effective_cost
     FROM cost_facts FINAL
     WHERE tenant_id = {tenant_id:UUID}
       AND charge_period_start >= {prev_date_from:DateTime}
       AND charge_period_start <= {prev_date_to:DateTime}`,
    queryParams
  );

  // 1b. AI spend for current and previous period
  const aiRows = await clickhouseQuery<{
    total_cost_usd: string | number;
    total_input_tokens: string | number;
    total_output_tokens: string | number;
  }>(
    `SELECT
       sum(cost_usd) as total_cost_usd,
       sum(input_tokens) as total_input_tokens,
       sum(output_tokens) as total_output_tokens
     FROM ai_usage_facts FINAL
     WHERE tenant_id = {tenant_id:UUID}
       AND timestamp >= {date_from:DateTime}
       AND timestamp <= {date_to:DateTime}`,
    queryParams
  );

  const prevAiRows = await clickhouseQuery<{
    prev_cost_usd: string | number;
  }>(
    `SELECT sum(cost_usd) as prev_cost_usd
     FROM ai_usage_facts FINAL
     WHERE tenant_id = {tenant_id:UUID}
       AND timestamp >= {prev_date_from:DateTime}
       AND timestamp <= {prev_date_to:DateTime}`,
    queryParams
  );

  // 1c. Top cloud services
  const topServicesRaw = await clickhouseQuery<{
    service_name: string;
    provider: string;
    spend: string | number;
  }>(
    `SELECT
       service_name,
       provider,
       sum(effective_cost) as spend
     FROM cost_facts FINAL
     WHERE tenant_id = {tenant_id:UUID}
       AND charge_period_start >= {date_from:DateTime}
       AND charge_period_start <= {date_to:DateTime}
     GROUP BY service_name, provider
     ORDER BY spend DESC
     LIMIT 5`,
    queryParams
  );

  // 1d. Top AI keys
  const topAiKeysRaw = await clickhouseQuery<{
    api_key_id: string;
    provider: string;
    model: string;
    team: string;
    spend: string | number;
    tokens: string | number;
  }>(
    `SELECT
       api_key_id,
       provider,
       model,
       tags['team'] as team,
       sum(cost_usd) as spend,
       sum(input_tokens + output_tokens) as tokens
     FROM ai_usage_facts FINAL
     WHERE tenant_id = {tenant_id:UUID}
       AND timestamp >= {date_from:DateTime}
       AND timestamp <= {date_to:DateTime}
     GROUP BY api_key_id, provider, model, team
     ORDER BY spend DESC
     LIMIT 5`,
    queryParams
  );

  const currentCloud = Number(cloudRows[0]?.total_effective_cost || 0);
  const allocatedCloud = Number(cloudRows[0]?.allocated_effective_cost || 0);
  const unallocatedCloud = Number(cloudRows[0]?.unallocated_effective_cost || 0);
  const currentAi = Number(aiRows[0]?.total_cost_usd || 0);

  const prevCloud = Number(prevCloudRows[0]?.prev_effective_cost || 0);
  const prevAi = Number(prevAiRows[0]?.prev_cost_usd || 0);

  const totalSpend = currentCloud + currentAi;
  const prevTotalSpend = prevCloud + prevAi;

  const momChange = prevTotalSpend > 0
    ? Number((((totalSpend - prevTotalSpend) / prevTotalSpend) * 100).toFixed(2))
    : 0;

  const unallocatedPct = currentCloud > 0
    ? Number(((unallocatedCloud / currentCloud) * 100).toFixed(1))
    : 0;

  const coverageScore = currentCloud > 0
    ? Number(((allocatedCloud / currentCloud) * 100).toFixed(1))
    : 100;

  const topServices: TopServiceItem[] = topServicesRaw.map((s) => {
    const spend = Number(s.spend || 0);
    return {
      service_name: s.service_name,
      provider: s.provider,
      spend,
      share: totalSpend > 0 ? Number(((spend / totalSpend) * 100).toFixed(1)) : 0,
    };
  });

  const topAiKeys: TopAiKeyItem[] = topAiKeysRaw.map((k) => ({
    api_key_id: k.api_key_id,
    provider: k.provider,
    model: k.model,
    team: k.team || 'Unallocated',
    spend: Number(k.spend || 0),
    tokens: Number(k.tokens || 0),
  }));

  const hasData = totalSpend > 0 || prevTotalSpend > 0 || topServices.length > 0 || topAiKeys.length > 0;

  return {
    totalSpend: Number(totalSpend.toFixed(2)),
    momChange,
    topServices,
    topAiKeys,
    unallocatedPct,
    coverageScore,
    hasData,
  };
}

/**
 * 2. getCloudSpend
 * Returns paginated cloud spend rows filtered by provider, service, region, team, date range.
 */
export async function getCloudSpend(
  tenant_id: string,
  filters: CloudSpendFilters
): Promise<CloudSpendResult> {
  if (!tenant_id) {
    throw new Error('Security Error: tenant_id is required');
  }

  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.max(1, Math.min(100, filters.pageSize || 20));
  const offset = (page - 1) * pageSize;

  const whereConditions = [
    'tenant_id = {tenant_id:UUID}',
    'charge_period_start >= {date_from:DateTime}',
    'charge_period_end <= {date_to:DateTime}',
  ];

  const params: Record<string, unknown> = {
    tenant_id,
    date_from: toClickHouseDateTime(filters.dateFrom, false),
    date_to: toClickHouseDateTime(filters.dateTo, true),
    page_size: pageSize,
    offset,
  };

  if (filters.provider) {
    whereConditions.push('provider = {provider:String}');
    params.provider = filters.provider;
  }

  if (filters.service) {
    whereConditions.push('positionCaseInsensitive(service_name, {service:String}) > 0');
    params.service = filters.service;
  }

  if (filters.region) {
    whereConditions.push('region = {region:String}');
    params.region = filters.region;
  }

  if (filters.team) {
    whereConditions.push("tags['team'] = {team:String}");
    params.team = filters.team;
  }

  const whereClause = whereConditions.join(' AND ');

  const countQuery = `
    SELECT count() as total
    FROM (
      SELECT 1
      FROM cost_facts FINAL
      WHERE ${whereClause}
      GROUP BY service_name, provider, region, tags['team'], allocation_method
    )
  `;

  const rowsQuery = `
    SELECT
      service_name,
      provider,
      region,
      tags['team'] as team,
      allocation_method,
      sum(billed_cost) as billed_cost,
      sum(effective_cost) as effective_cost,
      min(charge_period_start) as period_start,
      max(charge_period_end) as period_end
    FROM cost_facts FINAL
    WHERE ${whereClause}
    GROUP BY service_name, provider, region, team, allocation_method
    ORDER BY effective_cost DESC
    LIMIT {page_size:UInt32} OFFSET {offset:UInt32}
  `;

  const countRows = await clickhouseQuery<{ total: string | number }>(countQuery, {
    ...params,
  });
  const total = Number(countRows[0]?.total || 0);

  const rawRows = await clickhouseQuery<{
    service_name: string;
    provider: string;
    region: string;
    team: string;
    allocation_method: string;
    billed_cost: string | number;
    effective_cost: string | number;
    period_start: string;
    period_end: string;
  }>(rowsQuery, params);

  const rows: CostRow[] = rawRows.map((r) => ({
    service_name: r.service_name,
    provider: r.provider,
    region: r.region,
    team: r.team || 'Unallocated',
    allocation_method: r.allocation_method,
    billed_cost: Number(Number(r.billed_cost || 0).toFixed(4)),
    effective_cost: Number(Number(r.effective_cost || 0).toFixed(4)),
    charge_period_start: r.period_start,
    charge_period_end: r.period_end,
  }));

  return {
    rows,
    total,
    page,
    pageSize,
  };
}

/**
 * 3. getAiSpend
 * Returns aggregated AI usage filtered by model, apiKey, team, date range.
 */
export async function getAiSpend(
  tenant_id: string,
  filters: AiSpendFilters
): Promise<AiSpendResult> {
  if (!tenant_id) {
    throw new Error('Security Error: tenant_id is required');
  }

  const whereConditions = [
    'tenant_id = {tenant_id:UUID}',
    'timestamp >= {date_from:DateTime}',
    'timestamp <= {date_to:DateTime}',
  ];

  const params: Record<string, unknown> = {
    tenant_id,
    date_from: toClickHouseDateTime(filters.dateFrom, false),
    date_to: toClickHouseDateTime(filters.dateTo, true),
  };

  if (filters.model) {
    whereConditions.push('model = {model:String}');
    params.model = filters.model;
  }

  if (filters.apiKey) {
    whereConditions.push('api_key_id = {api_key:String}');
    params.api_key = filters.apiKey;
  }

  if (filters.team) {
    whereConditions.push("tags['team'] = {team:String}");
    params.team = filters.team;
  }

  const whereClause = whereConditions.join(' AND ');

  const query = `
    SELECT
      provider,
      model,
      api_key_id,
      tags['team'] as team,
      sum(cost_usd) as cost_usd,
      sum(input_tokens) as input_tokens,
      sum(output_tokens) as output_tokens,
      sum(cached_tokens) as cached_tokens
    FROM ai_usage_facts FINAL
    WHERE ${whereClause}
    GROUP BY provider, model, api_key_id, team
    ORDER BY cost_usd DESC
  `;

  const rawRows = await clickhouseQuery<{
    provider: string;
    model: string;
    api_key_id: string;
    team: string;
    cost_usd: string | number;
    input_tokens: string | number;
    output_tokens: string | number;
    cached_tokens: string | number;
  }>(query, params);

  let totalCost = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  const rows: AiRow[] = rawRows.map((r) => {
    const cost = Number(Number(r.cost_usd || 0).toFixed(6));
    const inTokens = Number(r.input_tokens || 0);
    const outTokens = Number(r.output_tokens || 0);

    totalCost += cost;
    totalInputTokens += inTokens;
    totalOutputTokens += outTokens;

    return {
      provider: r.provider,
      model: r.model,
      api_key_id: r.api_key_id,
      team: r.team || 'Unallocated',
      cost_usd: cost,
      input_tokens: inTokens,
      output_tokens: outTokens,
      cached_tokens: Number(r.cached_tokens || 0),
    };
  });

  return {
    rows,
    totalCost: Number(totalCost.toFixed(6)),
    totalInputTokens,
    totalOutputTokens,
  };
}

/**
 * 4. getAllocationCoverage
 * Calculates allocated vs unallocated breakdown across all services for the tenant.
 */
export async function getAllocationCoverage(tenant_id: string): Promise<AllocationCoverage> {
  if (!tenant_id) {
    throw new Error('Security Error: tenant_id is required');
  }

  const query = `
    SELECT
      service_name,
      provider,
      sum(effective_cost) as total_spend,
      sumIf(effective_cost, allocation_method != 'unallocated') as allocated_spend,
      sumIf(effective_cost, allocation_method = 'unallocated') as unallocated_spend
    FROM cost_facts FINAL
    WHERE tenant_id = {tenant_id:UUID}
    GROUP BY service_name, provider
    ORDER BY total_spend DESC
  `;

  const rawRows = await clickhouseQuery<{
    service_name: string;
    provider: string;
    total_spend: string | number;
    allocated_spend: string | number;
    unallocated_spend: string | number;
  }>(query, { tenant_id });

  let totalSpendSum = 0;
  let allocatedSpendSum = 0;
  let unallocatedSpendSum = 0;

  const byService: AllocationServiceItem[] = rawRows.map((r) => {
    const total = Number(r.total_spend || 0);
    const allocated = Number(r.allocated_spend || 0);
    const unallocated = Number(r.unallocated_spend || 0);

    totalSpendSum += total;
    allocatedSpendSum += allocated;
    unallocatedSpendSum += unallocated;

    const coverage = total > 0 ? Number(((allocated / total) * 100).toFixed(1)) : 0;

    return {
      service_name: r.service_name,
      provider: r.provider,
      total_spend: Number(total.toFixed(2)),
      allocated_spend: Number(allocated.toFixed(2)),
      unallocated_spend: Number(unallocated.toFixed(2)),
      coverage_pct: coverage,
    };
  });

  const allocatedPct = totalSpendSum > 0
    ? Number(((allocatedSpendSum / totalSpendSum) * 100).toFixed(1))
    : 100;

  const unallocatedPct = totalSpendSum > 0
    ? Number(((unallocatedSpendSum / totalSpendSum) * 100).toFixed(1))
    : 0;

  return {
    allocatedPct,
    unallocatedPct,
    byService,
  };
}
