"use client";

import type { CostFact } from "@cirra/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@cirra/ui";
import { formatCurrency } from "@cirra/utils";
import { Cloud, Download, Filter } from "lucide-react";
import * as React from "react";

const mockCostFacts: CostFact[] = [
  {
    tenantId: "demo-tenant-1",
    chargePeriodStart: "2026-10-01T00:00:00Z",
    chargePeriodEnd: "2026-10-01T23:59:59Z",
    provider: "aws",
    serviceName: "AmazonEC2",
    resourceId: "i-098484bf87ad2e10a",
    skuId: "m6i.2xlarge",
    billedCost: 452.3,
    effectiveCost: 316.6,
    currency: "USD",
    tags: { Team: "core-platform", Environment: "prod" },
    allocatedTeam: "Platform",
    allocatedCustomer: "Enterprise Pool",
    allocatedFeature: "Compute Engine",
    allocationMethod: "tag_exact",
    insertedAt: "2026-10-02T02:00:00Z",
  },
  {
    tenantId: "demo-tenant-1",
    chargePeriodStart: "2026-10-01T00:00:00Z",
    chargePeriodEnd: "2026-10-01T23:59:59Z",
    provider: "gcp",
    serviceName: "Compute Engine (GKE Nodes)",
    resourceId: "gke-prod-pool-01",
    skuId: "n2-standard-8",
    billedCost: 320.5,
    effectiveCost: 288.45,
    currency: "USD",
    tags: { Team: "data-ml", Environment: "prod" },
    allocatedTeam: "Data & ML",
    allocatedCustomer: "Global",
    allocatedFeature: "Inference Cluster",
    allocationMethod: "rule_based",
    insertedAt: "2026-10-02T02:00:00Z",
  },
  {
    tenantId: "demo-tenant-1",
    chargePeriodStart: "2026-10-01T00:00:00Z",
    chargePeriodEnd: "2026-10-01T23:59:59Z",
    provider: "azure",
    serviceName: "Azure Blob Storage",
    resourceId: "cirrabackupstore01",
    skuId: "Standard Hot LRS",
    billedCost: 114.2,
    effectiveCost: 114.2,
    currency: "USD",
    tags: { Team: "infrastructure" },
    allocatedTeam: "Infra",
    allocatedCustomer: null,
    allocatedFeature: "Cold Archive",
    allocationMethod: "tag_exact",
    insertedAt: "2026-10-02T02:00:00Z",
  },
];

export default function CloudSpendPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cloud className="h-6 w-6 text-indigo-500" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Cloud Infrastructure Spend
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Multi-cloud billing telemetry normalized into FOCUS 1.0 schema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500">Provider</label>
            <Select
              defaultValue="all"
              options={[
                { label: "All Cloud Providers", value: "all" },
                { label: "AWS", value: "aws" },
                { label: "GCP", value: "gcp" },
                { label: "Azure", value: "azure" },
              ]}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Date Range</label>
            <Select
              defaultValue="mtd"
              options={[
                { label: "Month to Date", value: "mtd" },
                { label: "Last 30 Days", value: "30d" },
                { label: "Last 90 Days", value: "90d" },
              ]}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Group By</label>
            <Select
              defaultValue="service"
              options={[
                { label: "Service Name", value: "service" },
                { label: "Team Allocation", value: "team" },
                { label: "Resource ID", value: "resource" },
              ]}
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500">Apply Query</Button>
          </div>
        </div>
      </Card>

      {/* FOCUS Telemetry Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Normalized Cost Facts (FOCUS 1.0)</CardTitle>
          <CardDescription>
            Row-level cost telemetry showing billed cost vs effective (amortized) cost
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Resource ID / SKU</TableHead>
                <TableHead>Allocated Team</TableHead>
                <TableHead>Billed Cost</TableHead>
                <TableHead>Effective Cost</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCostFacts.map((fact) => (
                <TableRow key={`${fact.provider}-${fact.resourceId}`}>
                  <TableCell>
                    <Badge variant="outline" className="uppercase font-mono text-[10px]">
                      {fact.provider}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                    {fact.serviceName}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs text-slate-600 dark:text-slate-400">
                      {fact.resourceId}
                    </div>
                    <div className="text-[10px] text-slate-400">{fact.skuId}</div>
                  </TableCell>
                  <TableCell>
                    {fact.allocatedTeam ? (
                      <Badge variant="secondary" className="text-xs">
                        {fact.allocatedTeam}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Unallocated</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(fact.billedCost, fact.currency)}
                  </TableCell>
                  <TableCell className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(fact.effectiveCost, fact.currency)}
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-mono text-slate-500">
                      {fact.allocationMethod}
                    </span>
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
