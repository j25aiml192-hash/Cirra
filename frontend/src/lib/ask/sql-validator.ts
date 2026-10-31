const ALLOWED_TABLES = new Set([
  'cirra.cost_facts',
  'cirra.ai_usage_facts',
  'cost_facts',
  'ai_usage_facts',
]);

const FORBIDDEN_KEYWORDS = [
  /\bDROP\b/i,
  /\bDELETE\b/i,
  /\bTRUNCATE\b/i,
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bALTER\b/i,
  /\bCREATE\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bEXEC\b/i,
  /\bEXECUTE\b/i,
];

export function validateAndSanitizeSql(
  sql: string,
  tenantId: string
): { valid: boolean; sanitized: string; error?: string } {
  // 1. Reject forbidden keywords
  for (const pattern of FORBIDDEN_KEYWORDS) {
    if (pattern.test(sql)) {
      return { valid: false, sanitized: '', error: 'Forbidden keyword detected' };
    }
  }

  // 2. Must be a SELECT
  const trimmed = sql.trim();
  if (!/^SELECT/i.test(trimmed)) {
    return { valid: false, sanitized: '', error: 'Only SELECT queries are allowed' };
  }

  // 3. Must reference only allowed tables
  const tableMatches = sql.match(/FROM\s+([\w.]+)/gi) ?? [];
  const joinMatches = sql.match(/JOIN\s+([\w.]+)/gi) ?? [];
  const allTables = [...tableMatches, ...joinMatches].map((m) =>
    m.replace(/^(FROM|JOIN)\s+/i, '').trim().toLowerCase()
  );

  for (const table of allTables) {
    if (!ALLOWED_TABLES.has(table)) {
      return { valid: false, sanitized: '', error: `Table '${table}' is not allowed` };
    }
  }

  // 4. Inject tenant_id filter if not present
  let sanitized = trimmed;
  if (!sanitized.includes(`tenant_id = '${tenantId}'`)) {
    if (/\bWHERE\b/i.test(sanitized)) {
      sanitized = sanitized.replace(
        /\bWHERE\b/i,
        `WHERE tenant_id = '${tenantId}' AND `
      );
    } else {
      sanitized = sanitized.replace(
        /\b(GROUP BY|ORDER BY|LIMIT)\b/i,
        `WHERE tenant_id = '${tenantId}' $1`
      );
      if (sanitized === trimmed) {
        sanitized = `${sanitized} WHERE tenant_id = '${tenantId}'`;
      }
    }
  }

  // 5. Enforce LIMIT (max 500)
  if (!/\bLIMIT\b/i.test(sanitized)) {
    sanitized = `${sanitized} LIMIT 100`;
  } else {
    sanitized = sanitized.replace(/\bLIMIT\s+(\d+)/i, (_, n) =>
      `LIMIT ${Math.min(parseInt(n, 10), 500)}`
    );
  }

  // 6. Inject FINAL for ReplacingMergeTree deduplication
  sanitized = sanitized.replace(
    /(cirra\.cost_facts|cost_facts|cirra\.ai_usage_facts|ai_usage_facts)(?!\s+FINAL)/gi,
    '$1 FINAL'
  );

  return { valid: true, sanitized };
}

