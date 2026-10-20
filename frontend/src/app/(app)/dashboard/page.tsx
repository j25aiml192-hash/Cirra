"use client";

import React, { useState } from "react";
import { Eye, Cloud, AlertTriangle, Users, Cpu, ShieldCheck } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { HeroBanner } from "@/components/ui/HeroBanner";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { StatCard } from "@/components/ui/StatCard";
import { SpendBarChart } from "@/components/charts/SpendBarChart";
import { TopServicesTable } from "@/components/ui/TopServicesTable";
import { TopAiKeysCard } from "@/components/ui/TopAiKeysCard";
import type { Period } from "@/types";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const { data, isLoading } = useDashboard();

  const totalSpendFormatted = data ? `$${data.total_spend_mtd.toLocaleString()}` : "$0";
  const aiSpendFormatted = data ? `$${data.ai_spend_mtd.toLocaleString()}` : "$0";
  const projectedFormatted = data ? `$${(data.forecasted_spend / 1000).toFixed(0)}K` : "$0";
  const coveragePercentFormatted = data ? `${data.attributionCoverage.percentage}%` : "0%";
  const coverageSub = data
    ? `${data.attributionCoverage.resourcesCount} of ${data.attributionCoverage.totalResources} resources`
    : "";

  return (
    <main className="p-8 space-y-5">
      {/* Greeting row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Good afternoon, Hiten 👋</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-400">Tuesday, October 20, 2026</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200/40">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Live Data
            </span>
          </div>
        </div>

        <button
          type="button"
          className="text-sm text-slate-600 border border-slate-200 bg-white rounded-lg px-3.5 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Eye className="w-4 h-4 text-slate-500" />
          <span>Executive View</span>
        </button>
      </div>

      {/* HeroBanner with dynamic chips from hook */}
      <HeroBanner
        title="Multi-Cloud & AI Infrastructure Velocity"
        chips={[
          {
            icon: <Cloud className="w-3.5 h-3.5 text-indigo-200" />,
            label: `Total $${data ? Math.round(data.total_spend_mtd / 1000) : 0}K/mo`,
          },
          {
            icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />,
            label: `${data?.anomalies_detected ?? 0} anomalies`,
          },
          {
            icon: <Users className="w-3.5 h-3.5 text-emerald-200" />,
            label: `${data?.attributionCoverage.percentage ?? 0}% attributed`,
          },
        ]}
      />

      {/* Period tabs row */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          PERIOD
        </span>
        <PeriodTabs value={period} onChange={setPeriod} />
      </div>

      {/* 4 StatCards in grid-cols-4 gap-5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          variant="blue"
          icon={<Cloud className="w-4 h-4" />}
          label="TOTAL SPEND / OCT"
          value={totalSpendFormatted}
          sub="+$5,180 vs last month"
          delta="+4.2%"
          deltaPositive={false}
          progress={65}
          loading={isLoading}
        />
        <StatCard
          variant="red"
          icon={<Cpu className="w-4 h-4" />}
          label="AI FOUNDATION MODELS"
          value={aiSpendFormatted}
          sub="2.1B tokens consumed"
          delta="+18.4%"
          deltaPositive={false}
          loading={isLoading}
        />
        <StatCard
          variant="green"
          icon={<ShieldCheck className="w-4 h-4" />}
          label="ATTRIBUTION COVERAGE"
          value={coveragePercentFormatted}
          sub={coverageSub}
          progress={data?.attributionCoverage.percentage ? Math.round(data.attributionCoverage.percentage) : 0}
          loading={isLoading}
        />
        <StatCard
          variant="amber"
          icon={<AlertTriangle className="w-4 h-4" />}
          label="PROJECTED MONTH-END"
          value={projectedFormatted}
          sub="Over budget by 12%"
          delta="87%"
          deltaPositive={false}
          loading={isLoading}
        />
      </div>

      {/* Bar chart card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Monthly Multi-Provider Spend Trajectory</h3>
            <p className="text-xs text-slate-400 mt-0.5">Historical FOCUS normalized billed expense across AWS, GCP, OpenAI, Anthropic</p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            6 Months Trend
          </span>
        </div>
        <SpendBarChart data={data?.monthly ?? []} loading={isLoading} />
      </div>

      {/* Two-column row (grid-cols-3 gap-5) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <TopServicesTable data={data?.topServices ?? []} loading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <TopAiKeysCard data={data?.topAiKeys ?? []} loading={isLoading} />
        </div>
      </div>
    </main>
  );
}
