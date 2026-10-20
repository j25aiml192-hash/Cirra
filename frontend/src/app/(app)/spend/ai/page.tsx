"use client";

import * as React from "react";
import { Bot, Key } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ModelCostChart } from "@/components/charts/ModelCostChart";
import { useAiSpend } from "@/hooks/useSpend";
import { formatCurrency, formatTokens } from "@/lib/utils";
import type { AiSpendRecord } from "@/types/api";

const mockAiSpend: AiSpendRecord[] = [
  {
    model: "gpt-4o",
    provider: "OpenAI",
    apiKeyId: "key_prod_app",
    inputTokens: 450000000,
    outputTokens: 95000000,
    costUsd: 14250.0,
    team: "copilot-eng",
    customer: "enterprise-tier",
  },
  {
    model: "claude-3-5-sonnet-20241022",
    provider: "Anthropic",
    apiKeyId: "key_anthropic_main",
    inputTokens: 320000000,
    outputTokens: 75000000,
    costUsd: 11850.5,
    team: "agent-eng",
    customer: "all",
  },
];

export default function AiSpendPage() {
  const { data } = useAiSpend();
  const items = data?.items || mockAiSpend;

  const chartData = items.map((i) => ({
    model: i.model,
    cost: i.costUsd,
  }));

  const columns = [
    {
      key: "provider",
      header: "Provider & Model",
      render: (row: AiSpendRecord) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.model}</div>
          <span className="text-[11px] text-zinc-400">{row.provider}</span>
        </div>
      ),
    },
    {
      key: "apiKeyId",
      header: "API Key / Org",
      render: (row: AiSpendRecord) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-600 dark:text-zinc-400">
          <Key className="h-3 w-3 text-zinc-400" />
          <span>{row.apiKeyId}</span>
        </div>
      ),
    },
    {
      key: "tokens",
      header: "Tokens (Input / Output)",
      render: (row: AiSpendRecord) => (
        <div className="font-mono text-xs">
          <span className="text-zinc-700 dark:text-zinc-300">{formatTokens(row.inputTokens)} in</span>
          <span className="text-zinc-400"> / </span>
          <span className="text-purple-600 dark:text-purple-400">{formatTokens(row.outputTokens)} out</span>
        </div>
      ),
    },
    {
      key: "attribution",
      header: "Team / Customer",
      render: (row: AiSpendRecord) => (
        <div className="text-xs">
          <Badge variant="outline">{row.team || "Shared"}</Badge>
          {row.customer && (
            <span className="ml-1 text-[11px] text-zinc-400">({row.customer})</span>
          )}
        </div>
      ),
    },
    {
      key: "costUsd",
      header: "Cost (USD)",
      render: (row: AiSpendRecord) => (
        <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          {formatCurrency(row.costUsd)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          AI & LLM Token Telemetry
        </h1>
        <p className="text-sm text-zinc-500">
          Prompt caching, model cost attribution, and real-time generation expense.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Model Cost Breakdown</CardTitle>
            <CardDescription>Highest consuming foundation models</CardDescription>
          </CardHeader>
          <CardContent>
            <ModelCostChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Token Usage Telemetry</CardTitle>
            <CardDescription>Attributed to API keys and customer tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={items}
              keyExtractor={(row) => `${row.provider}-${row.apiKeyId}-${row.model}`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
