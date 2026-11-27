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
  Cloud
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { useSavings, useApproveAction } from "@/hooks/useSavings";
import { formatNumber } from "@/lib/utils";
import type { SavingsEntry } from "@/types";

export default function SavingsPage() {
  const { data, isLoading } = useSavings();
  const approveActionMutation = useApproveAction();
  const [selectedCategory, setSelectedCategory] = useState<"all" | "cloud" | "ai" | "storage">("all");
  const [searchQuery, setSearchQuery] = useState("");

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
      if (searchQuery && !e.action_type.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedCategory === "ai" && !e.action_type.toLowerCase().includes("caching") && !e.action_type.toLowerCase().includes("model")) {
        return false;
      }
      if (selectedCategory === "cloud" && !e.action_type.toLowerCase().includes("m6i") && !e.action_type.toLowerCase().includes("aws") && !e.action_type.toLowerCase().includes("kubernetes")) {
        return false;
      }
      if (selectedCategory === "storage" && !e.action_type.toLowerCase().includes("ebs") && !e.action_type.toLowerCase().includes("bigquery")) {
        return false;
      }
      return true;
    });
  }, [entries, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500 selection:text-black">
      <Topbar title="Savings Pipeline" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto select-none">
        {/* ── 1. UNCLUTTERED FLOW SECTION: DIRECT ON BACKGROUND (NO SURROUNDING BOX) ── */}
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

            <div className="relative overflow-hidden flex items-baseline gap-2 bg-white/[0.08] border border-white/20 backdrop-blur-xl px-4 py-2 rounded-full self-start sm:self-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
              <div className="absolute top-0 inset-x-2 h-[50%] rounded-t-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
              <span className="text-xs font-mono text-zinc-300 font-medium relative z-10">Total Opportunity:</span>
              <span className="text-base font-black font-mono text-white relative z-10">${formatNumber(grandTotalSavings)}/mo</span>
            </div>
          </div>

          {/* 3 Step Connected Stage Cards in Warm White / Ivory Theme */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            {/* Stage 1: Identified */}
            <div className="rounded-2xl bg-[#faf8f5] border border-[#e5e0d8] p-5 sm:p-6 space-y-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-[#d6cfc4]">
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
            <div className="rounded-2xl bg-[#faf8f5] border border-[#e5e0d8] p-5 sm:p-6 space-y-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-[#d6cfc4]">
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
            <div className="rounded-2xl bg-[#faf8f5] border border-[#e5e0d8] p-5 sm:p-6 space-y-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-[#d6cfc4]">
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
            <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden flex p-0.5 border border-zinc-800">
              <div
                style={{ width: `${(totalRealized / (grandTotalSavings || 1)) * 100}%` }}
                className="bg-[#faf8f5] rounded-full h-full shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-500"
              />
              <div
                style={{ width: `${(totalApproved / (grandTotalSavings || 1)) * 100}%` }}
                className="bg-[#a1a1aa] rounded-full h-full transition-all duration-500 ml-1"
              />
            </div>
          </div>
        </div>

        {/* ── 2. SAVINGS ACTIONS TABLE (CLEAR, SPACIOUS & READABLE) ── */}
        <div className="rounded-2xl bg-[#09090b] border border-zinc-800/80 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-mono text-base font-bold text-white">Savings Actions & Policies</h3>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                {filteredEntries.length} live optimization opportunities mapped from cloud & AI infrastructure
              </p>
            </div>

            {/* Filter Buttons & Search */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-xs font-mono shadow-inner">
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
                      className={`relative overflow-hidden px-3 py-1 rounded-full transition-all cursor-pointer ${
                        isActive
                          ? "text-white font-bold border border-white/25 bg-white/[0.14] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-0 inset-x-1 h-[45%] rounded-t-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                      )}
                      <span className="relative z-10">{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter action..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Clean Spacious Table */}
          <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-black/40">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Action / Strategy</th>
                  <th className="py-3 px-4">Baseline Cost</th>
                  <th className="py-3 px-4">Optimized Cost</th>
                  <th className="py-3 px-4">Monthly Savings</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {filteredEntries.map((row) => {
                  const isVerified = row.status === "verified" || row.status === "realized";
                  const isApproved = row.status === "approved" || row.status === "executing";

                  return (
                    <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Title */}
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${isVerified
                            ? "bg-emerald-400"
                            : isApproved
                              ? "bg-cyan-400"
                              : "bg-amber-400"
                            }`}
                        />
                        <span className="truncate max-w-md">{row.action_type}</span>
                      </td>

                      {/* Baseline */}
                      <td className="py-3.5 px-4 text-zinc-400">
                        ${formatNumber(row.baseline_cost)}
                      </td>

                      {/* Optimized */}
                      <td className="py-3.5 px-4 text-zinc-300">
                        ${formatNumber(row.realized_cost)}
                      </td>

                      {/* Monthly Savings */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-400 text-sm">
                          +${formatNumber(row.savings_amount)}/mo
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${isVerified
                            ? "bg-emerald-950/60 border border-emerald-500/30 text-emerald-400"
                            : isApproved
                              ? "bg-cyan-950/60 border border-cyan-500/30 text-cyan-400"
                              : "bg-amber-950/60 border border-amber-500/30 text-amber-400"
                            }`}
                        >
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
                            className="group relative px-3.5 py-1 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 inline-flex items-center justify-center text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer"
                          >
                            <div className="absolute top-0 inset-x-1.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                            <span className="relative z-10">Approve</span>
                          </button>
                        ) : (
                          <span className="text-xs text-zinc-500 font-mono">
                            {isVerified ? "Active" : "In Flight"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
