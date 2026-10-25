"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Eye,
  Cloud,
  AlertTriangle,
  Cpu,
  ShieldCheck,
  Filter,
  PlusCircle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Layers,
  Plug,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { useDashboard } from "@/hooks/useDashboard";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { SpendBarChart } from "@/components/charts/SpendBarChart";
import { TopServicesTable } from "@/components/ui/TopServicesTable";
import { TopAiKeysCard } from "@/components/ui/TopAiKeysCard";
import { formatNumber } from "@/lib/utils";
import type { Period } from "@/types";
import MagicBento, { MagicBentoCard } from "./MagicBento";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [selectedProvider, setSelectedProvider] = useState<string>("All");
  const { data, isLoading } = useDashboard(period);

  const totalSpendFormatted = data?.total_spend_mtd ? `$${formatNumber(data.total_spend_mtd)}` : "$0";
  const aiSpendFormatted = data?.ai_spend_mtd ? `$${formatNumber(data.ai_spend_mtd)}` : "$0";
  const cloudSpendFormatted = data?.cloud_spend_mtd ? `$${formatNumber(data.cloud_spend_mtd)}` : "$0";
  const projectedFormatted = data?.forecasted_spend
    ? `$${formatNumber(Math.round(data.forecasted_spend / 1000))}K`
    : "$0K";
  const coveragePercentFormatted = data?.attributionCoverage?.percentage
    ? `${data.attributionCoverage.percentage.toFixed(1)}%`
    : "0.0%";
  const coverageSub = data?.attributionCoverage?.totalResources
    ? `${data.attributionCoverage.resourcesCount} of ${data.attributionCoverage.totalResources} resources`
    : "0 of 0 resources attributed";

  const providers = ["All", "AWS", "GCP", "OpenAI", "Anthropic"];

  const hasNoData = !data || (data.total_spend_mtd === 0 && (data.monthly?.length ?? 0) === 0);

  return (
    <div className="min-h-screen">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto select-none">
        {/* Context Control Toolbar with Magic Bento interactive glow */}
        <MagicBentoCard
          radius={20}
          className="w-full"
          contentClassName="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A1A1A] tracking-tight">
                FOCUS Cost Velocity
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2B2B2B] bg-[#F3F4F6] px-2.5 py-0.5 rounded-full border border-[#D1D5DB] shadow-2xs">
                <span className="w-1.5 h-1.5 bg-[#2B2B2B] rounded-full animate-pulse" />
                Live Feed
              </span>
            </div>
            <p className="text-xs text-[#5E5E5E] font-medium mt-0.5">
              Multi-cloud & foundation model telemetry normalized across providers
            </p>
          </div>

          {/* Unified Controls: Period & Provider Filters */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <PeriodTabs value={period} onChange={setPeriod} />

            {/* Provider Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#F3F4F6] p-1 rounded-full border border-[#E5E7EB]">
              <Filter className="w-3 h-3 text-[#6F6F6F] ml-2 mr-0.5" />
              {providers.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedProvider(p)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                    selectedProvider === p
                      ? "bg-[#1A1A1A] text-white shadow-2xs"
                      : "text-[#5E5E5E] hover:text-[#1A1A1A]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="h-8 px-3.5 rounded-xl border border-[#D1D5DB] bg-white text-xs font-bold text-[#2B2B2B] hover:bg-[#F3F4F6] hover:text-[#1A1A1A] active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
              title="Toggle Executive Summary Mode"
            >
              <Eye className="w-3.5 h-3.5 text-[#4D4D4D]" />
              <span className="hidden sm:inline">Executive</span>
            </button>
          </div>
        </MagicBentoCard>

        {/* Setup Callout Banner with Magic Bento interactive glow */}
        {hasNoData && !isLoading && (
          <MagicBentoCard
            radius={20}
            className="w-full"
            contentClassName="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F3F4F6] border border-[#D1D5DB] flex items-center justify-center text-[#1A1A1A] flex-shrink-0 mt-0.5">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">
                  No active cloud or AI provider connections
                </h3>
                <p className="text-xs text-[#5E5E5E] mt-0.5 max-w-xl">
                  Connect AWS (CUR), GCP (BigQuery billing export), Azure, OpenAI, or Anthropic in Settings to stream live FOCUS telemetry.
                </p>
              </div>
            </div>
            <Link
              href="/settings/connections"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A1A1A] text-white text-xs font-bold hover:bg-[#2B2B2B] transition-colors shadow-2xs flex-shrink-0"
            >
              <Plug className="w-3.5 h-3.5" />
              <span>Connect Providers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </MagicBentoCard>
        )}

        {/* MagicBento Grid in Bright Theme */}
        <MagicBento
          columns={4}
          rowHeight={200}
          gap={12}
          radius={20}
          enableBorderGlow={true}
          enableSpotlight={true}
          spotlightRadius={300}
          clickEffect={true}
        >
          {/* Card 1: Hero Spend Headline & Multi-Provider Bar Trajectory */}
          <MagicBentoCard colSpan={3} rowSpan={2} radius={20}>
            <div className="flex flex-col justify-between h-full">
              {/* Header Row: Big bold metric & breakdown chips */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 mb-3 border-b border-[#F3F4F6]">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4D4D4D]">
                    TOTAL SPEND / {period.toUpperCase()}
                  </span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] cirra-metric tracking-tight">
                      {totalSpendFormatted}
                    </span>
                    {data?.mom_change !== undefined && data.mom_change !== 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3F4F6] text-[#2B2B2B] border border-[#E5E7EB]">
                        {data.mom_change <= 0 ? (
                          <TrendingDown className="w-3.5 h-3.5 text-[#4D4D4D]" />
                        ) : (
                          <TrendingUp className="w-3.5 h-3.5 text-[#4D4D4D]" />
                        )}
                        {data.mom_change >= 0 ? "+" : ""}
                        {data.mom_change.toFixed(1)}% vs prior
                      </span>
                    ) : (
                      <span className="text-xs text-[#5E5E5E] font-medium">
                        Normalized billed
                      </span>
                    )}
                  </div>
                </div>

                {/* Micro Breakdown Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs">
                    <span className="text-[#5E5E5E]">Cloud: </span>
                    <span className="font-bold text-[#1A1A1A] cirra-metric">{cloudSpendFormatted}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs">
                    <span className="text-[#5E5E5E]">AI: </span>
                    <span className="font-bold text-[#1A1A1A] cirra-metric">{aiSpendFormatted}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs">
                    <span className="text-[#5E5E5E]">Proj: </span>
                    <span className="font-bold text-[#1A1A1A] cirra-metric">{projectedFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Trajectory Bar Chart */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#1A1A1A] text-sm tracking-tight">
                      Monthly Multi-Provider Spend Trajectory
                    </h3>
                    <span className="text-[10px] font-bold text-[#2B2B2B] bg-[#F3F4F6] px-2 py-0.5 rounded-full border border-[#D1D5DB]">
                      FOCUS 1.0
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#5E5E5E]">
                    {period === "30d" ? "30 Days" : period === "90d" ? "90 Days" : period === "6m" ? "6 Months" : "12 Months"} Trend
                  </span>
                </div>

                <SpendBarChart
                  data={data?.monthly ?? []}
                  loading={isLoading}
                  selectedProvider={selectedProvider}
                />
              </div>
            </div>
          </MagicBentoCard>

          {/* Card 2: AI Foundation Models */}
          <MagicBentoCard colSpan={1} rowSpan={1} radius={20}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4D4D4D]">
                AI Foundation Models
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#2B2B2B]">
                <Cpu className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold text-[#1A1A1A] cirra-metric">
                {aiSpendFormatted}
              </div>
              <div className="flex items-center justify-between text-xs text-[#5E5E5E] mt-1">
                <span>
                  {data?.total_tokens ? `${formatNumber(data.total_tokens)} tokens` : "0 tokens"}
                </span>
                {data?.total_spend_mtd && data.total_spend_mtd > 0 ? (
                  <span className="font-semibold text-[#2B2B2B]">
                    {((data.ai_spend_mtd / data.total_spend_mtd) * 100).toFixed(1)}% of total
                  </span>
                ) : null}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[11px]">
              <span className="text-[#6F6F6F]">OpenAI & Claude</span>
              <Link
                href="/spend/ai"
                className="font-bold text-[#2B2B2B] hover:text-[#1A1A1A] hover:underline"
              >
                View AI Spend →
              </Link>
            </div>
          </MagicBentoCard>

          {/* Card 3: Attribution Coverage */}
          <MagicBentoCard colSpan={1} rowSpan={1} radius={20}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4D4D4D]">
                Attribution Coverage
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#2B2B2B]">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-[#1A1A1A] cirra-metric">
                  {coveragePercentFormatted}
                </div>
                <span className="text-xs text-[#5E5E5E]">
                  {coverageSub}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#F3F4F6] h-2 rounded-full overflow-hidden mt-2.5">
                <div
                  className="bg-[#2B2B2B] h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${data?.attributionCoverage?.percentage ? Math.min(100, data.attributionCoverage.percentage) : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[11px]">
              <span className="text-[#6F6F6F]">FOCUS Tag Policy</span>
              <Link
                href="/allocation"
                className="font-bold text-[#2B2B2B] hover:text-[#1A1A1A] hover:underline"
              >
                Allocation Rules →
              </Link>
            </div>
          </MagicBentoCard>

          {/* Card 4: Telemetry Sentinel & Anomaly Detection */}
          <MagicBentoCard colSpan={2} rowSpan={1} radius={20}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#2B2B2B]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4D4D4D]">
                    Telemetry Sentinel
                  </span>
                  <p className="text-xs text-[#6F6F6F]">Live anomaly detection & stream health</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#2B2B2B] border border-[#D1D5DB]">
                v1.4 Guard
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 my-1">
              <div className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <div className="text-[10px] text-[#5E5E5E]">Streams</div>
                <div className="text-sm font-bold text-[#1A1A1A] cirra-metric">{data?.active_connections ?? 0} active</div>
              </div>
              <div className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <div className="text-[10px] text-[#5E5E5E]">Anomalies</div>
                <div className="text-sm font-bold text-[#1A1A1A] cirra-metric">{data?.anomalies_detected ?? 0} alerts</div>
              </div>
              <div className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <div className="text-[10px] text-[#5E5E5E]">Savings</div>
                <div className="text-sm font-bold text-[#1A1A1A] cirra-metric">${data?.potential_savings_monthly ? formatNumber(data.potential_savings_monthly) : 0}/mo</div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between text-[11px]">
              <span className="text-[#6F6F6F]">Continuous cost monitoring</span>
              <Link
                href="/anomalies"
                className="font-bold text-[#2B2B2B] hover:text-[#1A1A1A] hover:underline"
              >
                Open Sentinel Alerts →
              </Link>
            </div>
          </MagicBentoCard>

          {/* Card 5: Integrations & Cloud Exporters Status */}
          <MagicBentoCard colSpan={2} rowSpan={1} radius={20}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#2B2B2B]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4D4D4D]">
                    Provider Data Streams
                  </span>
                  <p className="text-xs text-[#6F6F6F]">AWS CUR, GCP BigQuery, OpenAI, Anthropic</p>
                </div>
              </div>
              <Link
                href="/settings/connections"
                className="text-[11px] font-bold text-[#2B2B2B] hover:text-[#1A1A1A] hover:underline"
              >
                + Add Connection
              </Link>
            </div>

            <div className="flex items-center gap-2 flex-wrap my-1">
              {["AWS CUR", "GCP BigQuery", "OpenAI API", "Anthropic Claude"].map((item) => (
                <span
                  key={item}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F9FAFB] text-[#2B2B2B] border border-[#E5E7EB] flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#808080]" />
                  {item}
                </span>
              ))}
            </div>

            <div className="pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between text-[11px]">
              <span className="text-[#6F6F6F]">Encrypted OAuth & IAM Role connectors</span>
              <Link
                href="/settings/connections"
                className="font-bold text-[#2B2B2B] hover:text-[#1A1A1A] hover:underline"
              >
                Manage Streams →
              </Link>
            </div>
          </MagicBentoCard>

          {/* Card 6: Top Consuming Cloud Services */}
          <MagicBentoCard colSpan={2} rowSpan={2} radius={20}>
            <TopServicesTable
              data={data?.topServices ?? []}
              loading={isLoading}
              selectedProvider={selectedProvider}
              embedded={true}
            />
          </MagicBentoCard>

          {/* Card 7: Top AI Keys */}
          <MagicBentoCard colSpan={2} rowSpan={2} radius={20}>
            <TopAiKeysCard
              data={data?.topAiKeys ?? []}
              loading={isLoading}
              embedded={true}
            />
          </MagicBentoCard>
        </MagicBento>
      </main>
    </div>
  );
}
