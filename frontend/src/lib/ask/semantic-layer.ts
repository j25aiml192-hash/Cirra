// Named query templates for common questions.
// When a question matches a template, skip the LLM SQL generation entirely.

export interface SemanticTemplate {
  name: string;
  patterns: RegExp[];
  buildQuery: (tenantId: string, params: Record<string, string>) => string;
}

export const SEMANTIC_TEMPLATES: SemanticTemplate[] = [
  {
    name: 'top_services_by_cost',
    patterns: [/top.*service/i, /most expensive service/i, /highest.*spend/i],
    buildQuery: (tenantId) => `
      SELECT service, SUM(cost_usd) as total_cost
      FROM cirra.cost_facts FINAL
      WHERE tenant_id = '${tenantId}'
        AND usage_date >= today() - 30
      GROUP BY service
      ORDER BY total_cost DESC
      LIMIT 10
    `,
  },
  {
    name: 'total_spend_this_month',
    patterns: [/total.*spend.*month/i, /how much.*spend/i, /total cost this month/i],
    buildQuery: (tenantId) => `
      SELECT SUM(cost_usd) as total_cost, count() as row_count
      FROM cirra.cost_facts FINAL
      WHERE tenant_id = '${tenantId}'
        AND toStartOfMonth(usage_date) = toStartOfMonth(today())
    `,
  },
  {
    name: 'ai_usage_by_model',
    patterns: [/ai.*model/i, /openai.*usage/i, /token.*usage/i, /which model/i],
    buildQuery: (tenantId) => `
      SELECT model, SUM(total_tokens) as tokens, SUM(cost_usd) as cost
      FROM cirra.ai_usage_facts FINAL
      WHERE tenant_id = '${tenantId}'
        AND usage_date >= today() - 30
      GROUP BY model
      ORDER BY cost DESC
    `,
  },
  {
    name: 'spend_by_region',
    patterns: [/region/i, /which region/i, /cost by region/i],
    buildQuery: (tenantId) => `
      SELECT region, SUM(cost_usd) as total_cost
      FROM cirra.cost_facts FINAL
      WHERE tenant_id = '${tenantId}'
        AND usage_date >= today() - 30
      GROUP BY region
      ORDER BY total_cost DESC
    `,
  },
];

export function matchSemanticTemplate(
  question: string
): SemanticTemplate | null {
  for (const template of SEMANTIC_TEMPLATES) {
    if (template.patterns.some((p) => p.test(question))) {
      return template;
    }
  }
  return null;
}
