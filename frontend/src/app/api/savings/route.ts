import { NextRequest } from 'next/server';
import { getAuthenticatedUser, unauthorized } from '@/app/api/_lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { SavingsEntry } from '@/types';

interface SavingsRow {
  id: string;
  tenant_id: string;
  action_id?: string | null;
  method?: string | null;
  baseline_cost?: number | string | null;
  realized_cost?: number | string | null;
  period_start?: string | null;
  period_end?: string | null;
  confidence?: number | string | null;
  status?: string | null;
}

interface SavingsTotals {
  identified: number;
  approved: number;
  executed: number;
  verified: number;
  realized: number;
}

const DEFAULT_TOTALS: SavingsTotals = {
  identified: 0,
  approved: 0,
  executed: 0,
  verified: 0,
  realized: 0,
};

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const tenantId = (user.app_metadata?.tenant_id ||
      user.user_metadata?.tenant_id) as string | undefined;

    if (!tenantId) {
      return Response.json({
        data: [],
        error: null,
        meta: {
          next_cursor: null,
          count: 0,
          totals: DEFAULT_TOTALS,
        },
        entries: [],
        total_realized_savings: 0,
        total_pipeline_savings: 0,
      });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const cursor = searchParams.get('cursor');
    const limitRaw = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(isNaN(limitRaw) ? 50 : limitRaw, 1), 100);

    const supabase = await createServerSupabaseClient();

    // 1. Calculate totals across all statuses for this tenant
    const totals: SavingsTotals = { ...DEFAULT_TOTALS };

    try {
      const { data: allRows } = await supabase
        .from('savings_entries')
        .select('status, baseline_cost, realized_cost')
        .eq('tenant_id', tenantId);

      if (Array.isArray(allRows)) {
        for (const row of allRows as SavingsRow[]) {
          const baseline = Number(row.baseline_cost ?? 0);
          const realized = Number(row.realized_cost ?? 0);
          const diff = Math.max(0, baseline - realized);
          const s = (row.status || '').toLowerCase();

          if (s === 'identified') totals.identified += diff;
          else if (s === 'approved') totals.approved += diff;
          else if (s === 'executed') totals.executed += diff;
          else if (s === 'verified') totals.verified += diff;
          else if (s === 'realized') totals.realized += diff;
        }
      }
    } catch {
      // Table might not exist yet
    }

    // 2. Query paginated list
    let query = supabase
      .from('savings_entries')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam);
    }

    if (cursor) {
      query = query.lt('id', cursor);
    }

    const { data: rawRows, error } = await query;

    if (error || !rawRows) {
      return Response.json({
        data: [],
        error: null,
        meta: {
          next_cursor: null,
          count: 0,
          totals,
        },
        entries: [],
        total_realized_savings: totals.realized,
        total_pipeline_savings:
          totals.identified + totals.approved + totals.executed + totals.verified,
      });
    }

    const typedRows = rawRows as SavingsRow[];
    const hasMore = typedRows.length > limit;
    const pageRows = hasMore ? typedRows.slice(0, limit) : typedRows;
    const lastRow = hasMore && pageRows.length > 0 ? pageRows[pageRows.length - 1] : undefined;
    const nextCursor = lastRow ? lastRow.id : null;

    const data: SavingsEntry[] = pageRows.map((r) => {
      const baseline = Number(r.baseline_cost ?? 0);
      const realized = Number(r.realized_cost ?? 0);
      const savingsAmount = Math.max(0, baseline - realized);
      const confNum = Number(r.confidence ?? 0.85);
      const dateStr = (r.period_start && typeof r.period_start === 'string')
        ? r.period_start
        : (new Date().toISOString().split('T')[0] as string);

      return {
        id: r.id,
        action_type: r.method || 'Rightsizing',
        method: r.method || undefined,
        baseline_cost: baseline,
        realized_cost: realized,
        savings_amount: savingsAmount,
        confidence_badge: `${Math.round(confNum * 100)}%`,
        status: (r.status as SavingsEntry['status']) || 'identified',
        date: dateStr,
      };
    });

    return Response.json({
      data,
      error: null,
      meta: {
        next_cursor: nextCursor,
        count: data.length,
        totals,
      },
      entries: data,
      total_realized_savings: totals.realized,
      total_pipeline_savings:
        totals.identified + totals.approved + totals.executed + totals.verified,
    });
  } catch (error) {
    console.error('Savings list error:', error);
    return Response.json({
      data: [],
      error: null,
      meta: {
        next_cursor: null,
        count: 0,
        totals: DEFAULT_TOTALS,
      },
      entries: [],
      total_realized_savings: 0,
      total_pipeline_savings: 0,
    });
  }
}
