"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  Layers,
  Search,
  Check,
  Cpu,
  Database,
  Cloud,
  LayoutGrid,
  List,
  Download,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { useSavings, useApproveAction } from "@/hooks/useSavings";
import { formatNumber, cn } from "@/lib/utils";
import type { SavingsEntry } from "@/types";
import {
  AwsLogo,
  GcpCloudLogo,
  OpenAiRosetteLogo,
  AnthropicAiLogo,
  KubernetesWheelLogo,
} from "@/components/ui/BrandLogos";

function getActionMeta(actionType: string) {
  const t = actionType.toLowerCase();
  if (t.includes("m6i") || t.includes("rightsizing")) {
    return {
      provider: "AWS",
      logo: "aws",
      service: "Amazon EC2",
      title: "Amazon EC2 Rightsizing",
      description: "Downscale overprovisioned m6i.4xlarge compute instances to m6i.xlarge on worker nodes.",
      region: "us-east-1",
      flag: "🇺🇸",
      category: "compute",
    };
  }
  if (t.includes("caching") || t.includes("prompt")) {
    return {
      provider: "OpenAI",
      logo: "openai",
      service: "OpenAI API",
      title: "Prompt Caching Optimization",
      description: "Cache recurrent system prompt prefixes across high-volume LLM completions.",
      region: "Global API",
      flag: "🌐",
      category: "ai",
    };
  }
  if (t.includes("sandbox") || t.includes("idle")) {
    return {
      provider: "AWS",
      logo: "aws",
      service: "Cloud Infrastructure",
      title: "Idle Sandboxes Decommission",
      description: "Automated teardown of 6 stale development environments idle for >72 hours.",
      region: "us-west-2",
      flag: "🇺🇸",
      category: "compute",
    };
  }
  if (t.includes("bigquery") || t.includes("query slot")) {
    return {
      provider: "Google Cloud",
      logo: "gcp",
      service: "Google BigQuery",
      title: "BigQuery Query Slot Cap",
      description: "Cap unpartitioned analytical queries to 500 reservation slots to prevent spikes.",
      region: "us-central1",
      flag: "🇺🇸",
      category: "storage",
    };
  }
  if (t.includes("savings plan") || t.includes("commitment")) {
    return {
      provider: "AWS",
      logo: "aws",
      service: "AWS Compute Fleet",
      title: "AWS 1-Yr Compute Savings Plan",
      description: "1-Year partial-upfront commitment policy covering baseline steady-state compute fleet.",
      region: "Global Fleet",
      flag: "🇺🇸",
      category: "compute",
    };
  }
  if (t.includes("ebs") || t.includes("orphan")) {
    return {
      provider: "AWS",
      logo: "aws",
      service: "Amazon EBS",
      title: "Orphan EBS Volume Clean-Up",
      description: "Purge 18 unattached gp3 block storage volumes detached from terminated clusters.",
      region: "us-east-1",
      flag: "🇺🇸",
      category: "storage",
    };
  }
  if (t.includes("haiku") || t.includes("model cascade") || t.includes("classification")) {
    return {
      provider: "Anthropic",
      logo: "anthropic",
      service: "Anthropic Claude",
      title: "Model Cascade: Route to Haiku",
      description: "Cascade high-throughput classification queries from Opus down to Claude 3.5 Haiku.",
      region: "Global API",
      flag: "🌐",
      category: "ai",
    };
  }
  if (t.includes("kubernetes") || t.includes("node pool")) {
    return {
      provider: "Kubernetes",
      logo: "kubernetes",
      service: "Kubernetes Cluster",
      title: "Staging Node Pool Auto-Scale",
      description: "Schedule node pool downscaling during off-peak hours and weekend periods.",
      region: "k8s-staging",
      flag: "🌐",
      category: "compute",
    };
  }
  return {
    provider: "Cloud",
    logo: "cloud",
    service: "Cloud Service",
    title: actionType,
    description: "Automated cloud cost optimization and infrastructure rightsizing policy.",
    region: "Global",
    flag: "🌐",
    category: "compute",
  };
}

export default function SavingsPage() {
  const { data, isLoading } = useSavings();
  const approveActionMutation = useApproveAction();
  const [selectedCategory, setSelectedCategory] = useState<"all" | "cloud" | "ai" | "storage">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const entries: SavingsEntry[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.entries)) return data.entries;

    const anyData = data as any;
    if (anyData.identified || anyData.approved || anyData.verified) {
      return [
        ...(anyData.identified ?? []).map((e: any) => ({ ...e, status: e.status || "identified" })),
        ...(anyData.approved ?? []).map((e: any) => ({ ...e, status: e.status || "approved" })),
        ...(anyData.verified ?? []).map((e: any) => ({ ...e, status: e.status || "verified" })),
      ];
    }
    return [];
  }, [data]);

  const verified = useMemo(() => entries.filter((e) => e.status === "verified" || e.status === "realized"), [entries]);
  const approved = useMemo(() => entries.filter((e) => e.status === "approved" || e.status === "executing"), [entries]);
  const identified = useMemo(() => entries.filter((e) => e.status === "identified" || e.status === "pending_approval"), [entries]);

  const totalRealized = useMemo(() => {
    if (data && "total_realized_savings" in data && typeof data.total_realized_savings === "number") {
      return data.total_realized_savings;
    }
    return verified.reduce((acc, curr) => acc + (Number(curr.savings_amount) || 0), 0);
  }, [data, verified]);

  const totalApproved = useMemo(() => {
    return approved.reduce((acc, curr) => acc + (Number(curr.savings_amount) || 0), 0);
  }, [approved]);

  const totalIdentified = useMemo(() => {
    return identified.reduce((acc, curr) => acc + (Number(curr.savings_amount) || 0), 0);
  }, [identified]);

  const grandTotalSavings = totalRealized + totalApproved + totalIdentified;

  // Filter entries based on search and optional category
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const meta = getActionMeta(e.action_type);
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesAction = e.action_type.toLowerCase().includes(query);
        const matchesTitle = meta.title.toLowerCase().includes(query);
        const matchesDesc = meta.description.toLowerCase().includes(query);
        const matchesProvider = meta.provider.toLowerCase().includes(query);
        if (!matchesAction && !matchesTitle && !matchesDesc && !matchesProvider) return false;
      }
      if (selectedCategory === "ai" && meta.category !== "ai") {
        return false;
      }
      if (selectedCategory === "cloud" && meta.category !== "compute") {
        return false;
      }
      if (selectedCategory === "storage" && meta.category !== "storage") {
        return false;
      }
      return true;
    });
  }, [entries, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white">
      <Topbar title="Savings Pipeline" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto select-none">
        {/* ── 1. UNCLUTTERED FLOW SECTION: DIRECT ON BACKGROUND ── */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-[#faf8f5] flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#f4efe6]" />
                <span>Savings Realization Flow</span>
              </h2>
              <p className="text-xs font-mono text-[#a1a1aa] mt-1">
                Linear 3-stage optimization pipeline from ML discovery to verified billing reduction
              </p>
            </div>

            <div className="relative overflow-hidden flex items-baseline gap-2 bg-zinc-900/80 border border-zinc-800 px-4 py-2 rounded-full self-start sm:self-auto shadow-sm">
              <span className="text-xs font-mono text-zinc-400 font-medium">Total Opportunity:</span>
              <span className="text-base font-bold font-mono text-[#faf8f5]">${formatNumber(grandTotalSavings)}/mo</span>
            </div>
          </div>

          {/* 3 Step Connected Stage Cards in Warm White / Ivory Theme */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            {/* Stage 1: Identified */}
            <div className="rounded-2xl bg-[#faf8f5] border border-[#e5e0d8] p-5 sm:p-6 space-y-3.5 shadow-md transition-all duration-300 hover:border-[#d6cfc4]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#18181b] flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#18181b]" />
                  Stage 1: Discovered
                </span>
                <span className="text-[#71717a] font-semibold">{identified.length} actions</span>
              </div>
              <div className="text-3xl font-black font-mono text-[#09090b] tracking-tight">
                ${formatNumber(totalIdentified)}
                <span className="text-xs text-[#71717a] font-normal ml-1">/mo</span>
              </div>
              <div className="text-[11px] font-mono text-[#71717a] flex items-center justify-between pt-2.5 border-t border-[#e8e3db]">
                <span>Pending Review</span>
                <span className="text-[#18181b] font-bold bg-[#ede8e0] px-2 py-0.5 rounded border border-[#ded7cc]">Needs Gate</span>
              </div>
            </div>

            {/* Stage 2: Approved / Scheduled */}
            <div className="rounded-2xl bg-[#faf8f5] border border-[#e5e0d8] p-5 sm:p-6 space-y-3.5 shadow-md transition-all duration-300 hover:border-[#d6cfc4]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#18181b] flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#18181b]" />
                  Stage 2: Approved
                </span>
                <span className="text-[#71717a] font-semibold">{approved.length} actions</span>
              </div>
              <div className="text-3xl font-black font-mono text-[#09090b] tracking-tight">
                ${formatNumber(totalApproved)}
                <span className="text-xs text-[#71717a] font-normal ml-1">/mo</span>
              </div>
              <div className="text-[11px] font-mono text-[#71717a] flex items-center justify-between pt-2.5 border-t border-[#e8e3db]">
                <span>Executing / Queued</span>
                <span className="text-[#18181b] font-bold bg-[#ede8e0] px-2 py-0.5 rounded border border-[#ded7cc]">In Flight</span>
              </div>
            </div>

            {/* Stage 3: Realized / Verified */}
            <div className="rounded-2xl bg-[#faf8f5] border border-[#e5e0d8] p-5 sm:p-6 space-y-3.5 shadow-md transition-all duration-300 hover:border-[#d6cfc4]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#18181b] flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#18181b]" />
                  Stage 3: Verified
                </span>
                <span className="text-[#18181b] font-bold bg-[#ede8e0] px-2 py-0.5 rounded border border-[#ded7cc]">{verified.length} verified</span>
              </div>
              <div className="text-3xl font-black font-mono text-[#09090b] tracking-tight">
                ${formatNumber(totalRealized)}
                <span className="text-xs text-[#71717a] font-normal ml-1">/mo</span>
              </div>
              <div className="text-[11px] font-mono text-[#71717a] flex items-center justify-between pt-2.5 border-t border-[#e8e3db]">
                <span>Reflected on Invoices</span>
                <span className="text-[#18181b] font-bold">+18.4% MoM</span>
              </div>
            </div>
          </div>

          {/* Clean Segmented Progress Bar */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-mono text-[#a1a1aa]">
              <span>Pipeline Realization Progress</span>
              <span className="text-[#faf8f5] font-bold font-mono">
                {Math.round((totalRealized / (grandTotalSavings || 1)) * 100)}% realized
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex p-0.5 border border-zinc-800">
              <div
                style={{ width: `${(totalRealized / (grandTotalSavings || 1)) * 100}%` }}
                className="bg-[#faf8f5] rounded-full h-full transition-all duration-500"
              />
              <div
                style={{ width: `${(totalApproved / (grandTotalSavings || 1)) * 100}%` }}
                className="bg-[#71717a] rounded-full h-full transition-all duration-500 ml-1"
              />
            </div>
          </div>
        </div>

        {/* ── 2. SUBPROCESSORS-STYLE GRID (DRIBBLE INSPIRED, REAL LOGOS, PEARL PALETTE) ── */}
        <div className="space-y-5">
          {/* Header Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
            <div>
              <h3 className="font-mono text-lg font-bold text-[#faf8f5] tracking-tight">
                Savings Actions & Policies
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                {filteredEntries.length} live optimization opportunities mapped from cloud & AI infrastructure
              </p>
            </div>

            {/* Filter Buttons, Search, View Mode & Export */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Category Filter Pills in Liquid Glass */}
              <div className="inline-flex items-center gap-1 bg-black/40 backdrop-blur-xl p-1 rounded-full border border-white/10 text-xs font-mono shadow-inner">
                {[
                  { id: "all", label: "All" },
                  { id: "cloud", label: "Compute" },
                  { id: "ai", label: "AI Models" },
                  { id: "storage", label: "Data / Storage" },
                ].map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={cn(
                        "relative px-3.5 py-1 rounded-full text-xs font-mono transition-all duration-200 cursor-pointer overflow-hidden focus:outline-none",
                        isActive
                          ? "text-white font-bold bg-white/[0.18] border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.3)] backdrop-blur-md"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                      )}
                    >
                      {isActive && (
                        <div className="absolute top-0 inset-x-1 h-[50%] rounded-t-full bg-gradient-to-b from-white/50 to-transparent pointer-events-none" />
                      )}
                      <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Minimal Search Input (Liquid Glass) */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search actions..."
                  className="w-44 sm:w-48 h-8.5 pl-9 pr-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 font-mono transition-all shadow-inner"
                />
              </div>

              {/* Grid / List View Toggle in Liquid Glass */}
              <div className="inline-flex items-center p-0.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-inner">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "relative p-1.5 rounded-full transition-all cursor-pointer overflow-hidden",
                    viewMode === "grid"
                      ? "text-white bg-white/[0.18] border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] backdrop-blur-md"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5 relative z-10" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "relative p-1.5 rounded-full transition-all cursor-pointer overflow-hidden",
                    viewMode === "list"
                      ? "text-white bg-white/[0.18] border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] backdrop-blur-md"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5 relative z-10" />
                </button>
              </div>

              {/* Export Button in Liquid Glass */}
              <button
                type="button"
                className="group relative h-8.5 px-4 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center gap-1.5 text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer"
              >
                <div className="absolute top-0 inset-x-1.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                <Download className="w-3.5 h-3.5 text-zinc-300 relative z-10" />
                <span className="relative z-10">Export</span>
              </button>
            </div>
          </div>

          {/* ── 3. CARD GRID VIEW (4 COLUMNS, DRIBBLE SUBPROCESSORS STYLE) ── */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredEntries.map((row) => {
                const meta = getActionMeta(row.action_type);
                const isVerified = row.status === "verified" || row.status === "realized";
                const isApproved = row.status === "approved" || row.status === "executing";

                return (
                  <div
                    key={row.id}
                    className="group relative rounded-2xl border border-zinc-800/80 bg-[#0e0f13] hover:bg-[#121318] hover:border-zinc-700 transition-all duration-200 p-5 flex flex-col justify-between shadow-sm hover:shadow-md"
                  >
                    {/* Top Row: Real Logo & Region/Status Tag */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center p-2 shadow-inner shrink-0">
                          {meta.logo === "aws" && <AwsLogo className="w-5 h-5" />}
                          {meta.logo === "gcp" && <GcpCloudLogo className="w-5 h-5" />}
                          {meta.logo === "openai" && <OpenAiRosetteLogo className="w-5 h-5" />}
                          {meta.logo === "anthropic" && <AnthropicAiLogo className="w-5 h-5" />}
                          {meta.logo === "kubernetes" && <KubernetesWheelLogo className="w-5 h-5" />}
                          {meta.logo === "cloud" && <Cloud className="w-5 h-5 text-zinc-400" />}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-zinc-500 font-mono" title={meta.region}>
                            {meta.flag} {meta.region}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 font-medium tracking-wide uppercase">
                            {isVerified ? "Verified" : isApproved ? "Approved" : "Identified"}
                          </span>
                        </div>
                      </div>

                      {/* Service & Action Title */}
                      <h4 className="text-sm font-semibold text-zinc-100 tracking-tight leading-snug group-hover:text-white transition-colors">
                        {meta.title}
                      </h4>
                      <div className="text-[11px] font-mono text-zinc-500 mt-1 truncate">
                        {row.action_type}
                      </div>

                      {/* Human-written clean micro-copy */}
                      <p className="text-xs text-zinc-400 leading-relaxed mt-2.5 line-clamp-2">
                        {meta.description}
                      </p>
                    </div>

                    {/* Bottom Row: Financial Stats & Action */}
                    <div className="pt-4 mt-4 border-t border-zinc-800/70">
                      <div className="flex items-baseline justify-between mb-3">
                        <div>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                            Monthly Savings
                          </span>
                          <span className="text-base font-bold font-mono text-[#faf8f5] tracking-tight">
                            +${formatNumber(row.savings_amount)}/mo
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                            Baseline
                          </span>
                          <span className="text-xs font-mono text-zinc-400">
                            ${formatNumber(row.baseline_cost)} → ${formatNumber(row.realized_cost)}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      {row.status === "pending_approval" || row.status === "identified" ? (
                        <button
                          type="button"
                          onClick={() => approveActionMutation.mutate(row.id)}
                          disabled={approveActionMutation.isPending}
                          className="w-full py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-mono font-medium transition-all cursor-pointer shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5"
                        >
                          <span>Approve Policy</span>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                        </button>
                      ) : (
                        <div className="w-full py-1.5 px-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 text-zinc-400 text-xs font-mono text-center flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{isVerified ? "Enforced & Verified" : "Execution Queued"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── 4. LIST / TABLE VIEW (MINIMAL, SOFT WHITE GRAY / PEARL PALETTE) ── */
            <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-[#0e0f13]">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Service & Optimization</th>
                    <th className="py-3 px-4">Region</th>
                    <th className="py-3 px-4">Baseline</th>
                    <th className="py-3 px-4">Optimized</th>
                    <th className="py-3 px-4">Monthly Savings</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {filteredEntries.map((row) => {
                    const meta = getActionMeta(row.action_type);
                    const isVerified = row.status === "verified" || row.status === "realized";
                    const isApproved = row.status === "approved" || row.status === "executing";

                    return (
                      <tr key={row.id} className="hover:bg-zinc-800/25 transition-colors">
                        {/* Title with Logo */}
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1 shrink-0">
                            {meta.logo === "aws" && <AwsLogo className="w-4 h-4" />}
                            {meta.logo === "gcp" && <GcpCloudLogo className="w-4 h-4" />}
                            {meta.logo === "openai" && <OpenAiRosetteLogo className="w-4 h-4" />}
                            {meta.logo === "anthropic" && <AnthropicAiLogo className="w-4 h-4" />}
                            {meta.logo === "kubernetes" && <KubernetesWheelLogo className="w-4 h-4" />}
                            {meta.logo === "cloud" && <Cloud className="w-4 h-4 text-zinc-400" />}
                          </div>
                          <div>
                            <div className="text-zinc-100 font-semibold">{meta.title}</div>
                            <div className="text-[11px] text-zinc-500 font-normal truncate max-w-sm">{row.action_type}</div>
                          </div>
                        </td>

                        {/* Region */}
                        <td className="py-3.5 px-4 text-zinc-400">
                          {meta.flag} {meta.region}
                        </td>

                        {/* Baseline */}
                        <td className="py-3.5 px-4 text-zinc-400">
                          ${formatNumber(row.baseline_cost)}
                        </td>

                        {/* Optimized */}
                        <td className="py-3.5 px-4 text-zinc-300">
                          ${formatNumber(row.realized_cost)}
                        </td>

                        {/* Monthly Savings in Pearl Palette */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#faf8f5] text-sm">
                            +${formatNumber(row.savings_amount)}/mo
                          </span>
                        </td>

                        {/* Status Badge in Soft Pearl */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border border-zinc-800 bg-zinc-900 text-zinc-300 font-medium">
                            {isVerified ? "Verified" : isApproved ? "Approved" : "Identified"}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          {row.status === "pending_approval" || row.status === "identified" ? (
                            <button
                              type="button"
                              onClick={() => approveActionMutation.mutate(row.id)}
                              disabled={approveActionMutation.isPending}
                              className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-mono font-medium transition-all cursor-pointer shadow-sm active:scale-95 inline-flex items-center gap-1"
                            >
                              <span>Approve</span>
                              <ArrowRight className="w-3 h-3 text-zinc-400" />
                            </button>
                          ) : (
                            <span className="text-xs text-zinc-500 font-mono">
                              {isVerified ? "Enforced" : "Queued"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
