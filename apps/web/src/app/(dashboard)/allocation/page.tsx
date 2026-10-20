"use client";

import type { AllocationCoverage, AllocationRule } from "@cirra/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@cirra/ui";
import { formatCurrency, formatPct } from "@cirra/utils";
import { Layers, PieChart, Plus, ShieldCheck } from "lucide-react";
import * as React from "react";

const mockCoverage: AllocationCoverage = {
  tenantId: "demo-tenant-1",
  totalSpend: 42850.25,
  allocatedSpend: 38100.0,
  unallocatedSpend: 4750.25,
  coveragePercentage: 88.9,
  byDimension: {
    teamCoveragePct: 91.2,
    customerCoveragePct: 78.4,
    featureCoveragePct: 84.1,
  },
};

const mockRules: AllocationRule[] = [
  {
    id: "rule-1",
    tenantId: "demo-tenant-1",
    name: "Tag-Based Team Attribution",
    priority: 1,
    method: "tag_exact",
    tagKey: "Team",
    targetDimension: "team",
    targetValue: "{{tag.Team}}",
    filterConditions: { provider: ["aws", "gcp"] },
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "rule-2",
    tenantId: "demo-tenant-1",
    name: "Shared Kubernetes Cluster Pro-Rata",
    priority: 2,
    method: "pro_rata",
    tagKey: null,
    targetDimension: "customer",
    targetValue: "enterprise-customers",
    filterConditions: { serviceName: "Google Cloud Kubernetes" },
    createdAt: "2026-09-15T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
];

export default function AllocationPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PieChart className="h-6 w-6 text-indigo-500" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Cost Allocation & Unit Economics
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Attribute shared and multi-tenant cloud spend to teams, customers, and features
          </p>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 gap-1.5">
          <Plus className="h-4 w-4" /> Create Rule
        </Button>
      </div>

      {/* Coverage Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-5">
            <span className="text-xs text-slate-400">Overall Allocation Coverage</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {formatPct(mockCoverage.coveragePercentage)}
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${mockCoverage.coveragePercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-5">
            <span className="text-xs text-slate-400">Allocated Spend (MTD)</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {formatCurrency(mockCoverage.allocatedSpend)}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> High audit confidence
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-5">
            <span className="text-xs text-slate-400">Unallocated Float</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {formatCurrency(mockCoverage.unallocatedSpend)}
            </div>
            <p className="text-xs text-slate-400 mt-2">Shared networks, untagged S3 buckets</p>
          </CardContent>
        </Card>
      </div>

      {/* Rules Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Active Allocation Rules</CardTitle>
          <CardDescription>
            Ordered rules evaluated top-to-bottom during FOCUS normalization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Target Dimension</TableHead>
                <TableHead>Target Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    #{rule.priority}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-white">
                    {rule.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {rule.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize text-slate-700 dark:text-slate-300">
                    {rule.targetDimension}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                    {rule.targetValue}
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
