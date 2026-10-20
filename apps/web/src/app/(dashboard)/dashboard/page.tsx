"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
} from "@cirra/ui";
import { formatCurrency, formatPct } from "@cirra/utils";
import type { DashboardSummary } from "@cirra/types";
import {
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Sparkles,
  Cloud,
  Cpu,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";

const mockSummary: DashboardSummary = {
  tenantId: "demo-tenant-1",
  totalSpendMonthToDate: 42850.25,
  projectedMonthEndSpend: 61400.0,
  cloudSpendMonthToDate: 33120.5,
  aiSpendMonthToDate: 9729.75,
  spendChangePercentage: 14.2,
  activeAnomaliesCount: 3,
  potentialSavingsEstimate: 8350.0,
  topServices: [
    { serviceName: "AmazonEC2", provider: "aws", cost: 14200, pctTotal: 33.1 },
    { serviceName: "OpenAI GPT-4o", provider: "openai", cost: 6850, pctTotal: 16.0 },
    { serviceName: "Google Cloud Kubernetes", provider: "gcp", cost: 5900, pctTotal: 13.8 },
    { serviceName: "AmazonRDS", provider: "aws", cost: 4300, pctTotal: 10.0 },
    { serviceName: "Claude 3.5 Sonnet", provider: "anthropic", cost: 2879.75, pctTotal: 6.7 },
  ],
  dailySpendTrend: [
    { date: "2026-10-14", cloudCost: 1100, aiCost: 320, totalCost: 1420 },
    { date: "2026-10-15", cloudCost: 1150, aiCost: 340, totalCost: 1490 },
    { date: "2026-10-16", cloudCost: 1080, aiCost: 310, totalCost: 1390 },
    { date: "2026-10-17", cloudCost: 1220, aiCost: 390, totalCost: 1610 },
    { date: "2026-10-18", cloudCost: 1290, aiCost: 450, totalCost: 1740 },
    { date: "2026-10-19", cloudCost: 1340, aiCost: 510, totalCost: 1850 },
    { date: "2026-10-20", cloudCost: 1380, aiCost: 540, totalCost: 1920 },
  ],
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Cost Control Plane
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Unified FinOps and AI cost telemetry aligned to FOCUS 1.0 schema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-slate-300 dark:border-slate-800"
            onClick={() => (window.location.href = "/ask")}
          >
            <Sparkles className="h-4 w-4 text-indigo-500" />
            Ask Cirra
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Total Spend (MTD)</span>
              <TrendingUp className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(mockSummary.totalSpendMonthToDate)}
              </span>
              <Badge variant="destructive" className="gap-1 text-[11px] py-0 px-1.5">
                <ArrowUpRight className="h-3 w-3" />
                {formatPct(mockSummary.spendChangePercentage)}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Projected {formatCurrency(mockSummary.projectedMonthEndSpend)} at month end
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Cloud Infrastructure</span>
              <Cloud className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(mockSummary.cloudSpendMonthToDate)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              77.3% of total monthly infrastructure
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>AI & LLM Spend</span>
              <Cpu className="h-4 w-4 text-violet-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(mockSummary.aiSpendMonthToDate)}
              </span>
              <Badge variant="warning" className="gap-1 text-[11px] py-0 px-1.5">
                <ArrowUpRight className="h-3 w-3" />
                +28.4%
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Across OpenAI, Anthropic, Bedrock
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Active Sentinel Alerts</span>
              <ShieldAlert className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {mockSummary.activeAnomaliesCount}
              </span>
              <Badge variant="warning" className="text-[11px] py-0 px-1.5">
                Requires Review
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Potential savings: {formatCurrency(mockSummary.potentialSavingsEstimate)}/mo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Services Breakdown */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base">Top Spend Drivers by Service</CardTitle>
            <CardDescription>
              Ranked by billed cost according to FOCUS normalizer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockSummary.topServices.map((svc) => (
              <div key={svc.serviceName} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {svc.serviceName}
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {svc.provider}
                    </Badge>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(svc.cost)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${svc.pctTotal}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sentinel Anomaly Summary */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Sentinel Anomaly Feed</CardTitle>
              <Badge variant="outline" className="text-[10px]">
                ARIMA + MAD
              </Badge>
            </div>
            <CardDescription>
              Unsupervised statistical anomaly engine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg border border-red-200 dark:border-red-950/60 bg-red-50/50 dark:bg-red-950/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                  GPT-4o Sudden Token Spike
                </span>
                <span className="text-[10px] text-red-500 font-mono">+185%</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Key sk-prod-search triggered 4.2M input tokens in 15 mins.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-950/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  AWS NAT Gateway Egress
                </span>
                <span className="text-[10px] text-amber-500 font-mono">+64%</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                us-east-1 VPC egress jump exceeding 30-day baseline by 3.8 MAD.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs mt-2"
              onClick={() => (window.location.href = "/spend/cloud")}
            >
              View All Detections
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
