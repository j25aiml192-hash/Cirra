// LLM query generation and explanation using Google Gemini API

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0,
  maxOutputTokens = 500
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned an empty response');
  }

  return text.trim();
}

// Call 1: question -> ClickHouse SQL
export async function generateSql(
  question: string,
  tenantId: string
): Promise<string> {
  const schema = `
Tables available:
- cirra.cost_facts (
    tenant_id UUID,
    provider LowCardinality(String),
    service LowCardinality(String),
    region LowCardinality(String),
    usage_date Date,
    cost_usd Decimal(18, 4),
    currency LowCardinality(String),
    team Nullable(String),
    tags Map(String, String)
  )

- cirra.ai_usage_facts (
    tenant_id UUID,
    provider LowCardinality(String),
    model LowCardinality(String),
    api_key_hint String,
    usage_date Date,
    prompt_tokens UInt64,
    completion_tokens UInt64,
    total_tokens UInt64,
    cost_usd Decimal(18, 6),
    team Nullable(String)
  )

Rules:
- Always use FINAL keyword for deduplication (e.g. cirra.cost_facts FINAL)
- Always filter by tenant_id = '${tenantId}'
- Only use SELECT statements
- Use actual column names: service, usage_date, cost_usd, total_tokens
- Return ONLY the raw SQL query, no explanation, no markdown codeblocks, no backticks
`;

  const systemPrompt = `You are a ClickHouse SQL expert. Given a schema and a question, return ONLY a valid ClickHouse SQL query with no explanation.\n\n${schema}`;

  const rawSql = await callGemini(systemPrompt, question, 0, 500);

  // Strip any markdown code fences if generated
  return rawSql
    .replace(/^```(?:sql)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

// Call 2: rows -> explanation (LLM never sees raw numbers as "the answer")
export async function explainRows(
  question: string,
  rows: Record<string, unknown>[]
): Promise<string> {
  if (rows.length === 0) {
    return "No data found for your query. This could mean there's no spend data ingested yet, or the filters don't match any records.";
  }

  const systemPrompt = `You are a cloud cost analyst for Cirra. You are given query results and a user's question. Explain the results in 2-3 clear sentences. Do not invent numbers that are not in the data. Format currency values as USD.`;
  const userPrompt = `Question: ${question}\n\nQuery results: ${JSON.stringify(rows.slice(0, 20))}`;

  return await callGemini(systemPrompt, userPrompt, 0.3, 300);
}

