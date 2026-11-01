import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ingestAwsCosts } from '@/lib/connectors/aws';
import { ingestOpenAiUsage } from '@/lib/connectors/openai';
import { ingestGroqUsage } from '@/lib/connectors/groq';
import { ingestRailwayCosts } from '@/lib/connectors/railway';

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase service role configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: connections, error } = await supabase
      .from('connections')
      .select('id, tenant_id, provider, credentials_encrypted, status')
      .eq('status', 'active');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results: Record<string, unknown>[] = [];

    for (const conn of connections ?? []) {
      try {
        let result: { inserted: number } | undefined;

        if (conn.provider === 'aws') {
          result = await ingestAwsCosts(conn);
        } else if (conn.provider === 'openai') {
          result = await ingestOpenAiUsage(conn);
        } else if (conn.provider === 'groq') {
          result = await ingestGroqUsage(conn);
        } else if (conn.provider === 'railway') {
          result = await ingestRailwayCosts(conn);
        } else {
          continue;
        }

        await supabase
          .from('connections')
          .update({
            status: 'active',
            last_synced_at: new Date().toISOString(),
            last_error: null,
          })
          .eq('id', conn.id);

        results.push({
          connection_id: conn.id,
          provider: conn.provider,
          ...result,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);

        await supabase
          .from('connections')
          .update({
            status: 'error',
            last_error: msg,
          })
          .eq('id', conn.id);

        results.push({
          connection_id: conn.id,
          provider: conn.provider,
          error: msg,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Ingest orchestration failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

