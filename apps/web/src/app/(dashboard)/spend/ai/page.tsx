"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Button,
} from "@cirra/ui";
import { formatCurrency, formatTokens } from "@cirra/utils";
import type { AiSpendRow } from "@cirra/types";
import { Cpu, KeyRound, Sparkles, AlertCircle } from "lucide-react";

const mockAiRows: AiSpendRow[] = [
  {
    model: "gpt-4o-2024-05-13",
    provider: "openai",
    apiKeyId: "key_prod_copilot_912",
    inputTokens: 18450000,
    outputTokens: 4120000,
    totalTokens: 22570000,
    costUsd: 133.45,
    teamTag: "Search & Recs",
    customerTag: "Acme Corp Enterprise",
    featureTag: "Semantic Search",
    requestCount: 48200,
  },
  {
    model: "claude-3-5-sonnet-20240620",
    provider: "anthropic",
    apiKeyId: "key_agent_support_114",
    inputTokens: 32100000,
    outputTokens: 8900000,
    totalTokens: 41000000,
    costUsd: 229.8,
    teamTag: "Customer Success",
    customerTag: "Tier 1 Accounts",
    featureTag: "Support Auto-Pilot",
    requestCount: 31200,
  },
  {
    model: "text-embedding-3-small",
    provider: "openai",
    apiKeyId: "key_vector_ingest_771",
    inputTokens: 125000000,
    outputTokens: 0,
    totalTokens: 125000000,
    costUsd: 2.5,
    teamTag: "Platform Data",
    customerTag: "Internal",
    featureTag: "Knowledge Base",
    requestCount: 154000,
  },
];

export default function AiSpendPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-6 w-6 text-violet-500" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI & LLM Cost Control
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Granular token telemetry, model pricing, and API key attribution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <KeyRound className="h-4 w-4" /> Manage Keys
          </Button>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white gap-2">
            <Sparkles className="h-4 w-4" /> Cache Optimizer
          </Button>
        </div>
      </div>

      {/* Model & Token Attributions */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Model Usage & Token Breakdown</CardTitle>
              <CardDescription>
                Real-time usage facts mapped to tenant API keys and features
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-violet-600 dark:text-violet-400 border-violet-500/30">
              Live Ingestion
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model / Provider</TableHead>
                <TableHead>Key ID</TableHead>
                <TableHead>Team & Feature</TableHead>
                <TableHead>Input Tokens</TableHead>
                <TableHead>Output Tokens</TableHead>
                <TableHead>Total Cost (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAiRows.map((row) => (
                <TableRow key={`${row.provider}-${row.model}-${row.apiKeyId}`}>
                  <TableCell>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {row.model}
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono mt-0.5">
                      {row.provider}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-slate-500">
                      {row.apiKeyId}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {row.teamTag}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {row.featureTag}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {formatTokens(row.inputTokens)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {formatTokens(row.outputTokens)}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(row.costUsd)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
