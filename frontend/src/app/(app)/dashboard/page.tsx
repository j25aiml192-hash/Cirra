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
  Search,
  Bell,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { StatCard } from "@/components/ui/StatCard";
import { SpendBarChart } from "@/components/charts/SpendBarChart";
import { TopServicesTable } from "@/components/ui/TopServicesTable";
import { TopAiKeysCard } from "@/components/ui/TopAiKeysCard";
import type { Period } from "@/types";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [selectedProvider, setSelectedProvider] = useState<string>("All");
  const { data, isLoading } = useDashboard();

  const totalSpendFormatted = data ? `$${data.total_spend_mtd.toLocaleString()}` : "$0";
  const aiSpendFormatted = data ? `$${data.ai_spend_mtd.toLocaleString()}` : "$0";
  const projectedFormatted = data ? `$${(data.forecasted_spend / 1000).toFixed(0)}K` : "$0";
  const coveragePercentFormatted = data ? `${data.attributionCoverage.percentage}%` : "0%";
  const coverageSub = data
    ? `${data.attributionCoverage.resourcesCount} of ${data.attributionCoverage.totalResources} resources`
    : "";

  const providers = ["All", "AWS", "GCP", "OpenAI", "Anthropic"];

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* 0. Top Navigation Pill Bar (Directly mirroring the top header in reference design) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-1">
        {/* Navigation Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/80 border border-[#D6E4F5] shadow-xs backdrop-blur-md overflow-x-auto max-w-full">
          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-[#0062E0] text-white shadow-sm shadow-[#0062E0]/25"
          >
            Overview
          </Link>
          <Link
            href="/spend/cloud"
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#4A607A] hover:text-[#0A192F] hover:bg-[#F0F5FD] transition-all whitespace-nowrap"
          >
            Cloud Spend
          </Link>
          <Link
            href="/spend/ai"
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#4A607A] hover:text-[#0A192F] hover:bg-[#F0F5FD] transition-all whitespace-nowrap"
          >
            AI Models
          </Link>
          <Link
            href="/allocation"
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#4A607A] hover:text-[#0A192F] hover:bg-[#F0F5FD] transition-all whitespace-nowrap"
          >
            Attribution
          </Link>
          <Link
            href="/anomalies"
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#4A607A] hover:text-[#0A192F] hover:bg-[#F0F5FD] transition-all whitespace-nowrap"
          >
            Anomalies
          </Link>
          <Link
            href="/savings"
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#4A607A] hover:text-[#0A192F] hover:bg-[#F0F5FD] transition-all whitespace-nowrap"
          >
            Savings
          </Link>
        </div>

        {/* Right Search, Notification & User Avatar */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="relative hidden sm:block w-56 lg:w-64">
            <Search className="w-3.5 h-3.5 text-[#7E93AB] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search FOCUS resources..."
              className="w-full h-8 pl-8 pr-3 rounded-xl bg-white/90 border border-[#D6E4F5] text-xs text-[#0A192F] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0062E0]/20 focus:border-[#0062E0] transition-all shadow-xs"
            />
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="w-8 h-8 rounded-xl bg-white border border-[#D6E4F5] flex items-center justify-center relative hover:bg-[#F0F5FD] hover:border-[#BCD4F0] transition-all shadow-xs"
          >
            <Bell className="w-3.5 h-3.5 text-[#5A6E85]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0062E0] rounded-full ring-2 ring-white" />
          </button>

          <Link
            href="/settings/profile"
            className="h-8 pl-1.5 pr-2.5 rounded-xl bg-white border border-[#D6E4F5] flex items-center gap-2 text-xs font-semibold text-[#0A192F] hover:bg-[#F0F5FD] hover:border-[#BCD4F0] transition-all shadow-xs"
          >
            <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-[#0052C2] to-[#0070F3] flex items-center justify-center shadow-xs">
              <span className="text-white text-[10px] font-bold">HK</span>
            </div>
            <span className="font-bold">Hiten</span>
          </Link>
        </div>
      </div>

      {/* 1. Header Row & Telemetry Status (inspired by reference layout) */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A192F] tracking-tight">
                Welcome in, Hiten
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0D824D] bg-[#E6F8F0] px-2.5 py-0.5 rounded-full border border-[#B3ECCB]">
                <span className="w-1.5 h-1.5 bg-[#0D824D] rounded-full animate-pulse" />
                Live Feed
              </span>
            </div>
            <p className="text-xs text-[#5A6E85] font-medium mt-0.5">
              Multi-Cloud & AI Infrastructure Velocity · FOCUS 1.0 Normalized
            </p>
          </div>

          {/* Action controls */}
          <div className="flex flex-wrap items-center gap-3">
            <PeriodTabs value={period} onChange={setPeriod} />

            <button
              type="button"
              className="h-8 px-3.5 rounded-xl border border-[#D6E4F5] bg-white text-xs font-bold text-[#0A192F] hover:bg-[#F0F5FD] hover:border-[#BCD4F0] active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm shadow-[#0062E0]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]"
            >
              <Eye className="w-3.5 h-3.5 text-[#5A6E85]" />
              <span>Executive View</span>
            </button>
          </div>
        </div>

        {/* Quick telemetry chips bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/80 border border-[#D6E4F5] shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7E93AB] mr-1">
              TELEMETRY:
            </span>

            {/* Cloud */}
            <div className="inline-flex items-center gap-2 bg-[#F8FAFD] border border-[#D6E4F5] pl-2.5 pr-1.5 py-1 rounded-xl text-xs">
              <div className="flex items-center gap-1 text-[#5A6E85] font-semibold">
                <Cloud className="w-3.5 h-3.5 text-[#0062E0]" />
                <span>Cloud</span>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-[#EBF3FE] text-[#0062E0] font-bold border border-[#BCD9FC] text-[11px] cirra-metric">
                ${data ? Math.round(data.cloud_spend_mtd / 1000) : 85}K
              </span>
            </div>

            {/* AI Models */}
            <div className="inline-flex items-center gap-2 bg-[#F8FAFD] border border-[#D6E4F5] pl-2.5 pr-1.5 py-1 rounded-xl text-xs">
              <div className="flex items-center gap-1 text-[#5A6E85] font-semibold">
                <Cpu className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>AI Models</span>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-[#F5ECFE] text-[#7C3AED] font-bold border border-[#DDD6FE] text-[11px] cirra-metric">
                ${data ? Math.round(data.ai_spend_mtd / 1000) : 42}K
              </span>
            </div>

            {/* Attributed */}
            <div className="inline-flex items-center gap-2 bg-[#F8FAFD] border border-[#D6E4F5] pl-2.5 pr-1.5 py-1 rounded-xl text-xs">
              <div className="flex items-center gap-1 text-[#5A6E85] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0D824D]" />
                <span>Attributed</span>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-[#E6F8F0] text-[#0D824D] font-bold border border-[#B3ECCB] text-[11px] cirra-metric">
                {data?.attributionCoverage.percentage ?? 84.2}%
              </span>
            </div>

            {/* Anomalies */}
            <div className="inline-flex items-center gap-2 bg-[#F8FAFD] border border-[#D6E4F5] pl-2.5 pr-1.5 py-1 rounded-xl text-xs">
              <div className="flex items-center gap-1 text-[#5A6E85] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Anomalies</span>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-[#FFF4E5] text-[#B45309] font-bold border border-[#FDE68A] text-[11px] cirra-metric">
                {data?.anomalies_detected ?? 0} active
              </span>
            </div>
          </div>

          {/* Provider Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#F0F5FD] p-1 rounded-xl border border-[#D6E4F5]">
            <Filter className="w-3 h-3 text-[#7E93AB] ml-1.5 mr-0.5" />
            {providers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedProvider(p)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedProvider === p
                    ? "bg-white text-[#0062E0] shadow-sm border border-[#BCD9FC]"
                    : "text-[#5A6E85] hover:text-[#0A192F]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Four KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
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

      {/* 3. Main Visual Anchor: Spending Chart with Top Services side panel (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Chart (7 cols on large desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 cirra-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-[#EBF2FA]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#0A192F] text-base tracking-tight">
                    Monthly Multi-Provider Spend Trajectory
                  </h3>
                  <span className="text-[10px] font-bold text-[#0062E0] bg-[#EBF3FE] px-2 py-0.5 rounded-full border border-[#BCD9FC]">
                    Anchor
                  </span>
                </div>
                <p className="text-xs text-[#5A6E85] mt-0.5">
                  Historical FOCUS normalized billed expense across AWS, GCP, OpenAI, Anthropic
                </p>
              </div>

              <span className="text-[11px] font-bold text-[#4A607A] bg-[#F0F5FD] border border-[#D6E4F5] px-2.5 py-1 rounded-xl w-fit">
                6 Months Trend
              </span>
            </div>

            <SpendBarChart
              data={data?.monthly ?? []}
              loading={isLoading}
              selectedProvider={selectedProvider}
            />
          </div>
        </div>

        {/* Top Consuming Cloud Services (5 cols on large desktop) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <TopServicesTable
            data={data?.topServices ?? []}
            loading={isLoading}
            selectedProvider={selectedProvider}
          />
        </div>
      </div>

      {/* 4. Top AI Keys Section */}
      <div>
        <TopAiKeysCard data={data?.topAiKeys ?? []} loading={isLoading} />
      </div>
    </main>
  );
}
