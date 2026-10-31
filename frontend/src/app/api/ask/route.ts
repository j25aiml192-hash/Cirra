import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorized } from '@/app/api/_lib/auth';
import { matchSemanticTemplate } from '@/lib/ask/semantic-layer';
import { validateAndSanitizeSql } from '@/lib/ask/sql-validator';
import { generateSql, explainRows } from '@/lib/ask/llm';
import { clickhouseClient } from '@/lib/clickhouse';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const tenantId = (user.app_metadata?.tenant_id ||
      user.user_metadata?.tenant_id) as string | undefined;

    if (!tenantId) {
      return NextResponse.json({
        answer: "Your account isn't set up yet. Please complete onboarding first.",
        rows: [],
        sql: null,
      });
    }

    const body = await request.json().catch(() => ({}));
    const question = body.question;

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }

    let sql: string;

    // Try semantic layer first — avoids LLM for common questions
    const template = matchSemanticTemplate(question);
    if (template) {
      sql = template.buildQuery(tenantId, {});
    } else {
      // LLM call 1: generate SQL
      const rawSql = await generateSql(question, tenantId);
      const validation = validateAndSanitizeSql(rawSql, tenantId);

      if (!validation.valid) {
        return NextResponse.json({
          answer: `I couldn't generate a safe query for that question: ${validation.error}`,
          rows: [],
          sql: rawSql,
        });
      }
      sql = validation.sanitized;
    }

    // Execute query in ClickHouse
    const result = await clickhouseClient.query({
      query: sql,
      format: 'JSONEachRow',
    });
    const rows = await result.json<Record<string, unknown>>();

    // LLM call 2: explain the rows
    const answer = await explainRows(question, rows);

    return NextResponse.json({ answer, rows, sql });
  } catch (err: unknown) {
    console.error('[ask]', err);
    return NextResponse.json(
      { error: 'Failed to process your question' },
      { status: 500 }
    );
  }
}
