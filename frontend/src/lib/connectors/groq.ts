import crypto from 'crypto';
import { clickhouseClient } from '@/lib/clickhouse';
import { decryptCredentials } from './crypto';

export async function ingestGroqUsage(connection: {
  id: string;
  tenant_id: string;
  credentials_encrypted: { iv: string; tag: string; ciphertext: string };
}) {
  const creds = decryptCredentials(connection.credentials_encrypted);
  const apiKey = creds.apiKey || creds.api_key || '';

  const results: Record<string, unknown>[] = [];
  const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);

  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    try {
      const res = await fetch(`https://api.groq.com/openai/v1/usage?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) continue;
      const json = await res.json();

      for (const item of json.data ?? []) {
        const model = String(item.model ?? item.snapshot_id ?? 'llama3-70b');
        const inputTokens = Number(item.prompt_tokens ?? item.n_context_tokens_total ?? 0);
        const outputTokens = Number(item.completion_tokens ?? item.n_generated_tokens_total ?? 0);
        // Cost estimation: ~$0.0000008 per token or explicit total_cost
        const costUsd = Number(item.total_cost ?? 0) || (outputTokens * 0.0000008 + inputTokens * 0.0000005);

        const rowData = `${connection.tenant_id}|${connection.id}|groq|${model}|${dateStr}|${inputTokens}`;
        const rowHash = crypto.createHash('sha256').update(rowData).digest('hex');

        results.push({
          tenant_id: connection.tenant_id,
          timestamp: `${dateStr} 00:00:00`,
          provider: 'groq',
          model,
          api_key_id: apiKey ? apiKey.slice(-4) : 'key',
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cached_tokens: 0,
          cost_usd: costUsd,
          row_hash: rowHash,
          tags: {},
          ingested_at: nowIso,
          version: Date.now(),
        });
      }
    } catch {
      // Silently skip on error or network issues
      continue;
    }
  }

  if (results.length === 0) return { inserted: 0 };

  await clickhouseClient.insert({
    table: 'ai_usage_facts',
    values: results,
    format: 'JSONEachRow',
  });

  return { inserted: results.length };
}

