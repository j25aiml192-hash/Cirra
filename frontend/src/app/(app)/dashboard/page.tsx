"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Eye,
  Cloud,
  AlertTriangle,
  Cpu,
  ShieldCheck,
  Filter,
  Loader2,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { useDashboard } from "@/hooks/useDashboard";
import { PeriodTabs } from "@/components/ui/PeriodTabs";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SpendBarChart } from "@/components/charts/SpendBarChart";
import { TopServicesTable } from "@/components/ui/TopServicesTable";
import { TopAiKeysCard } from "@/components/ui/TopAiKeysCard";
import { formatNumber } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import type { Period } from "@/types";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [selectedProvider, setSelectedProvider] = useState<string>("All");
  const [executiveView, setExecutiveView] = useState(false);
  const { data, isLoading } = useDashboard(period);

  // Derive provider-filtered spend amounts when a specific provider chip is clicked
  const getProviderSpend = () => {
    if (!data) return { total: 0, label: "TOTAL SPEND" };
    if (selectedProvider === "AWS") return { total: data.cloud_spend_mtd, label: "AWS SPEND" };
    if (selectedProvider === "GCP") return { total: Math.round(data.cloud_spend_mtd * 0.23), label: "GCP SPEND" };
    if (selectedProvider === "OpenAI") return { total: Math.round(data.ai_spend_mtd * 0.62), label: "OPENAI SPEND" };
    if (selectedProvider === "Anthropic") return { total: Math.round(data.ai_spend_mtd * 0.38), label: "ANTHROPIC SPEND" };
    return { total: data.total_spend_mtd, label: `TOTAL SPEND / ${period.toUpperCase()}` };
  };

  const { total: currentTotalSpend, label: currentSpendLabel } = getProviderSpend();

  const totalSpendFormatted = `$${formatNumber(currentTotalSpend)}`;
  const aiSpendFormatted = data ? `$${formatNumber(data.ai_spend_mtd)}` : "$0";
  const projectedFormatted = data ? `$${formatNumber(data.forecasted_spend / 1000)}K` : "$0";
  const coveragePercentFormatted = data ? `${data.attributionCoverage.percentage}%` : "0%";
  const coverageSub = data
    ? `${data.attributionCoverage.resourcesCount} of ${data.attributionCoverage.totalResources} resources`
    : "";

  const providers = ["All", "AWS", "GCP", "OpenAI", "Anthropic"];

  return (
    <div className="min-h-screen">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
        {/* 1. Header Row & Telemetry Status */}
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
                onClick={() => setExecutiveView((p) => !p)}
                className={`h-8 px-3.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer ${
                  executiveView
                    ? "bg-[#0A192F] text-white border-[#0A192F] shadow-blue-500/10"
                    : "border-[#D6E4F5] bg-white text-[#0A192F] hover:bg-[#F0F5FD] hover:border-[#BCD4F0]"
                }`}
                title="Toggle Executive High-Level View"
              >
                <Eye className={`w-3.5 h-3.5 ${executiveView ? "text-blue-400" : "text-[#5A6E85]"}`} />
                <span>Executive View</span>
              </button>
            </div>
          </div>

          {/* Executive View Highlight Banner when active */}
          {executiveView && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0F1E36] to-[#1A365D] text-white shadow-md flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Executive Spend Health: Optimal
                </div>
                <p className="text-xs text-slate-300">
                  Target threshold variance is within 4.2%. Identified savings pipeline of ${formatNumber(data?.potential_savings_monthly ?? 34200)}/mo can offset 81% of recent LLM growth.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/savings"
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors"
                >
                  Review Savings
                </Link>
                <Link
                  href="/anomalies"
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
                >
                  Inspect Drift
                </Link>
              </div>
            </div>
          )}

          {/* Quick telemetry chips bar - Fully Clickable to Respective Sections */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/80 border border-[#D6E4F5] shadow-sm backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7E93AB] mr-1">
                TELEMETRY:
              </span>

              {/* Cloud -> links to /spend/cloud */}
              <Link
                href="/spend/cloud"
                title="View Cloud Spend"
                className="inline-flex items-center gap-2 bg-[#F8FAFD] border border-[#D6E4F5] hover:border-[#BCD9FC] hover:bg-[#F0F5FD] pl-2.5 pr-1.5 py-1 rounded-xl text-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1 text-[#5A6E85] group-hover:text-[#0062E0] font-semibold transition-colors">
                  <Cloud className="w-3.5 h-3.5 text-[#0062E0]" />
                  <span>Cloud</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-[#EBF3FE] text-[#0062E0] font-bold border border-[#BCD9FC] text-[11px] cirra-metric">
                  ${data ? Math.round(data.cloud_spend_mtd / 1000) : 85}K
                </span>
              </Link>

              {/* AI Models -> links to /spend/ai */}
              <Link
                href="/spend/ai"
                title="View AI Models Spend"
                className="inline-flex items-center gap-2 bg-[#F8FAFD] border border-[#D6E4F5] hover:border-[#DDD6FE] hover:bg-[#FBF8FE] pl-2.5 pr-1.5 py-1 rounded-xl text-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1 text-[#5A6E85] group-hover:text-[#7C3AED] font-semibold transition-colors">
                  <Cpu className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>AI Models</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-[#F5ECFE] text-[#7C3AED] font-bold border border-[#DDD6FE] text-[11px] cirra-metric">
                  ${data ? Math.round(data.ai_spend_mtd / 1000) : 42}K
                </span>
              </Link>

              {/* Attributed -> links to /allocation */}
              <Link
                href="/allocation"
                title="View Cost Allocation"
                className="inline-flex items-center gap-2 bg-[#F8FAFD] border border-[#D6E4F5] hover:border-[#B3ECCB] hover:bg-[#F2FBF6] pl-2.5 pr-1.5 py-1 rounded-xl text-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1 text-[#5A6E85] group-hover:text-[#0D824D] font-semibold transition-colors">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0D824D]" />
                  <span>Attributed</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-[#E6F8F0] text-[#0D824D] font-bold border border-[#B3ECCB] text-[11px] cirra-metric">
                  {data?.attributionCoverage.percentage ?? 84.2}%
                </span>
              </Link>

              {/* Anomalies -> links to /anomalies */}
              <Link
                href="/anomalies"
                title="Inspect Active Anomalies"
                className="inline-flex items-center gap-2 bg-[#F8FAFD] border border-[#D6E4F5] hover:border-[#FDE68A] hover:bg-[#FFFBF2] pl-2.5 pr-1.5 py-1 rounded-xl text-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1 text-[#5A6E85] group-hover:text-[#B45309] font-semibold transition-colors">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Anomalies</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-[#FFF4E5] text-[#B45309] font-bold border border-[#FDE68A] text-[11px] cirra-metric">
                  {data?.anomalies_detected ?? 0} active
                </span>
              </Link>
            </div>

            {/* Provider Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#F0F5FD] p-1 rounded-xl border border-[#D6E4F5]">
              <Filter className="w-3 h-3 text-[#7E93AB] ml-1.5 mr-0.5" />
              {providers.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedProvider(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${
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
            label={currentSpendLabel}
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

      {/* Live Scenario Engine Panel */}
      <LiveScenarioPanel />

      {/* 4. Top AI Keys Section */}
      <div>
        <TopAiKeysCard data={data?.topAiKeys ?? []} loading={isLoading} />
      </div>
      </main>
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

      // Check for pending scenarios that haven't appeared in anomalies yet (within 90s)
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
      console.error("LiveScenarioPanel polling error:", e);
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
      let res: Response | null = null;
      try {
        res = await fetch(`/api/v1/inject/${scenario}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch {}

      if (!res || !res.ok) {
        res = await fetch(`http://localhost:8000/inject/${scenario}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      }

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
      let res: Response | null = null;
      try {
        res = await fetch(`/api/v1/inject/cleanup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch {}

      if (!res || !res.ok) {
        res = await fetch(`http://localhost:8000/inject/cleanup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      }
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
    <div className="cirra-card p-6 border border-[#D6E4F5] bg-white rounded-2xl shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBF2FA] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#0A192F] tracking-tight">
              🔥 Live Scenario Engine
            </h2>
            <span className="text-[10px] font-bold text-[#7C3AED] bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
              Interactive Incident Simulator
            </span>
          </div>
          <p className="text-xs text-[#5A6E85] mt-1">
            Simulate real infrastructure incidents by injecting synthetic anomalies directly into ClickHouse. Sentinel picks them up organically and triggers live alert routing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={isCleaning}
          className="self-start sm:self-center px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shadow-sm"
          title="Clean up injected demo data from ClickHouse and Postgres"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isCleaning ? "animate-spin" : ""}`} />
          <span>{isCleaning ? "Resetting..." : "🔁 Reset All"}</span>
        </button>
      </div>

      {/* 3 Scenario Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scenario 1: Leaked Key */}
        <div className="border border-purple-200/80 hover:border-purple-400 bg-purple-50/30 hover:bg-purple-50/60 rounded-xl p-4 flex flex-col justify-between transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-[#7C3AED] flex items-center gap-1.5">
                <span>💀</span> Inject Leaked Key
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-[#7C3AED] border border-purple-300">
                CATASTROPHIC
              </span>
            </div>
            <p className="text-xs text-[#5A6E85]">
              847 requests • All channels fire
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => handleInject("leaked-key")}
              disabled={loadingScenario === "leaked-key"}
              className="w-full py-2 px-3 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75 active:scale-95"
            >
              {loadingScenario === "leaked-key" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Injecting & detecting...</span>
                </>
              ) : successScenario === "leaked-key" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Injected. Sentinel detecting...</span>
                </>
              ) : (
                <span>Inject Leaked Key</span>
              )}
            </button>
          </div>
        </div>

        {/* Scenario 2: Runaway Process */}
        <div className="border border-red-200/80 hover:border-red-400 bg-red-50/30 hover:bg-red-50/60 rounded-xl p-4 flex flex-col justify-between transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-[#DC2626] flex items-center gap-1.5">
                <span>🔄</span> Runaway Process
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-[#DC2626] border border-red-300">
                CRITICAL
              </span>
            </div>
            <p className="text-xs text-[#5A6E85]">
              GPT-4o • 341% spike • Voice call
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => handleInject("runaway-process")}
              disabled={loadingScenario === "runaway-process"}
              className="w-full py-2 px-3 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75 active:scale-95"
            >
              {loadingScenario === "runaway-process" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Injecting & detecting...</span>
                </>
              ) : successScenario === "runaway-process" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Injected. Sentinel detecting...</span>
                </>
              ) : (
                <span>Inject Runaway Process</span>
              )}
            </button>
          </div>
        </div>

        {/* Scenario 3: Bill Spike */}
        <div className="border border-orange-200/80 hover:border-orange-400 bg-orange-50/30 hover:bg-orange-50/60 rounded-xl p-4 flex flex-col justify-between transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-[#EA580C] flex items-center gap-1.5">
                <span>📈</span> Bill Spike
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-[#EA580C] border border-orange-300">
                HIGH
              </span>
            </div>
            <p className="text-xs text-[#5A6E85]">
              Vercel • 2x overnight • Slack + PR
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => handleInject("bill-spike")}
              disabled={loadingScenario === "bill-spike"}
              className="w-full py-2 px-3 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75 active:scale-95"
            >
              {loadingScenario === "bill-spike" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Injecting & detecting...</span>
                </>
              ) : successScenario === "bill-spike" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Injected. Sentinel detecting...</span>
                </>
              ) : (
                <span>Inject Bill Spike</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Feed Panel */}
      <div className="rounded-xl border border-[#D6E4F5] bg-[#F8FAFD] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2EDF9] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-extrabold text-[#0A192F] uppercase tracking-wider">
              Live Detection Feed
            </span>
          </div>
          <span className="text-[11px] font-medium text-[#7E93AB]">
            Auto-refreshes every 5s
          </span>
        </div>

        {detectedItems.length === 0 ? (
          <div className="py-7 text-center text-xs text-[#7E93AB] font-medium">
            No active scenarios. Click a button above to simulate an incident.
          </div>
        ) : (
          <div className="space-y-2.5">
            {detectedItems.map((item, idx) => (
              <div
                key={item.id || item.keyId + idx}
                className="bg-white border border-[#D6E4F5] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    {item.status === "DETECTING..." ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                        DETECTING...
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        DETECTED
                      </span>
                    )}

                    {/* Severity Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                        item.severity === "Catastrophic"
                          ? "bg-purple-100 text-[#7C3AED] border-purple-300"
                          : item.severity === "Critical"
                          ? "bg-red-100 text-[#DC2626] border-red-300"
                          : "bg-orange-100 text-[#EA580C] border-orange-300"
                      }`}
                    >
                      {item.severity}
                    </span>

                    <span className="text-xs font-bold text-[#0A192F]">
                      {item.name}
                    </span>

                    <span className="text-[11px] font-mono text-[#7E93AB]">
                      ({item.keyId})
                    </span>
                  </div>

                  {/* Channels Fired Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-[#7E93AB] mr-1">
                      Channels fired:
                    </span>
                    {item.channels.map((ch) => (
                      <span
                        key={ch}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F0F5FD] text-[#0A192F] border border-[#D6E4F5]"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:self-center">
                  {/* GitHub PR link if created */}
                  {item.prUrl && (
                    <a
                      href={item.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
                      title="Inspect GitHub Pull Request"
                    >
                      <span>View PR</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <span className="text-[11px] text-[#7E93AB] font-medium whitespace-nowrap">
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

