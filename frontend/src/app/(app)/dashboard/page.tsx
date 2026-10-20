"use client";

import * as React from "react";
import { DollarSign, TrendingUp, AlertTriangle, Sparkles, Cloud, Bot } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { SpendAreaChart } from "@/components/charts/SpendAreaChart";
import { SpendBarChart } from "@/components/charts/SpendBarChart";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/lib/utils";

const spendTrendData = [
  { date: "Oct 01", cloud: 3100, ai: 850 },
  { date: "Oct 05", cloud: 3300, ai: 920 },
  { date: "Oct 10", cloud: 3150, ai: 1100 },
  { date: "Oct 15", cloud: 3600, ai: 1450 },
  { date: "Oct 20", cloud: 3450, ai: 1380 },
];

const serviceDistribution = [
  { name: "AWS EC2", amount: 42500 },
  { name: "GCP Compute", amount: 37700 },
  { name: "AWS S3", amount: 18200 },
  { name: "OpenAI GPT-4o", amount: 14250 },
  { name: "Anthropic Claude", amount: 11850 },
];

export default function DashboardPage() {
  const { data: summary, isLoading } = useDashboard();

  const totalSpend = summary ? summary.total_spend_mtd : 124500.5;
  const forecasted = summary ? summary.forecasted_spend : 142000.0;
  const cloudSpend = summary ? summary.cloud_spend_mtd : 98400.0;
  const aiSpend = summary ? summary.ai_spend_mtd : 26100.5;
  const anomaliesCount = summary ? summary.anomalies_detected : 3;
  const savings = summary ? summary.potential_savings_monthly : 18500.0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Executive Cost Command
        </h1>
        <p className="text-sm text-zinc-500">
          Real-time normalized FOCUS 1.0 multi-cloud and AI token telemetry.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total MTD Spend"
          value={formatCurrency(totalSpend)}
          change="+4.2%"
          changeType="negative"
          subtitle="vs last month"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Forecasted Spend"
          value={formatCurrency(forecasted)}
          subtitle="End of month estimate"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Cloud Spend"
          value={formatCurrency(cloudSpend)}
          subtitle="AWS + GCP"
          icon={<Cloud className="h-4 w-4" />}
        />
        <StatCard
          title="AI Token Spend"
          value={formatCurrency(aiSpend)}
          change="+28.4%"
          changeType="negative"
          subtitle="OpenAI + Anthropic"
          icon={<Bot className="h-4 w-4" />}
        />
        <StatCard
          title="Anomalies"
          value={anomaliesCount}
          change="Action required"
          changeType="negative"
          subtitle="Open alerts"
          icon={<AlertTriangle className="h-4 w-4 text-rose-500" />}
        />
        <StatCard
          title="Identified Savings"
          value={formatCurrency(savings)}
          change="Realizable"
          changeType="positive"
          subtitle="Monthly run-rate"
          icon={<Sparkles className="h-4 w-4 text-emerald-500" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Spend Trend (Cloud vs AI)</CardTitle>
            <CardDescription>Daily aggregated run-rate normalized to USD</CardDescription>
          </CardHeader>
          <CardContent>
            <SpendAreaChart data={spendTrendData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Spend Services & Models</CardTitle>
            <CardDescription>Highest billed components across all connected tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <SpendBarChart data={serviceDistribution} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
