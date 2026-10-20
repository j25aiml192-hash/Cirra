"use client";

import * as React from "react";
import { Send, Bot, Terminal, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAsk } from "@/hooks/useAsk";

export default function AskCirraPage() {
  const [question, setQuestion] = React.useState("What was our total OpenAI spend this month?");
  const askMutation = useAsk();

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    askMutation.mutate(question);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Ask Cirra Investigator
        </h1>
        <p className="text-sm text-zinc-500">
          Deterministic Text-to-SQL over your FOCUS ClickHouse billing dataset. The LLM only explains the verified query results.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleAsk} className="flex gap-3">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about your cloud or LLM billing (e.g. 'Show top 5 AWS spenders this week')"
              className="flex-1"
            />
            <Button type="submit" disabled={askMutation.isPending} className="gap-2">
              <Send className="h-4 w-4" />
              {askMutation.isPending ? "Investigating..." : "Ask"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {askMutation.data && (
        <div className="space-y-6">
          {/* Explanation Answer */}
          <Card className="border-brand-200 bg-brand-50/20 dark:border-brand-900 dark:bg-brand-950/20">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Bot className="h-5 w-5 text-brand-600" />
              <CardTitle className="text-base text-brand-900 dark:text-brand-300">
                Verified Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-800 dark:text-zinc-200">
                {askMutation.data.answer}
              </p>
            </CardContent>
          </Card>

          {/* Generated and validated SQL */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-zinc-500" />
                <CardTitle className="text-sm">Validated SQL Query</CardTitle>
              </div>
              <Badge variant="success">Tenant Isolation Injected</Badge>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-zinc-900 p-4 font-mono text-xs text-zinc-100 overflow-x-auto">
                {askMutation.data.sql}
              </pre>
            </CardContent>
          </Card>

          {/* Result Rows */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Query Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-zinc-100 dark:bg-zinc-900 p-4 font-mono text-xs overflow-x-auto text-zinc-800 dark:text-zinc-200">
                {JSON.stringify(askMutation.data.rows, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
