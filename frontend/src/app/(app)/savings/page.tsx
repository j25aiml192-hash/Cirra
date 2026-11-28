"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Search,
  Cloud,
  Check,
  ChevronRight,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
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
      title: "EC2 Rightsizing",
      description: "Downscale overprovisioned m6i.4xlarge compute instances to m6i.xlarge.",
      category: "compute",
    };
  }
  if (t.includes("caching") || t.includes("prompt")) {
    return {
      provider: "OpenAI",
      logo: "openai",
      service: "OpenAI API",
      title: "Prompt Caching",
      description: "Cache repetitive system prompt prefixes across high-volume completions.",
      category: "ai",
    };
  }
  if (t.includes("sandbox") || t.includes("idle")) {
    return {
      provider: "AWS",
      logo: "aws",
      service: "Cloud Infra",
      title: "Idle Sandboxes Teardown",
      description: "Auto-teardown dev environments idle for more than 72 hours.",
      category: "compute",
    };
  }
  if (t.includes("bigquery") || t.includes("query slot")) {
    return {
      provider: "Google Cloud",
      logo: "gcp",
      service: "Google BigQuery",
      title: "BigQuery Slot Cap",
      description: "Cap unpartitioned analytical queries to 500 reservation slots.",
      category: "storage",
    };
  }
  if (t.includes("savings plan") || t.includes("commitment")) {
    return {
      provider: "AWS",
      logo: "aws",
      service: "Compute Fleet",
      title: "Compute Savings Plan",
      description: "1-Year partial-upfront commitment covering steady-state compute.",
      category: "compute",
    };
  }
  if (t.includes("ebs") || t.includes("orphan")) {
    return {
      provider: "AWS",
      logo: "aws",
      service: "Amazon EBS",
      title: "Orphan Volumes Cleanup",
      description: "Purge unattached gp3 block storage volumes from old clusters.",
      category: "storage",
    };
  }
  if (t.includes("haiku") || t.includes("model cascade") || t.includes("classification")) {
    return {
      provider: "Anthropic",
      logo: "anthropic",
      service: "Anthropic Claude",
      title: "Route to Haiku",
      description: "Route high-throughput classification tasks down to Claude 3.5 Haiku.",
      category: "ai",
    };
  }
  if (t.includes("kubernetes") || t.includes("node pool")) {
    return {
      provider: "Kubernetes",
      logo: "kubernetes",
      service: "Kubernetes",
      title: "Node Pool Auto-Scale",
      description: "Schedule staging node pool downscaling during off-peak windows.",
      category: "compute",
    };
  }
  return {
    provider: "Cloud",
    logo: "cloud",
    service: "Cloud Service",
    title: actionType,
    description: "Cloud optimization and rightsizing policy.",
    category: "compute",
  };
}

export default function SavingsPage() {
  const { data, isLoading } = useSavings();
  const approveActionMutation = useApproveAction();
  const [selectedCategory, setSelectedCategory] = useState<"all" | "cloud" | "ai" | "storage">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStage, setActiveStage] = useState<"all" | "identified" | "approved" | "verified">("all");

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
  const realizedPct = Math.round((totalRealized / (grandTotalSavings || 1)) * 100);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const meta = getActionMeta(e.action_type);
      const isVer = e.status === "verified" || e.status === "realized";
      const isApp = e.status === "approved" || e.status === "executing";
      const isIden = !isVer && !isApp;

      if (activeStage === "identified" && !isIden) return false;
      if (activeStage === "approved" && !isApp) return false;
      if (activeStage === "verified" && !isVer) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesAction = e.action_type.toLowerCase().includes(query);
        const matchesTitle = meta.title.toLowerCase().includes(query);
        const matchesDesc = meta.description.toLowerCase().includes(query);
        if (!matchesAction && !matchesTitle && !matchesDesc) return false;
      }
      if (selectedCategory === "ai" && meta.category !== "ai") return false;
      if (selectedCategory === "cloud" && meta.category !== "compute") return false;
      if (selectedCategory === "storage" && meta.category !== "storage") return false;
      return true;
    });
  }, [entries, searchQuery, selectedCategory, activeStage]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white">
      <Topbar title="Savings Pipeline" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto select-none">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
              <span>Savings Realization</span>
            </h1>
            <p className="text-xs text-zinc-400 font-sans mt-1">
              Linear 3-stage optimization pipeline: Discovery &rarr; Approval &rarr; Verified billing impact.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Total Opportunity</span>
              <span className="text-xl font-bold font-mono text-white">${formatNumber(grandTotalSavings)}<span className="text-xs font-normal text-zinc-500">/mo</span></span>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Realized</span>
              <span className="text-xl font-bold font-mono text-zinc-300">{realizedPct}%</span>
            </div>
          </div>
        </div>

        {/* ── 3-STEP PIPELINE CARDS (CLEAR & UNCLUTTERED) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stage 1: Identified */}
          <div 
            onClick={() => setActiveStage(activeStage === "identified" ? "all" : "identified")}
            className={cn(
              "rounded-2xl p-5 border transition-all cursor-pointer relative",
              activeStage === "identified" 
                ? "bg-zinc-900/90 border-white/40 shadow-md" 
                : "bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700"
            )}
          >
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
              <span className="flex items-center gap-1.5 uppercase font-bold text-[11px] tracking-wider text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                1. Discovered
              </span>
              <span>{identified.length} items</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white my-1">
              ${formatNumber(totalIdentified)}
              <span className="text-xs text-zinc-500 font-normal ml-1">/mo</span>
            </div>
            <p className="text-xs text-zinc-500 font-sans mt-2">
              Identified by ML analysis; awaiting team approval.
            </p>
          </div>

          {/* Stage 2: Approved */}
          <div 
            onClick={() => setActiveStage(activeStage === "approved" ? "all" : "approved")}
            className={cn(
              "rounded-2xl p-5 border transition-all cursor-pointer relative",
              activeStage === "approved" 
                ? "bg-zinc-900/90 border-white/40 shadow-md" 
                : "bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700"
            )}
          >
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
              <span className="flex items-center gap-1.5 uppercase font-bold text-[11px] tracking-wider text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-zinc-400" />
                2. Approved
              </span>
              <span>{approved.length} items</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white my-1">
              ${formatNumber(totalApproved)}
              <span className="text-xs text-zinc-500 font-normal ml-1">/mo</span>
            </div>
            <p className="text-xs text-zinc-500 font-sans mt-2">
              Queued or applying policy changes to infrastructure.
            </p>
          </div>

          {/* Stage 3: Verified */}
          <div 
            onClick={() => setActiveStage(activeStage === "verified" ? "all" : "verified")}
            className={cn(
              "rounded-2xl p-5 border transition-all cursor-pointer relative",
              activeStage === "verified" 
                ? "bg-zinc-900/90 border-white/40 shadow-md" 
                : "bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700"
            )}
          >
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
              <span className="flex items-center gap-1.5 uppercase font-bold text-[11px] tracking-wider text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-white" />
                3. Verified
              </span>
              <span>{verified.length} verified</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white my-1">
              ${formatNumber(totalRealized)}
              <span className="text-xs text-zinc-500 font-normal ml-1">/mo</span>
            </div>
            <p className="text-xs text-zinc-500 font-sans mt-2">
              Confirmed on cloud provider monthly invoices.
            </p>
          </div>
        </div>

        {/* ── SAVINGS ACTIONS (UNCLUTTERED, DIRECT STRUCTURE) ── */}
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono text-white">
                Optimization Policies
              </span>
              <span className="text-xs font-mono text-zinc-500">
                ({filteredEntries.length})
              </span>
              {activeStage !== "all" && (
                <button
                  type="button"
                  onClick={() => setActiveStage("all")}
                  className="text-[11px] font-mono text-zinc-400 underline hover:text-white ml-2 cursor-pointer"
                >
                  Clear stage filter
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Category Filter */}
              <div className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-full text-xs font-mono">
                {[
                  { id: "all", label: "All" },
                  { id: "cloud", label: "Compute" },
                  { id: "ai", label: "AI Models" },
                  { id: "storage", label: "Storage" },
                ].map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[11px] font-mono transition-colors cursor-pointer",
                        isActive
                          ? "bg-zinc-800 text-white font-bold"
                          : "text-zinc-400 hover:text-zinc-200"
                      )}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Minimal Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter..."
                  className="w-36 h-8 pl-8 pr-3 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Clean Flat Action Rows (No bloated cards, clean clear flow) */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 divide-y divide-zinc-800/60 overflow-hidden">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                No optimization actions match the selected filters.
              </div>
            ) : (
              filteredEntries.map((row) => {
                const meta = getActionMeta(row.action_type);
                const isVerified = row.status === "verified" || row.status === "realized";
                const isApproved = row.status === "approved" || row.status === "executing";
                const isPending = !isVerified && !isApproved;

                return (
                  <div
                    key={row.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/40 transition-colors"
                  >
                    {/* Left: Icon & Service Info */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center p-2 shrink-0">
                        {meta.logo === "aws" && <AwsLogo className="w-5 h-5" />}
                        {meta.logo === "gcp" && <GcpCloudLogo className="w-5 h-5" />}
                        {meta.logo === "openai" && <OpenAiRosetteLogo className="w-5 h-5" />}
                        {meta.logo === "anthropic" && <AnthropicAiLogo className="w-5 h-5" />}
                        {meta.logo === "kubernetes" && <KubernetesWheelLogo className="w-5 h-5" />}
                        {meta.logo === "cloud" && <Cloud className="w-5 h-5 text-zinc-400" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-100 font-sans truncate">
                            {meta.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400">
                            {meta.service}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 font-sans mt-0.5 truncate max-w-xl">
                          {meta.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Metrics & CTA */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/60">
                      {/* Financial Impact */}
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono text-white">
                          +${formatNumber(row.savings_amount)}/mo
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          ${formatNumber(row.baseline_cost)} &rarr; ${formatNumber(row.realized_cost)}
                        </div>
                      </div>

                      {/* State Badge / Action Button */}
                      <div className="w-28 text-right">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => approveActionMutation.mutate(row.id)}
                            disabled={approveActionMutation.isPending}
                            className="w-full py-1.5 px-3 rounded-lg border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] text-white text-xs font-mono font-medium transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1"
                          >
                            <span>Approve</span>
                            <ArrowRight className="w-3 h-3 text-zinc-400" />
                          </button>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                            <Clock className="w-3 h-3" />
                            In Flight
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-300 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-zinc-400" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
