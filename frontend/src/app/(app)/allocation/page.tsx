"use client";

import * as React from "react";
import { PieChart, Plus, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import type { AllocationRule } from "@/types/api";

const mockRules: AllocationRule[] = [
  {
    id: "r1",
    priority: 1,
    match_type: "tag",
    match_value: "env=production",
    assign_team: "core-infra",
    assign_feature: "platform",
  },
  {
    id: "r2",
    priority: 2,
    match_type: "prefix",
    match_value: "ai-copilot-",
    assign_team: "copilot-eng",
    assign_feature: "ai-copilot",
  },
];

export default function AllocationPage() {
  const columns = [
    {
      key: "priority",
      header: "Priority",
      render: (row: AllocationRule) => (
        <span className="font-mono text-xs font-semibold">#{row.priority}</span>
      ),
    },
    {
      key: "match",
      header: "Match Rule",
      render: (row: AllocationRule) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline">{row.match_type}</Badge>
          <code className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
            {row.match_value}
          </code>
        </div>
      ),
    },
    {
      key: "assign_team",
      header: "Assigned Team",
      render: (row: AllocationRule) => (
        <span className="text-xs font-medium">{row.assign_team || "—"}</span>
      ),
    },
    {
      key: "assign_feature",
      header: "Feature / Service",
      render: (row: AllocationRule) => (
        <span className="text-xs text-zinc-500">{row.assign_feature || "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Cost Allocation & Unit Economics
          </h1>
          <p className="text-sm text-zinc-500">
            Rule engine mapping raw cloud tags and metadata to business teams, features, and customers.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Rule
        </Button>
      </div>

      {/* Coverage Progress Card */}
      <Card className="bg-gradient-to-r from-zinc-900 to-zinc-950 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Attribution Coverage
              </p>
              <h2 className="text-3xl font-bold mt-1">85.0%</h2>
              <p className="text-xs text-zinc-400 mt-1">
                {formatCurrency(105825.42)} of {formatCurrency(124500.5)} attributed
              </p>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Above 80% SLA Target</span>
            </div>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: "85%" }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configured Allocation Rules</CardTitle>
          <CardDescription>Evaluated in priority order upon FOCUS ingestion</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={mockRules}
            keyExtractor={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
