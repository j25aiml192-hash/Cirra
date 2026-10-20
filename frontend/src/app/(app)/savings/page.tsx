"use client";

import * as React from "react";
import { PiggyBank, ShieldCheck, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import type { SavingsEntry } from "@/types/api";

const mockSavings: SavingsEntry[] = [
  {
    id: "s1",
    method: "ec2_downsizing",
    baseline_cost: 2400.0,
    realized_cost: 1150.0,
    monthly_savings: 1250.0,
    confidence: 0.95,
    status: "realized",
  },
  {
    id: "s2",
    method: "prompt_compression_caching",
    baseline_cost: 5000.0,
    realized_cost: 2100.0,
    monthly_savings: 2900.0,
    confidence: 0.88,
    status: "realized",
  },
  {
    id: "s3",
    method: "idle_rds_snapshot_and_terminate",
    baseline_cost: 1800.0,
    realized_cost: 0.0,
    monthly_savings: 1800.0,
    confidence: 0.99,
    status: "pending_approval",
  },
];

export default function SavingsPage() {
  const [entries, setEntries] = React.useState(mockSavings);

  const handleApprove = (id: string) => {
    setEntries(
      entries.map((e) => (e.id === id ? { ...e, status: "approved" } : e))
    );
  };

  const columns = [
    {
      key: "method",
      header: "Optimization Strategy",
      render: (row: SavingsEntry) => (
        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.method}</div>
      ),
    },
    {
      key: "baseline",
      header: "Baseline Spend",
      render: (row: SavingsEntry) => (
        <span className="font-mono text-xs">{formatCurrency(row.baseline_cost)}</span>
      ),
    },
    {
      key: "savings",
      header: "Monthly Realized Savings",
      render: (row: SavingsEntry) => (
        <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          +{formatCurrency(row.monthly_savings)}/mo
        </span>
      ),
    },
    {
      key: "confidence",
      header: "Confidence Score",
      render: (row: SavingsEntry) => (
        <span className="text-xs font-mono">{(row.confidence * 100).toFixed(0)}%</span>
      ),
    },
    {
      key: "status",
      header: "Status / Safety Gate",
      render: (row: SavingsEntry) => (
        <div>
          {row.status === "realized" && <Badge variant="success">Realized</Badge>}
          {row.status === "approved" && <Badge variant="default">Approved</Badge>}
          {row.status === "pending_approval" && (
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Approval Required</Badge>
              <Button size="sm" onClick={() => handleApprove(row.id)} className="h-7 px-2 text-xs">
                <Check className="h-3 w-3 mr-1" /> Approve
              </Button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Guaranteed Savings & Autonomous Actions
          </h1>
          <p className="text-sm text-zinc-500">
            Automated recommendations with cryptographic audit trails and mandatory human-in-the-loop gates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Total Monthly Realized Savings
          </p>
          <div className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(4150.0)}/mo
          </div>
          <p className="mt-1 text-xs text-zinc-400">Verified through historical billing diffs</p>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Pipeline Opportunity
          </p>
          <div className="mt-2 text-3xl font-extrabold text-brand-600 dark:text-brand-400">
            {formatCurrency(14350.0)}/mo
          </div>
          <p className="mt-1 text-xs text-zinc-400">Awaiting engineering safety approvals</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Action Registry & Proof of Savings</CardTitle>
          <CardDescription>
            Deterministic attribution comparing pre-action baseline with post-action telemetry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={entries}
            keyExtractor={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
