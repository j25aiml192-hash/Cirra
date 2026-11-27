"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Eye,
  Filter,
  Loader2,
  CheckCircle2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Search,
  Grid,
  List,
  Plus,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Bell,
  GitCommit,
  GitBranch,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Copy,
  Check,
  Clock,
  Radio,
  Server,
  Cloud,
  Cpu,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { useDashboard } from "@/hooks/useDashboard";
import { useConnections } from "@/hooks/useConnections";
import { useAnomalies } from "@/hooks/useAnomalies";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { SpendBarChart } from "@/components/charts/SpendBarChart";
import { SpendCandlestickChart } from "@/components/charts/SpendCandlestickChart";
import { TopServicesTable } from "@/components/ui/TopServicesTable";
import { TopAiKeysCard } from "@/components/ui/TopAiKeysCard";
import {
  ChalkCloudIcon,
  ChalkAiChipIcon,
  ChalkShieldIcon,
  ChalkAnomalyIcon,
  ChalkFlameIcon,
  ChalkKeyIcon,
  ChalkProcessIcon,
  ChalkTrendIcon,
} from "@/components/ui/chalk-icons";
import { formatNumber, cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { ProviderLogo } from "@/components/ui/provider-logos";
import { ThinkingPill } from "@/components/ui/thinking-pill";
import { ChromePillButton } from "@/components/ui/ChromePillButton";
import { MagicBento, MagicBentoCard } from "@/components/ui/MagicBento";
import { CirraGlassCard } from "@/components/ui/CirraGlassCard";
import { SemiCircleDotGauge } from "@/components/ui/SemiCircleDotGauge";
import type { Period } from "@/types";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "simulator">("overview");
  const [selectedProvider, setSelectedProvider] = useState<string>("All");
  const [executiveView, setExecutiveView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [copiedPill, setCopiedPill] = useState(false);
  const [chartView, setChartView] = useState<"candles" | "bars">("candles");

  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useDashboard(period);
  const { data: connectionsData } = useConnections();
  const { data: anomaliesData } = useAnomalies("open");

  // Keyboard shortcut listener for '/' to focus search, just like Vercel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Derive provider-filtered spend amounts when a specific provider chip is clicked
  const getProviderSpend = () => {
    if (!data) return { total: 0, label: "TOTAL MULTI-CLOUD SPEND" };
    if (selectedProvider === "AWS") return { total: data.cloud_spend_mtd, label: "AWS INFRASTRUCTURE SPEND" };
    if (selectedProvider === "GCP") return { total: Math.round(data.cloud_spend_mtd * 0.23), label: "GCP CLOUD SPEND" };
    if (selectedProvider === "OpenAI") return { total: Math.round(data.ai_spend_mtd * 0.62), label: "OPENAI INFERENCE SPEND" };
    if (selectedProvider === "Anthropic") return { total: Math.round(data.ai_spend_mtd * 0.38), label: "ANTHROPIC RUN-RATE" };
    return { total: data.total_spend_mtd, label: "TOTAL MULTI-CLOUD SPEND" };
  };

  const { total: currentTotalSpend } = getProviderSpend();

  const totalSpendFormatted = `$${formatNumber(currentTotalSpend)}`;
  const cloudSpendFormatted = data ? `$${formatNumber(data.cloud_spend_mtd)}` : "$0";
  const aiSpendFormatted = data ? `$${formatNumber(data.ai_spend_mtd)}` : "$0";
  const projectedFormatted = data ? `$${formatNumber(data.forecasted_spend / 1000)}K` : "$0";
  const coveragePercentFormatted = data ? `${data.attributionCoverage.percentage}%` : "0%";
  const coverageSub = data
    ? `${data.attributionCoverage.resourcesCount} of ${data.attributionCoverage.totalResources} tagged`
    : "0 of 0 tagged";

  const dailySpendTotal = data?.total_spend_mtd ? Math.round(data.total_spend_mtd / 30) : 2847;
  const dailyCloudSpend = data?.cloud_spend_mtd ? Math.round(data.cloud_spend_mtd / 30) : 1902;
  const dailyAiSpend = data?.ai_spend_mtd ? Math.round(data.ai_spend_mtd / 30) : 945;
  const cloudRatio = data?.total_spend_mtd && data.total_spend_mtd > 0
    ? ((data.cloud_spend_mtd / data.total_spend_mtd) * 100).toFixed(1)
    : "66.8";
  const aiRatio = data?.total_spend_mtd && data.total_spend_mtd > 0
    ? ((data.ai_spend_mtd / data.total_spend_mtd) * 100).toFixed(1)
    : "33.2";

  const providers = ["All", "AWS", "GCP", "OpenAI", "Anthropic"];

  const hasNoData = !data || (data.total_spend_mtd === 0 && (data.monthly?.length ?? 0) === 0);

  // Dynamic Workloads / Projects calculation (Vercel-style cards)
  const workloads = useMemo(() => {
    const defaultWorkloads = [
      {
        id: "wl-aws-prod",
        name: "aws-production-cluster",
        provider: "AWS",
        domain: "us-east-1 • 14 active services",
        url: "/spend/cloud",
        status: "healthy",
        spend: `$${formatNumber(data?.cloud_spend_mtd ? Math.round(data.cloud_spend_mtd * 0.77) : 65450)} MTD`,
        commitMsg: "EC2 Spot + Graviton4 auto-scaler active",
        branch: "production-main",
        syncedAt: "2m ago",
        icon: Cloud,
      },
      {
        id: "wl-openai-prod",
        name: "openai-platform-prod",
        provider: "OpenAI",
        domain: "api.openai.com/v1 • Tier 5",
        url: "/spend/ai",
        status: "healthy",
        spend: `$${formatNumber(data?.ai_spend_mtd ? Math.round(data.ai_spend_mtd * 0.62) : 26190)} MTD`,
        commitMsg: "GPT-4o & Text-Embedding-3 inference pool",
        branch: "ai-inference-prod",
        syncedAt: "1m ago",
        icon: Cpu,
      },
      {
        id: "wl-gcp-prod",
        name: "gcp-data-pipeline",
        provider: "GCP",
        domain: "europe-west1 • BigQuery Export",
        url: "/spend/cloud",
        status: "healthy",
        spend: `$${formatNumber(data?.cloud_spend_mtd ? Math.round(data.cloud_spend_mtd * 0.23) : 19790)} MTD`,
        commitMsg: "Continuous query optimization active",
        branch: "analytics-v2",
        syncedAt: "5m ago",
        icon: Server,
      },
      {
        id: "wl-anthropic-prod",
        name: "anthropic-inference-pool",
        provider: "Anthropic",
        domain: "api.anthropic.com • Batch API v1",
        url: "/spend/ai",
        status: "healthy",
        spend: `$${formatNumber(data?.ai_spend_mtd ? Math.round(data.ai_spend_mtd * 0.38) : 16110)} MTD`,
        commitMsg: "Claude 3.5 Sonnet agentic pipeline",
        branch: "agents-cluster",
        syncedAt: "3m ago",
        icon: Sparkles,
      },
    ];

    if (connectionsData && connectionsData.length > 0) {
      const dynamicFromConns = connectionsData.map((c) => ({
        id: c.id,
        name: (c.name || `${c.provider}-connection`).toLowerCase().replace(/\s+/g, "-"),
        provider: c.provider.toUpperCase(),
        domain: `${c.provider.toLowerCase()} • Scoped Key`,
        url: "/settings",
        status: c.status === "connected" ? "healthy" : "warning",
        spend: c.credentials?.monthly_spend_cap ? `$${formatNumber(c.credentials.monthly_spend_cap)}/mo cap` : "Active Telemetry",
        commitMsg: `Ingested FOCUS 1.0 telemetry stream`,
        branch: "main",
        syncedAt: c.last_synced_at ?? "Recent",
        icon: c.provider.toLowerCase().includes("ai") || c.provider.toLowerCase().includes("openai") ? Cpu : Cloud,
      }));
      return dynamicFromConns;
    }

    return defaultWorkloads;
  }, [data, connectionsData]);

  // Filter workloads by search and provider
  const filteredWorkloads = useMemo(() => {
    return workloads.filter((w) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.commitMsg.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.provider.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProvider =
        selectedProvider === "All" ||
        w.provider.toLowerCase() === selectedProvider.toLowerCase();

      return matchesSearch && matchesProvider;
    });
  }, [workloads, searchQuery, selectedProvider]);

  const handleCopyTelemetry = () => {
    navigator.clipboard?.writeText("FOCUS 1.0 Normalized • Multi-Cloud & AI FinOps Platform");
    setCopiedPill(true);
    setTimeout(() => setCopiedPill(false), 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
        {/* Hero Headline */}
        <div className="space-y-1.5 pt-1 pb-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Turn Cloud Complexity into Clarity.
          </h1>
          <p className="text-sm sm:text-[15px] text-zinc-400 font-sans max-w-3xl leading-relaxed">
            Monitor every cloud resource, uncover hidden costs, and optimize your AI infrastructure — all from one intelligent platform.
          </p>
        </div>

        {/* VERCEL-STYLE TOP SCOPE & TABS ROW FOR DASHBOARD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1 text-xs font-mono font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === "overview"
                    ? "text-white font-bold border-b-2 border-emerald-500"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("analytics")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === "analytics"
                    ? "text-white font-bold border-b-2 border-emerald-500"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Spend Analytics
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("simulator")}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === "simulator"
                    ? "text-white font-bold border-b-2 border-emerald-500"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>Incident Simulator</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/settings/connections"
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-mono font-medium transition-all flex items-center gap-1.5 hover:border-emerald-500/40"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Connect Provider</span>
            </Link>
            <Link
              href="/ask"
              className="inline-flex items-center transition-transform hover:scale-105 active:scale-95"
              title="Ask Cirra AI Assistant"
            >
              <ThinkingPill
                label="✨ Ask Cirra"
                dots={false}
                width={128}
                height={34}
                fontSize={12}
                fontWeight={700}
                speed={1.4}
                colors={["#064e3b", "#065f46", "#047857", "#059669", "#10b981", "#34d399", "#064e3b"]}
                className="cursor-pointer shadow-[0_0_18px_rgba(5,150,105,0.4)]"
              />
            </Link>
          </div>
        </div>

        {/* VERCEL-STYLE SUB-HEADER TOOLBAR: SEARCH + SHORTCUT [/] + FILTER + VIEW TOGGLE (Hidden on Incident Simulator) */}
        {activeTab !== "simulator" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
            {/* Search Input with [/] Badge */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Projects..."
                className="w-full h-9 pl-9 pr-10 text-xs font-mono bg-[#09090b] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 bg-zinc-800/80 border border-zinc-700/80 rounded pointer-events-none">
                /
              </kbd>
            </div>

            {/* Right Controls: Filters */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              {/* Sliders / Filter icon button */}
              <div className="flex items-center gap-1 bg-[#09090b] p-1 rounded-lg border border-zinc-800 text-xs font-mono">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 mx-1" />
                {providers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedProvider(p)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                      selectedProvider === p
                        ? "bg-zinc-800 text-white font-bold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

          {/* Executive View Highlight Banner */}
          {executiveView && (
            <div className="p-4 rounded-xl bg-[#09090b] text-zinc-100 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200 font-mono">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-200 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                  EXECUTIVE SPEND HEALTH: NOMINAL [99.8%]
                </div>
                <p className="text-xs text-zinc-400 font-sans">
                  Multi-cloud variance is within 4.2%. Identified optimization pipeline of ${formatNumber(data?.potential_savings_monthly ?? 34200)}/mo offsets 81% of recent LLM growth.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <Link
                  href="/savings"
                  className="px-4 py-1.5 rounded-full bg-zinc-100 hover:bg-white text-black font-mono font-bold text-xs transition-colors shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                >
                  REVIEW_SAVINGS →
                </Link>
                <Link
                  href="/anomalies"
                  className="px-4 py-1.5 rounded-full bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-700 font-mono font-bold text-xs transition-colors"
                >
                  ANOMALY_LOGS
                </Link>
              </div>
            </div>
          )}

          {/* SETUP CALLOUT BANNER WHEN NO CONNECTIONS */}
          {hasNoData && !isLoading && (
            <div className="rounded-xl p-4 sm:p-5 bg-[#09090b] border border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-mono animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 flex-shrink-0 mt-0.5">
                  <ChalkCloudIcon size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">
                    No active cloud or AI provider connections
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5 max-w-xl">
                    Connect AWS (CUR), GCP (BigQuery billing export), Azure, OpenAI, or Anthropic in Settings to stream live FOCUS telemetry.
                  </p>
                </div>
              </div>
              <Link
                href="/settings/connections"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-zinc-100 text-black text-xs font-mono font-bold hover:bg-white transition-colors flex-shrink-0 shadow-[0_0_12px_rgba(255,255,255,0.2)]"
              >
                <span>CONNECT_PROVIDERS →</span>
              </Link>
            </div>
          )}

          {/* TAB 1: OVERVIEW (MATCHING REFERENCE VERCEL 2-COLUMN DASHBOARD) */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: USAGE & ALERTS (Dimensions and exact configuration from Reference Image 2) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Section Header */}
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-sm font-sans tracking-tight">Usage</h3>

                  {/* 1. USAGE CARD: 3D Cirra GlassCard */}
                  <CirraGlassCard
                    cloudSpendFormatted={cloudSpendFormatted}
                    cloudSpendBudget="$150K"
                    aiSpendFormatted={aiSpendFormatted}
                    aiSpendBudget="$50K"
                    coveragePercentFormatted={coveragePercentFormatted}
                    projectedFormatted={projectedFormatted}
                    potentialSavingsFormatted={`+$${formatNumber(data?.potential_savings_monthly ?? 34200)}/mo`}
                  />
                </div>

                {/* Section 2: Telemetry Statistics & Semi-Circular Dot Arc Gauge (Replica of Reference Arc Graph) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm font-sans tracking-tight">Spend Statistics</h3>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800/90 select-none">
                    <SemiCircleDotGauge
                      totalLabel="TOTAL"
                      totalValue={`$${formatNumber(dailySpendTotal)}`}
                      subValue="/day"
                      outerMetric={{
                        label: "Cloud Infrastructure",
                        amount: `$${formatNumber(dailyCloudSpend)}`,
                        change: "+15.2%",
                        percentage: `${cloudRatio}%`,
                        color: "#3b82f6",
                        accentBarColor: "bg-blue-500",
                      }}
                      innerMetric={{
                        label: "AI Foundation Models",
                        amount: `$${formatNumber(dailyAiSpend)}`,
                        change: "+8.7%",
                        percentage: `${aiRatio}%`,
                        color: "#10b981",
                        accentBarColor: "bg-emerald-500",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: PROJECTS / WORKLOADS (Exact match to Reference Image 2 List Architecture) */}
              <div className="lg:col-span-8 space-y-4">
                {/* Header: Projects */}
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white font-sans tracking-tight">Projects</h2>
                  <Link
                    href="/settings/connections"
                    className="text-xs font-mono text-zinc-400 hover:text-white"
                  >
                    Manage Connections →
                  </Link>
                </div>

                {/* High-density 1px Divider List of Workloads (Matching Reference Image 2) */}
                <div className="rounded-2xl border border-zinc-800/90 bg-[#09090b] divide-y divide-zinc-800/80 overflow-hidden font-sans">
                  {filteredWorkloads.map((wl) => (
                    <Link
                      key={wl.id}
                      href={wl.url}
                      className="p-4 sm:p-4.5 hover:bg-zinc-900/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      {/* Left: Provider Brand Avatar + Name + URL */}
                      <div className="flex items-center gap-3.5 min-w-0 md:w-56 lg:w-64">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <ProviderLogo
                            provider={wl.provider}
                            name={wl.name}
                            size={22}
                            className="shrink-0"
                          />
                        </div>
                        <div className="space-y-0.5 truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold text-white text-sm group-hover:text-zinc-200 transition-colors truncate">
                              {wl.name}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 truncate font-mono">
                            {wl.domain}
                          </p>
                        </div>
                      </div>

                      {/* Center: Git commit / Telemetry event link */}
                      <div className="flex-1 min-w-0 space-y-0.5 font-mono text-xs">
                        <div className="flex items-center gap-2 text-zinc-300 truncate">
                          <span className="text-zinc-500 shrink-0">⚯</span>
                          <span className="truncate">{wl.commitMsg}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500 text-[11px] truncate">
                          <GitBranch className="w-3 h-3 text-zinc-600 shrink-0" />
                          <span className="truncate">{wl.branch} · 8h ago</span>
                        </div>
                      </div>

                      {/* Right: Double Checkmark Ring + Status / Spend */}
                      <div className="flex items-center gap-4 shrink-0 font-mono">
                        <div className="text-right hidden sm:block">
                          <span className="text-xs font-bold text-white block">{wl.spend}</span>
                          <span className="text-[10px] text-zinc-500 uppercase">active stream</span>
                        </div>

                        {/* Reference Double-Checkmark Status Circle */}
                        <div className="w-8 h-8 rounded-full bg-zinc-900/90 border border-zinc-700/80 flex items-center justify-center text-zinc-300 group-hover:border-emerald-500 group-hover:text-emerald-400 transition-colors">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Embedded Top AI Keys Intelligence */}
                <div className="rounded-2xl border border-zinc-800/90 bg-[#09090b] overflow-hidden mt-6">
                  <TopAiKeysCard data={data?.topAiKeys ?? []} loading={isLoading} embedded />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPEND ANALYTICS (Trajectory Matrix + Consuming Services) */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Spend Candlestick / Bar Chart Matrix */}
              <div className="p-6 rounded-2xl bg-[#09090b] border border-zinc-800 hover:border-zinc-700 transition-colors font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#FFFFFF] text-base font-mono">
                        Monthly Spend Trajectory Matrix
                      </h3>
                      <span className="text-[10px] font-bold text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        FOCUS 1.0
                      </span>
                    </div>
                    <p className="text-xs text-[#C7C1B0] font-sans mt-0.5">
                      Historical normalized expense across AWS, GCP, OpenAI, Anthropic
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* View Switcher: Candlestick (Image 1) vs Bars (Image 2) */}
                    <div className="inline-flex items-center p-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setChartView("candles")}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5",
                          chartView === "candles"
                            ? "bg-zinc-100 hover:bg-white text-black font-bold shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        )}
                        title="Candlestick OHLC Volatility Chart"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M4 1v2H2.5v7H4v5h1v-5h1.5V3H5V1H4zm7 3v3H9.5v6H11v3h1v-3h1.5V7H12V4h-1z" />
                        </svg>
                        <span>Candles</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartView("bars")}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5",
                          chartView === "bars"
                            ? "bg-zinc-100 hover:bg-white text-black font-bold shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        )}
                        title="Stacked Multi-Cloud Bar Matrix"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M2 11h2v4H2v-4zm5-6h2v10H7V5zm5-4h2v14h-2V1z" />
                        </svg>
                        <span>Bars</span>
                      </button>
                    </div>

                    <PeriodTabs value={period} onChange={setPeriod} />
                  </div>
                </div>

                {chartView === "candles" ? (
                  <SpendCandlestickChart
                    data={data?.monthly ?? []}
                    loading={isLoading}
                    selectedProvider={selectedProvider}
                    period={period}
                  />
                ) : (
                  <SpendBarChart
                    data={data?.monthly ?? []}
                    loading={isLoading}
                    selectedProvider={selectedProvider}
                  />
                )}
              </div>

              {/* Top Consuming Services Table */}
              <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden">
                <TopServicesTable
                  data={data?.topServices ?? []}
                  loading={isLoading}
                  selectedProvider={selectedProvider}
                />
              </div>
            </div>
          )}

          {/* TAB 3: INCIDENT SIMULATOR (Live Scenario Simulator Engine) */}
          {activeTab === "simulator" && (
            <div className="space-y-6">
              <LiveScenarioPanel />

              {/* Telemetry Sentinel & Active Provider Feeds */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 font-mono">
                  <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <ChalkAnomalyIcon size={24} />
                      <h4 className="text-sm font-bold text-white">Telemetry Sentinel</h4>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 my-3 text-center">
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <div className="text-[10px] text-zinc-400">Streams</div>
                      <div className="text-base font-bold text-white mt-0.5">{data?.active_connections ?? 2}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <div className="text-[10px] text-zinc-400">Open Alerts</div>
                      <div className="text-base font-bold text-white mt-0.5">{data?.anomalies_detected ?? 0}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <div className="text-[10px] text-zinc-400">Pipeline Savings</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        ${formatNumber(data?.potential_savings_monthly ?? 34200)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 font-mono">
                  <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <ChalkCloudIcon size={24} />
                      <h4 className="text-sm font-bold text-white">Ingested Feeds</h4>
                    </div>
                    <Link href="/settings/connections" className="text-xs text-zinc-400 hover:text-white underline">
                      Manage →
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 my-3">
                    {[
                      { name: "AWS CUR", provider: "AWS", active: true },
                      { name: "GCP BigQuery", provider: "GCP", active: true },
                      { name: "OpenAI API", provider: "OpenAI", active: true },
                      { name: "Anthropic Claude", provider: "Anthropic", active: true },
                      { name: "Azure Telemetry", provider: "Azure", active: false },
                    ].map((s) => (
                      <span
                        key={s.name}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900/90 text-[#FFFFFF] border border-zinc-800/90 hover:border-zinc-700 transition-all flex items-center gap-2 shadow-sm"
                      >
                        <div className="w-5 h-5 rounded-md bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center shrink-0 p-0.5">
                          <ProviderLogo provider={s.provider} size={14} />
                        </div>
                        <span className="font-semibold text-xs tracking-tight">{s.name}</span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ml-1 ${
                            s.active ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                          }`}
                        />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
    </div>
  );
}

interface DemoScenarioAnomaly {
  id?: string;
  keyId: string;
  name: string;
  scenario: "leaked-key" | "runaway-process" | "bill-spike";
  provider: string;
  severity: "Catastrophic" | "Critical" | "High";
  status: "DETECTING..." | "DETECTED";
  channels: string[];
  prUrl?: string | null;
  detectedAt?: string;
}

function LiveScenarioPanel() {
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [successScenario, setSuccessScenario] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [pendingScenarios, setPendingScenarios] = useState<Record<string, number>>({});
  const [detectedItems, setDetectedItems] = useState<DemoScenarioAnomaly[]>([]);

  const pollData = useCallback(async () => {
    try {
      let anomData: any[] = [];
      try {
        anomData = await apiFetch<any[]>("/api/v1/anomalies?limit=50");
      } catch {
        try {
          const token = typeof window !== "undefined" ? localStorage.getItem("cirra_token") || localStorage.getItem("token") : null;
          const res = await fetch("/api/v1/anomalies?limit=50", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) anomData = await res.json();
        } catch {}
      }
      if (!Array.isArray(anomData)) anomData = [];

      let actionsData: any[] = [];
      try {
        actionsData = await apiFetch<any[]>("/api/v1/actions?tenant_id=00000000-0000-0000-0000-000000000001");
      } catch {
        try {
          const token = typeof window !== "undefined" ? localStorage.getItem("cirra_token") || localStorage.getItem("token") : null;
          const res = await fetch("/api/v1/actions?tenant_id=00000000-0000-0000-0000-000000000001", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) actionsData = await res.json();
        } catch {}
      }
      if (!Array.isArray(actionsData)) actionsData = [];

      const prUrlByAnomalyId: Record<string, string> = {};
      const prUrlByKeyId: Record<string, string> = {};
      if (Array.isArray(actionsData)) {
        for (const act of actionsData) {
          if (act.github_pr_url) {
            if (act.anomaly_id) prUrlByAnomalyId[act.anomaly_id] = act.github_pr_url;
            if (act.target_key_id) prUrlByKeyId[act.target_key_id] = act.github_pr_url;
          }
        }
      }

      const items: DemoScenarioAnomaly[] = [];
      const detectedKeyIds = new Set<string>();

      if (Array.isArray(anomData)) {
        for (const a of anomData) {
          const isLeaked =
            a.api_key_id === "demo_leaked_key_exposed_001" ||
            a.series_key?.includes("demo_leaked_key_exposed_001");
          const isRunaway =
            a.api_key_id === "demo_key_sk_prod_001" ||
            a.series_key?.includes("demo_key_sk_prod_001");
          const isVercel =
            a.api_key_id === "demo_vercel_key_001" ||
            a.series_key?.includes("demo_vercel_key_001") ||
            a.provider === "vercel";

          if (isLeaked || isRunaway || isVercel) {
            const keyId = isLeaked
              ? "demo_leaked_key_exposed_001"
              : isRunaway
              ? "demo_key_sk_prod_001"
              : "demo_vercel_key_001";

            if (detectedKeyIds.has(keyId)) continue;
            detectedKeyIds.add(keyId);

            const pr = prUrlByAnomalyId[a.id] || prUrlByKeyId[keyId] || null;

            if (isLeaked) {
              items.push({
                id: a.id,
                keyId,
                name: "API Key Leaked (Dormant Key)",
                scenario: "leaked-key",
                provider: "openai",
                severity: "Catastrophic",
                status: "DETECTED",
                channels: ["Slack", "ntfy", "GitHub PR", "Voice Call", "Kill Switch"],
                prUrl: pr,
                detectedAt: a.detected_at || a.created_at,
              });
            } else if (isRunaway) {
              items.push({
                id: a.id,
                keyId,
                name: "Runaway Process (341% Spend Spike)",
                scenario: "runaway-process",
                provider: "openai",
                severity: "Critical",
                status: "DETECTED",
                channels: ["Slack", "GitHub PR", "Voice Call"],
                prUrl: pr,
                detectedAt: a.detected_at || a.created_at,
              });
            } else if (isVercel) {
              items.push({
                id: a.id,
                keyId,
                name: "Vercel Bill Surge (2x Overnight)",
                scenario: "bill-spike",
                provider: "vercel",
                severity: "High",
                status: "DETECTED",
                channels: ["Slack", "ntfy", "GitHub PR"],
                prUrl: pr,
                detectedAt: a.detected_at || a.created_at,
              });
            }
          }
        }
      }

      // Check for pending scenarios
      const now = Date.now();
      for (const [scen, ts] of Object.entries(pendingScenarios)) {
        if (now - ts > 90000) continue;
        if (scen === "leaked-key" && !detectedKeyIds.has("demo_leaked_key_exposed_001")) {
          items.unshift({
            keyId: "demo_leaked_key_exposed_001",
            name: "API Key Leaked (Dormant Key)",
            scenario: "leaked-key",
            provider: "openai",
            severity: "Catastrophic",
            status: "DETECTING...",
            channels: ["Slack", "ntfy", "GitHub PR", "Voice Call", "Kill Switch"],
            detectedAt: new Date(ts).toISOString(),
          });
        } else if (scen === "runaway-process" && !detectedKeyIds.has("demo_key_sk_prod_001")) {
          items.unshift({
            keyId: "demo_key_sk_prod_001",
            name: "Runaway Process (341% Spend Spike)",
            scenario: "runaway-process",
            provider: "openai",
            severity: "Critical",
            status: "DETECTING...",
            channels: ["Slack", "GitHub PR", "Voice Call"],
            detectedAt: new Date(ts).toISOString(),
          });
        } else if (scen === "bill-spike" && !detectedKeyIds.has("demo_vercel_key_001")) {
          items.unshift({
            keyId: "demo_vercel_key_001",
            name: "Vercel Bill Surge (2x Overnight)",
            scenario: "bill-spike",
            provider: "vercel",
            severity: "High",
            status: "DETECTING...",
            channels: ["Slack", "ntfy", "GitHub PR"],
            detectedAt: new Date(ts).toISOString(),
          });
        }
      }

      setDetectedItems(items);
    } catch (e) {
      console.error("Poll data error:", e);
    }
  }, [pendingScenarios]);

  useEffect(() => {
    pollData();
    const interval = setInterval(pollData, 5000);
    return () => clearInterval(interval);
  }, [pollData]);

  const handleInject = async (scenario: "leaked-key" | "runaway-process" | "bill-spike") => {
    setLoadingScenario(scenario);
    setSuccessScenario(null);
    setPendingScenarios((prev) => ({ ...prev, [scenario]: Date.now() }));

    try {
      const res = await fetch(`/api/v1/inject/${scenario}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res && res.ok) {
        setSuccessScenario(scenario);
        setTimeout(() => {
          setSuccessScenario((curr) => (curr === scenario ? null : curr));
        }, 5000);
      }
    } catch (e) {
      console.error(`Failed to inject scenario ${scenario}:`, e);
    } finally {
      setLoadingScenario(null);
      setTimeout(pollData, 1200);
    }
  };

  const handleReset = async () => {
    setIsCleaning(true);
    try {
      await fetch(`/api/v1/inject/cleanup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      setPendingScenarios({});
      setSuccessScenario(null);
    } catch (e) {
      console.error("Cleanup error:", e);
    } finally {
      setIsCleaning(false);
      setTimeout(pollData, 600);
    }
  };

  return (
    <div id="live-scenario-engine" className="p-[21px] border border-zinc-800/80 bg-[#09090b] rounded-2xl space-y-5 scroll-mt-6 font-mono text-white">
      {/* Header with Runway Editorial Monochromatic Aesthetic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ChalkFlameIcon size={32} className="flex-shrink-0 text-white" />
            <h2 className="text-[18px] font-bold text-white tracking-tight font-mono">
              Live Incident Simulator
            </h2>
          </div>
          <p className="text-[13px] text-zinc-400 font-sans mt-1">
            Simulate real infrastructure incidents by injecting synthetic anomalies directly into ClickHouse.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={isCleaning}
          className="self-start sm:self-center px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
          title="Clean up injected demo data"
        >
          <ChalkProcessIcon size={16} className={isCleaning ? "animate-spin" : ""} />
          <span>{isCleaning ? "RESETTING..." : "RESET ALL"}</span>
        </button>
      </div>

      {/* 3 Scenario Action Cards in Runway Dark Theme */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[13px]">
        {/* Scenario 1: Leaked Key */}
        <div className="border border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/80 hover:bg-zinc-900/60 rounded-xl p-[13px] sm:p-4 flex flex-col justify-between transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-white flex items-center gap-2">
                <ChalkKeyIcon size={22} className="flex-shrink-0 text-zinc-300" />
                <span>Inject Leaked Key</span>
              </span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-black">
                CATASTROPHIC
              </span>
            </div>
            <p className="text-[12px] text-zinc-400 font-sans">
              847 requests • All channels fire
            </p>
          </div>

          <div className="mt-4">
            <ChromePillButton
              label="INJECT LEAKED KEY"
              loading={loadingScenario === "leaked-key"}
              success={successScenario === "leaked-key"}
              onClick={() => handleInject("leaked-key")}
              disabled={loadingScenario !== null}
            />
          </div>
        </div>

        {/* Scenario 2: Runaway Process */}
        <div className="border border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/80 hover:bg-zinc-900/60 rounded-xl p-[13px] sm:p-4 flex flex-col justify-between transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-white flex items-center gap-2">
                <ChalkProcessIcon size={22} className="flex-shrink-0 text-zinc-300" />
                <span>Runaway Process</span>
              </span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-200">
                CRITICAL
              </span>
            </div>
            <p className="text-[12px] text-zinc-400 font-sans">
              GPT-4o • 341% spike • Voice call
            </p>
          </div>

          <div className="mt-4">
            <ChromePillButton
              label="INJECT RUNAWAY"
              loading={loadingScenario === "runaway-process"}
              success={successScenario === "runaway-process"}
              onClick={() => handleInject("runaway-process")}
              disabled={loadingScenario !== null}
            />
          </div>
        </div>

        {/* Scenario 3: Bill Spike */}
        <div className="border border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/80 hover:bg-zinc-900/60 rounded-xl p-[13px] sm:p-4 flex flex-col justify-between transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-white flex items-center gap-2">
                <ChalkTrendIcon size={22} className="flex-shrink-0 text-zinc-300" />
                <span>Bill Surge</span>
              </span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                HIGH
              </span>
            </div>
            <p className="text-[12px] text-zinc-400 font-sans">
              Vercel • 2x overnight • Slack + PR
            </p>
          </div>

          <div className="mt-4">
            <ChromePillButton
              label="INJECT BILL SURGE"
              loading={loadingScenario === "bill-spike"}
              success={successScenario === "bill-spike"}
              onClick={() => handleInject("bill-spike")}
              disabled={loadingScenario !== null}
            />
          </div>
        </div>
      </div>

      {/* Live Detection Feed in Runway Dark Theme */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/90 p-4 space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              LIVE DETECTION FEED
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            POLL: 5s
          </span>
        </div>

        {detectedItems.length === 0 ? (
          <div className="py-6 text-center text-[13px] text-zinc-400 font-sans">
            No active simulated incidents. Trigger a scenario above to test Sentinel detection.
          </div>
        ) : (
          <div className="space-y-2">
            {detectedItems.map((item, idx) => (
              <div
                key={item.id || item.keyId + idx}
                className="bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-white text-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-black" />
                      {item.status}
                    </span>

                    {/* Severity Badge */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-zinc-800 text-zinc-200 border border-zinc-700">
                      {item.severity}
                    </span>

                    <span className="text-[13px] font-bold text-white font-sans">
                      {item.name}
                    </span>

                    <span className="text-[10px] text-zinc-400 font-mono">
                      ({item.keyId})
                    </span>
                  </div>

                  {/* Channels */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] text-zinc-400 font-sans mr-1">
                      Channels fired:
                    </span>
                    {item.channels.map((ch) => (
                      <span
                        key={ch}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800/90 text-zinc-300 border border-zinc-700/80"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:self-center">
                  {item.prUrl && (
                    <a
                      href={item.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold text-black bg-white hover:bg-zinc-200 px-2.5 py-1 rounded-full transition-colors"
                      title="Inspect GitHub PR"
                    >
                      <span>VIEW_PR</span>
                      <ExternalLink className="w-3 h-3 text-black" />
                    </a>
                  )}

                  <span className="text-[11px] text-zinc-400 font-mono whitespace-nowrap">
                    {formatRelativeTime(item.detectedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "just now";
  try {
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000));
    if (diffSec < 10) return "just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
  } catch {
    return "just now";
  }
}

