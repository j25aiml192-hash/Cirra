"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
} from "@cirra/ui";
import { Sparkles, Send, Terminal, ShieldCheck, Database } from "lucide-react";
import type { AskResponse } from "@cirra/types";

export default function AskCirraPage() {
  const [question, setQuestion] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<AskResponse | null>({
    answer:
      "Across your organization, OpenAI GPT-4o usage accounted for $6,850.00 this month, representing a 28% increase over the previous period. The highest spend was driven by key `key_prod_copilot_912` used by the Search & Recs team.",
    sql: "SELECT model, sum(cost_usd) as total_cost, sum(input_tokens + output_tokens) as total_tokens FROM ai_usage_facts WHERE tenant_id = 'demo-tenant-1' AND ts >= now() - INTERVAL 30 DAY GROUP BY model ORDER BY total_cost DESC LIMIT 10",
    rows: [
      { model: "gpt-4o", total_cost: 6850.0, total_tokens: 22570000 },
      { model: "claude-3-5-sonnet", total_cost: 2879.75, total_tokens: 41000000 },
      { model: "text-embedding-3-small", total_cost: 2.5, total_tokens: 125000000 },
    ],
    confidence: 0.96,
    warning: null,
  });

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;
    setIsLoading(true);
    // In production, invokes /api/v1/ask via apiFetch
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-500" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ask Cirra
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Natural language interface powered by FOCUS semantic models and ClickHouse
        </p>
      </div>

      {/* Query Bar */}
      <Card className="border-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20 p-2">
        <form onSubmit={handleAsk} className="flex gap-2">
          <Input
            placeholder="e.g. Which team generated the highest GPT-4o cost last week?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="border-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-none focus-visible:ring-0"
          />
          <Button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 gap-1.5"
            disabled={isLoading}
          >
            <Send className="h-4 w-4" />
            <span>Ask</span>
          </Button>
        </form>
      </Card>

      {/* Suggestion Prompts */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-slate-400 py-1">Try asking:</span>
        {[
          "What were my top 5 AWS spend drivers this month?",
          "Show unallocated Kubernetes cluster costs by namespace",
          "Identify idle EC2 instances with less than 5% CPU utilization",
        ].map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => setQuestion(prompt)}
            className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Response Box */}
      {result && (
        <div className="space-y-4">
          {/* Executive Answer */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Verified Answer
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Confidence: {Math.round(result.confidence * 100)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {result.answer}
              </p>
            </CardContent>
          </Card>

          {/* Generated SQL & ClickHouse execution */}
          <Card className="border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2 font-mono">
                  <Terminal className="h-4 w-4 text-indigo-400" />
                  Generated FOCUS SQL (ClickHouse Read-Only)
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <Database className="h-3 w-3" /> Tenant isolation enforced
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="font-mono text-xs overflow-x-auto p-3 rounded bg-slate-900/90 text-indigo-200 border border-slate-800">
                {result.sql}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
