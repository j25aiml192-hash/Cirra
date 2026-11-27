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
import { MagicBento, MagicBentoCard } from "@/components/ui/MagicBento";
import type { Period } from "@/types";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "simulator">("overview");
  const [selectedProvider, setSelectedProvider] = useState<string>("All");
  const [executiveView, setExecutiveView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [usageExpanded, setUsageExpanded] = useState(true);
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

        {/* VERCEL-STYLE SUB-HEADER TOOLBAR: SEARCH + SHORTCUT [/] + FILTER + VIEW TOGGLE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input with [/] Badge */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services, models, clusters, or workloads..."
                className="w-full h-9 pl-9 pr-10 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-600/50 transition-colors"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 bg-zinc-800 border border-zinc-700 rounded pointer-events-none">
                /
              </kbd>
            </div>

            {/* Filter Pills & View Mode Toggles */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Provider Quick Filter Pill */}
              <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs font-mono">
                <Filter className="w-3.5 h-3.5 text-zinc-500 ml-2 mr-1" />
                {providers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedProvider(p)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                      selectedProvider === p
                        ? "bg-emerald-700 hover:bg-emerald-600 text-white font-bold shadow-[0_0_10px_rgba(4,120,87,0.35)]"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* View Switcher (Grid / List) */}
              <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "grid" ? "bg-emerald-700 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "list" ? "bg-emerald-700 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Onboard / Telemetry Pill (like Vercel 'Onboard Your Agent ⎘') */}
              <button
                type="button"
                onClick={handleCopyTelemetry}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 transition-colors"
                title="Copy Telemetry Norm"
              >
                <span>Audited FOCUS 1.0</span>
                {copiedPill ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
              </button>
            </div>
          </div>

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

          {/* TAB 1: OVERVIEW (THE ICONIC VERCEL 2-COLUMN DASHBOARD) */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* LEFT COLUMN: USAGE & ALERTS (Inspired by Vercel Usage / Alerts Cards) */}
              <div className="lg:col-span-4 space-y-5">
                {/* 1. USAGE CARD (Styled in Luminous Emerald/Teal Glass Theme) */}
                <div className="relative p-6 rounded-3xl bg-gradient-to-b from-[#031d1b] via-[#021312] to-[#010908] border border-teal-500/20 font-mono space-y-4 overflow-hidden shadow-[0_0_35px_-5px_rgba(20,184,166,0.25),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all">
                  {/* Subtle Grid Backdrop */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[linear-gradient(to_right,#2dd4bf_1px,transparent_1px),linear-gradient(to_bottom,#2dd4bf_1px,transparent_1px)] bg-[size:20px_20px]"
                  />

                  {/* Top Ambient Glow */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-teal-500/15 blur-2xl rounded-full"
                  />

                  {/* Luminous Bottom Rim Light Bar */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-90 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-emerald-500/20 blur-2xl rounded-full"
                  />

                  {/* Header Row */}
                  <div className="relative z-10 flex items-center justify-between pb-3 border-b border-teal-500/20">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
                      <h3 className="font-bold text-white text-base tracking-tight">Usage</h3>
                      <span className="text-[10px] text-teal-400/80 font-mono uppercase tracking-wider font-semibold">
                        Last 30 days
                      </span>
                    </div>
                    <Link
                      href="/spend/cloud"
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-950/70 hover:bg-teal-900/90 text-teal-200 border border-teal-500/30 hover:border-teal-400/60 shadow-[0_0_12px_rgba(20,184,166,0.2)] transition-all flex items-center gap-1"
                    >
                      <span>Manage</span>
                    </Link>
                  </div>

                  {/* Telemetry Metric Items with Circular Gauge / Ring Indicator */}
                  <div className="relative z-10 space-y-4 text-xs">
                    {/* Item 1: Cloud Infrastructure */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-zinc-300">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full border border-teal-400/80 bg-teal-400/40 shadow-[0_0_6px_rgba(45,212,191,0.7)]" />
                          <span className="text-zinc-200 font-medium">Multi-Cloud Infra</span>
                        </span>
                        <span className="font-bold text-white tracking-tight">{cloudSpendFormatted} / $150K</span>
                      </div>
                      <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-teal-900/40 p-[1px]">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                          style={{
                            width: `${Math.min(100, Math.round(((data?.cloud_spend_mtd ?? 85000) / 150000) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Item 2: AI Foundation Models */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-zinc-300">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full border border-cyan-400/80 bg-cyan-400/40 shadow-[0_0_6px_rgba(34,211,238,0.7)]" />
                          <span className="text-zinc-200 font-medium">AI Inference Tokens</span>
                        </span>
                        <span className="font-bold text-white tracking-tight">{aiSpendFormatted} / $50K</span>
                      </div>
                      <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-teal-900/40 p-[1px]">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(45,212,191,0.6)]"
                          style={{
                            width: `${Math.min(100, Math.round(((data?.ai_spend_mtd ?? 42000) / 50000) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Item 3: FOCUS Tag Attribution */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-zinc-300">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full border border-emerald-400/80 bg-emerald-400/40 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                          <span className="text-zinc-200 font-medium">Cost Attribution</span>
                        </span>
                        <span className="font-bold text-white tracking-tight">{coveragePercentFormatted} / 100%</span>
                      </div>
                      <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-teal-900/40 p-[1px]">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 rounded-full transition-all duration-500 shadow-[0_0_14px_rgba(52,211,153,0.7)]"
                          style={{ width: `${Math.min(100, data?.attributionCoverage.percentage ?? 84.2)}%` }}
                        />
                      </div>
                    </div>

                    {/* Collapsible extra metrics */}
                    {usageExpanded && (
                      <div className="pt-3 border-t border-teal-500/20 space-y-2 text-[11px] text-zinc-300">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Month-End Forecast</span>
                          <span className="text-white font-bold">{projectedFormatted} Run-rate</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Pipeline Optimization</span>
                          <span className="text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                            +${formatNumber(data?.potential_savings_monthly ?? 34200)}/mo
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expand / Collapse Chevron */}
                  <button
                    type="button"
                    onClick={() => setUsageExpanded((p) => !p)}
                    className="relative z-10 w-full pt-1 flex items-center justify-center text-teal-400/70 hover:text-teal-200 transition-colors cursor-pointer"
                  >
                    {usageExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* 2. ALERTS CARD (Vercel Style) */}
                <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 hover:border-zinc-700 transition-colors font-mono space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <h3 className="font-bold text-white text-sm">Alerts & Telephony</h3>
                    <span className="w-2 h-2 rounded-full bg-zinc-300 shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
                  </div>

                  <div className="py-4 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
                      <Bell className="w-4 h-4 text-zinc-200" />
                    </div>
                    <p className="text-xs text-zinc-400 max-w-xs font-sans">
                      Get real-time autonomous voice calls, Slack alerts & webhooks when spend spikes occur.
                    </p>
                    <Link
                      href="/settings"
                      className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-white text-black text-xs font-bold font-mono uppercase tracking-wider transition-colors shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                    >
                      Configure Alerts
                    </Link>
                  </div>
                </div>

                {/* 3. RECENT ACTIVITY & DETECTIONS (Vercel 'Recent Previews' style) */}
                <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 hover:border-zinc-700 transition-colors font-mono space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <h3 className="font-bold text-white text-sm">Recent Activity</h3>
                    <Link href="/anomalies" className="text-[11px] text-zinc-400 hover:text-white underline">
                      View all
                    </Link>
                  </div>

                  {Array.isArray(anomaliesData) && anomaliesData.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {anomaliesData.slice(0, 3).map((a: any) => (
                        <Link
                          key={a.id}
                          href="/anomalies"
                          className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between text-xs transition-colors block"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                            <span className="text-zinc-200 font-medium truncate">{a.service || a.title || "Anomaly"}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono flex-shrink-0">
                            ${formatNumber(Number(a.anomaly_cost || a.cost || 0))}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-zinc-500 font-sans">
                      All systems nominal. No open spend anomalies.
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: MONITORED WORKLOADS & CLOUD SERVICES (Vercel Projects Grid) */}
              <div className="lg:col-span-8 space-y-5">
                {/* Header: Projects (Count) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono">
                    <h2 className="text-base font-bold text-white">Monitored Workloads</h2>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                      {filteredWorkloads.length}
                    </span>
                  </div>
                  <Link
                    href="/settings/connections"
                    className="text-xs font-mono text-zinc-400 hover:text-white underline"
                  >
                    Manage Connections →
                  </Link>
                </div>

                {/* MagicBento Grid of Workload Cards (Interactive Spotlight & Edge Light) */}
                <MagicBento
                  gap={16}
                  radius={16}
                  className={
                    viewMode === "grid"
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1"
                  }
                  enableSpotlight={true}
                  enableBorderGlow={true}
                >
                  {filteredWorkloads.map((wl) => (
                    <MagicBentoCard
                      key={wl.id}
                      href={wl.url}
                      radius={16}
                      className="p-5 flex flex-col justify-between font-mono space-y-4"
                    >
                      {/* Top Row: Provider Brand Logo + Name + URL + Health Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-900/90 border border-zinc-800/90 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all group-hover:border-zinc-700 p-2 shadow-inner">
                            <ProviderLogo
                              provider={wl.provider}
                              name={wl.name}
                              size={24}
                              className="shrink-0"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-white text-sm group-hover:text-zinc-200 transition-colors">
                                {wl.name}
                              </h3>
                              <ExternalLink className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-xs text-zinc-400 truncate max-w-[180px] sm:max-w-[210px]">
                              {wl.domain}
                            </p>
                          </div>
                        </div>

                        {/* Health Indicator: Vercel double-ring checkmark */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-200" />
                          </div>
                        </div>
                      </div>

                      {/* Middle & Bottom Rows: Git/Telemetry Commit Line */}
                      <div className="pt-3 border-t border-zinc-800/80 space-y-2 text-xs">
                        {/* Commit msg / Active spend line */}
                        <div className="flex items-center gap-2 text-zinc-300 font-sans text-xs">
                          <GitCommit className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                          <span className="truncate">{wl.commitMsg}</span>
                        </div>

                        {/* Branch & Last Synced Timestamp */}
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3 text-zinc-600" />
                            <span>{wl.branch}</span>
                          </span>
                          <span className="font-semibold text-zinc-300">{wl.spend}</span>
                        </div>
                      </div>
                    </MagicBentoCard>
                  ))}
                </MagicBento>

                {/* Embedded Top AI Keys Intelligence */}
                <div className="rounded-2xl border border-zinc-800 bg-[#09090b] overflow-hidden">
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
                      <h3 className="font-bold text-[#EDEAE0] text-base font-mono">
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
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800">
                      ACTIVE
                    </span>
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
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900/90 text-[#EDEAE0] border border-zinc-800/90 hover:border-zinc-700 transition-all flex items-center gap-2 shadow-sm"
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
            <span className="text-[10px] font-bold font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">
              CLICKHOUSE INJECTOR
            </span>
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
            <button
              type="button"
              onClick={() => handleInject("leaked-key")}
              disabled={loadingScenario === "leaked-key"}
              className="w-full flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-75 focus:outline-none"
            >
              <ThinkingPill
                label={
                  loadingScenario === "leaked-key"
                    ? "INJECTING"
                    : successScenario === "leaked-key"
                    ? "INJECTED // DETECTING"
                    : "INJECT LEAKED KEY"
                }
                dots={loadingScenario === "leaked-key"}
                width={280}
                height={38}
                fontSize={11}
                fontWeight={700}
                speed={loadingScenario === "leaked-key" ? 3.0 : 1.3}
                colors={["#7f1d1d", "#b91c1c", "#dc2626", "#ef4444", "#f97316", "#dc2626", "#7f1d1d"]}
                style={{ width: "100%" }}
                className="w-full shadow-[0_0_18px_rgba(239,68,68,0.35)] hover:shadow-[0_0_24px_rgba(239,68,68,0.55)] transition-shadow"
              />
            </button>
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
            <button
              type="button"
              onClick={() => handleInject("runaway-process")}
              disabled={loadingScenario === "runaway-process"}
              className="w-full flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-75 focus:outline-none"
            >
              <ThinkingPill
                label={
                  loadingScenario === "runaway-process"
                    ? "INJECTING"
                    : successScenario === "runaway-process"
                    ? "INJECTED // DETECTING"
                    : "INJECT RUNAWAY"
                }
                dots={loadingScenario === "runaway-process"}
                width={280}
                height={38}
                fontSize={11}
                fontWeight={700}
                speed={loadingScenario === "runaway-process" ? 3.0 : 1.3}
                colors={["#4c1d95", "#6b21a8", "#7c3aed", "#a855f7", "#ec4899", "#7c3aed", "#4c1d95"]}
                style={{ width: "100%" }}
                className="w-full shadow-[0_0_18px_rgba(168,85,247,0.35)] hover:shadow-[0_0_24px_rgba(168,85,247,0.55)] transition-shadow"
              />
            </button>
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
            <button
              type="button"
              onClick={() => handleInject("bill-spike")}
              disabled={loadingScenario === "bill-spike"}
              className="w-full flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-75 focus:outline-none"
            >
              <ThinkingPill
                label={
                  loadingScenario === "bill-spike"
                    ? "INJECTING"
                    : successScenario === "bill-spike"
                    ? "INJECTED // DETECTING"
                    : "INJECT BILL SURGE"
                }
                dots={loadingScenario === "bill-spike"}
                width={280}
                height={38}
                fontSize={11}
                fontWeight={700}
                speed={loadingScenario === "bill-spike" ? 3.0 : 1.3}
                colors={["#78350f", "#b45309", "#d97706", "#f59e0b", "#fbbf24", "#10b981", "#78350f"]}
                style={{ width: "100%" }}
                className="w-full shadow-[0_0_18px_rgba(245,158,11,0.35)] hover:shadow-[0_0_24px_rgba(245,158,11,0.55)] transition-shadow"
              />
            </button>
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

