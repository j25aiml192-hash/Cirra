"use client";

import * as React from "react";
import { Cloud, Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useCloudSpend } from "@/hooks/useSpend";
import { formatCurrency } from "@/lib/utils";
import type { CloudSpendRecord } from "@/types/api";

const mockCloudSpend: CloudSpendRecord[] = [
  {
    service: "Amazon Elastic Compute Cloud - Compute",
    provider: "AWS",
    billedCost: 42500.0,
    effectiveCost: 39800.0,
    team: "core-infra",
  },
  {
    service: "Amazon Simple Storage Service",
    provider: "AWS",
    billedCost: 18200.0,
    effectiveCost: 18200.0,
    team: "data-platform",
  },
  {
    service: "Compute Engine",
    provider: "GCP",
    billedCost: 37700.0,
    effectiveCost: 35400.0,
    team: "ai-services",
  },
];

export default function CloudSpendPage() {
  const { data } = useCloudSpend();
  const items = data?.items || mockCloudSpend;

  const columns = [
    {
      key: "provider",
      header: "Provider",
      render: (row: CloudSpendRecord) => (
        <Badge variant={row.provider === "AWS" ? "default" : "secondary"}>
          {row.provider}
        </Badge>
      ),
    },
    {
      key: "service",
      header: "Service Description",
      render: (row: CloudSpendRecord) => (
        <div className="font-medium text-zinc-900 dark:text-zinc-100">{row.service}</div>
      ),
    },
    {
      key: "team",
      header: "Attributed Team",
      render: (row: CloudSpendRecord) => (
        <span className="text-xs text-zinc-500">{row.team || "Unallocated"}</span>
      ),
    },
    {
      key: "billedCost",
      header: "Billed Cost",
      render: (row: CloudSpendRecord) => (
        <span className="font-mono text-xs">{formatCurrency(row.billedCost)}</span>
      ),
    },
    {
      key: "effectiveCost",
      header: "Effective Cost (with RIs/SAPs)",
      render: (row: CloudSpendRecord) => (
        <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.effectiveCost)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Cloud Infrastructure Spend
          </h1>
          <p className="text-sm text-zinc-500">
            FOCUS 1.0 standardized billing data mapped across AWS and Google Cloud Platform.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Billed vs. Effective Ingest</CardTitle>
            <CardDescription>Line items grouped by ServiceName and SubAccount</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={items}
            keyExtractor={(row) => `${row.provider}-${row.service}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
