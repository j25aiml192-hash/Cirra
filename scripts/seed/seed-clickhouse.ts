import { createClient } from '@clickhouse/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';
import crypto from 'crypto';

// Load from frontend/.env.local or root .env
const envPaths = [
  resolve(__dirname, '../../frontend/.env.local'),
  resolve(process.cwd(), 'frontend/.env.local'),
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}

const rawHost = process.env.CLICKHOUSE_HOST;
const port = process.env.CLICKHOUSE_PORT || '8443';
const username = process.env.CLICKHOUSE_USER || 'default';
const password = process.env.CLICKHOUSE_PASSWORD;
const database = process.env.CLICKHOUSE_DATABASE || 'cirra';

if (!rawHost || !password) {
  console.error('❌ Missing CLICKHOUSE_HOST or CLICKHOUSE_PASSWORD in environment');
  process.exit(1);
}

const host = rawHost.startsWith('http://') || rawHost.startsWith('https://')
  ? rawHost
  : `https://${rawHost}:${port}`;

const client = createClient({
  url: host,
  username,
  password,
  database,
});

const TENANT_ID = process.env.SEED_TENANT_ID;

if (!TENANT_ID) {
  console.error('❌ SEED_TENANT_ID is required. Pass it via environment variable:');
  console.error('   SEED_TENANT_ID=<your-tenant-uuid> npm run seed');
  process.exit(1);
}

function formatDate(d: Date): string {
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

function formatDateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

async function seed() {
  console.log(`🌱 Seeding ClickHouse Cloud database '${database}' for tenant: ${TENANT_ID}...`);

  const now = new Date();
  const nowIso = formatDate(now);

  // ----------------------------------------------------
  // Part A: cost_facts — 90 days of cloud spend
  // ----------------------------------------------------
  console.log('Generating cost_facts (90 days)...');
  const costFactsRows: Record<string, unknown>[] = [];

  const services = [
    { name: 'EC2', category: 'compute', min: 8, max: 15, team: 'backend', resourcePrefix: 'i-' },
    { name: 'S3', category: 'storage', min: 2, max: 4, team: 'platform', resourcePrefix: 'bucket-' },
    { name: 'RDS', category: 'database', min: 5, max: 10, team: 'backend', resourcePrefix: 'db-' },
    { name: 'Lambda', category: 'functions', min: 0.5, max: 2, team: 'frontend', resourcePrefix: 'fn-' },
    { name: 'CloudFront', category: 'CDN', min: 1, max: 3, team: 'frontend', resourcePrefix: 'dist-' },
    { name: 'EC2-Internal', category: 'compute', min: 1, max: 3, team: 'unassigned', resourcePrefix: 'i-un-' },
  ];

  for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
    const d = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = formatDateOnly(d);
    const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // MoM growth: month 1 (days 89..60): baseline (1.0), month 2 (days 59..30): +12% (1.12), month 3 (days 29..0): +8% on top (1.2096)
    let growthMultiplier = 1.0;
    if (dayOffset < 30) {
      growthMultiplier = 1.2096;
    } else if (dayOffset < 60) {
      growthMultiplier = 1.12;
    }

    // Weekend spend ~30% lower
    const weekendMultiplier = isWeekend ? 0.7 : 1.0;

    // Spike week: days 45–52 EC2 doubles
    const isSpikeWeek = dayOffset >= 45 && dayOffset <= 52;

    for (const s of services) {
      // Base daily spend random between min and max
      const baseSpend = s.min + Math.random() * (s.max - s.min);
      let dailyCost = baseSpend * growthMultiplier * weekendMultiplier;

      if (s.name.startsWith('EC2') && isSpikeWeek) {
        dailyCost *= 2.0;
      }

      dailyCost = Math.round(dailyCost * 10000) / 10000;

      // 15% of total rows have allocation_method = 'unallocated'
      const isUnallocated = s.name === 'EC2-Internal' || Math.random() < 0.15;
      const allocationMethod = isUnallocated ? 'unallocated' : 'tag';
      const tags: Record<string, string> = isUnallocated
        ? {}
        : { team: s.team, environment: 'production' };

      const resourceId = `arn:aws:${s.name.toLowerCase()}:ap-south-1:123456789012:${s.resourcePrefix}${dayOffset % 5}`;
      const skuId = `${s.name.toLowerCase()}-standard-usage`;

      const rowData = `${TENANT_ID}|aws|${dateStr} 00:00:00|${resourceId}|${skuId}`;
      const rowHash = crypto.createHash('sha256').update(rowData).digest('hex');

      costFactsRows.push({
        tenant_id: TENANT_ID,
        charge_period_start: `${dateStr} 00:00:00`,
        charge_period_end: `${dateStr} 23:59:59`,
        billed_cost: dailyCost,
        effective_cost: dailyCost,
        currency: 'USD',
        provider: 'aws',
        service_name: s.name === 'EC2-Internal' ? 'EC2' : s.name,
        service_category: s.category,
        region: 'ap-south-1',
        resource_id: resourceId,
        sku_id: skuId,
        tags,
        allocation_method: allocationMethod,
        row_hash: rowHash,
        ingested_at: nowIso,
        version: 1,
      });
    }
  }

  console.log(`Generated ${costFactsRows.length} cost_facts rows.`);

  // Insert in batches of 500
  const BATCH_SIZE = 500;
  for (let i = 0; i < costFactsRows.length; i += BATCH_SIZE) {
    const chunk = costFactsRows.slice(i, i + BATCH_SIZE);
    await client.insert({
      table: 'cost_facts',
      values: chunk,
      format: 'JSONEachRow',
    });
  }
  console.log('✅ cost_facts successfully seeded.');

  // ----------------------------------------------------
  // Part B: ai_usage_facts — 90 days of AI usage (~3000+ rows)
  // ----------------------------------------------------
  console.log('Generating ai_usage_facts (90 days, multi-entry per day)...');
  const aiUsageRows: Record<string, unknown>[] = [];

  const models = [
    {
      provider: 'openai',
      model: 'gpt-4o-mini',
      minCalls: 50,
      maxCalls: 200,
      avgInput: 800,
      avgOutput: 400,
      costPerCall: 0.0002,
      subBatches: 10,
    },
    {
      provider: 'openai',
      model: 'gpt-4o',
      minCalls: 5,
      maxCalls: 20,
      avgInput: 1200,
      avgOutput: 600,
      costPerCall: 0.003,
      subBatches: 6,
    },
    {
      provider: 'anthropic',
      model: 'claude-3-haiku',
      minCalls: 30,
      maxCalls: 100,
      avgInput: 600,
      avgOutput: 300,
      costPerCall: 0.0001,
      subBatches: 10,
    },
    {
      provider: 'groq',
      model: 'llama3-70b',
      minCalls: 20,
      maxCalls: 80,
      avgInput: 500,
      avgOutput: 250,
      costPerCall: 0.00008,
      subBatches: 8,
    },
  ];

  const teamList = ['backend', 'frontend', 'platform'];
  const customerList = ['tenant-acme', 'tenant-globex', 'tenant-initech', null];
  const featureList = ['ask-cirra', 'audit-report', 'anomaly-explainer', null];

  let tagIndex = 0;

  for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
    const d = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = formatDateOnly(d);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Gradual growth: +5% per month (month 1: 1.0, month 2: 1.05, month 3: 1.1025)
    let monthGrowth = 1.0;
    if (dayOffset < 30) {
      monthGrowth = 1.1025;
    } else if (dayOffset < 60) {
      monthGrowth = 1.05;
    }

    // Weekend usage ~40% lower
    const weekendMultiplier = isWeekend ? 0.6 : 1.0;

    // Day 60 spike: groq calls 10x normal
    const isGroqSpikeDay = dayOffset === 60;

    for (const m of models) {
      let totalDailyCalls = Math.floor(
        (m.minCalls + Math.random() * (m.maxCalls - m.minCalls)) * monthGrowth * weekendMultiplier
      );

      if (m.provider === 'groq' && isGroqSpikeDay) {
        totalDailyCalls *= 10;
      }

      const callsPerBatch = Math.max(1, Math.floor(totalDailyCalls / m.subBatches));

      for (let b = 0; b < m.subBatches; b++) {
        tagIndex++;
        const teamTag = teamList[tagIndex % teamList.length];
        const customerTag = customerList[(tagIndex + 1) % customerList.length];
        const featureTag = featureList[(tagIndex + 2) % featureList.length];

        const tags: Record<string, string> = { team_tag: teamTag };
        if (customerTag) tags.customer_tag = customerTag;
        if (featureTag) tags.feature_tag = featureTag;

        const hour = Math.floor((b * 24) / m.subBatches).toString().padStart(2, '0');
        const minute = ((b * 13) % 60).toString().padStart(2, '0');
        const second = ((b * 29) % 60).toString().padStart(2, '0');
        const timestampStr = `${dateStr} ${hour}:${minute}:${second}`;

        // Add random variance of +/- 15% to tokens
        const tokenVariance = 0.85 + Math.random() * 0.3;
        const inputTokens = Math.round(callsPerBatch * m.avgInput * tokenVariance);
        const outputTokens = Math.round(callsPerBatch * m.avgOutput * tokenVariance);
        const costUsd = Math.round(callsPerBatch * m.costPerCall * tokenVariance * 1000000) / 1000000;

        const rowData = `${TENANT_ID}|${m.provider}|${timestampStr}|${m.model}|batch-${b}`;
        const rowHash = crypto.createHash('sha256').update(rowData).digest('hex');

        aiUsageRows.push({
          tenant_id: TENANT_ID,
          timestamp: timestampStr,
          provider: m.provider,
          model: m.model,
          api_key_id: `${m.provider.substring(0, 3)}-key-${b % 3}`,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cached_tokens: 0,
          cost_usd: costUsd,
          row_hash: rowHash,
          tags,
          ingested_at: nowIso,
          version: 1,
        });
      }
    }
  }

  console.log(`Generated ${aiUsageRows.length} ai_usage_facts rows.`);

  for (let i = 0; i < aiUsageRows.length; i += BATCH_SIZE) {
    const chunk = aiUsageRows.slice(i, i + BATCH_SIZE);
    await client.insert({
      table: 'ai_usage_facts',
      values: chunk,
      format: 'JSONEachRow',
    });
  }
  console.log('✅ ai_usage_facts successfully seeded.');

  console.log('\n📊 Summary of Seeded Data:');
  console.log(`- cost_facts: ${costFactsRows.length} rows`);
  console.log(`- ai_usage_facts: ${aiUsageRows.length} rows`);
  console.log(`- EC2 spike on days 45–52`);
  console.log(`- Groq 10x spike on day 60`);
  console.log('✨ Seed complete!');
}

seed().catch((err) => {
  console.error('❌ Seed script failed:', err);
  process.exit(1);
});
