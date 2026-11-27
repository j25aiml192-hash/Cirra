"use client";

import React, { useState, useMemo } from "react";
import { Check, Search } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useSavings, useApproveAction } from "@/hooks/useSavings";
import { formatNumber } from "@/lib/utils";
import type { SavingsEntry } from "@/types";

export default function SavingsPage() {
  const { data, isLoading } = useSavings();
  const approveActionMutation = useApproveAction();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const entries: SavingsEntry[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.entries)) return data.entries;

    // Support mapped 3-bucket shape if returned by API
    const anyData = data as any;
    if (anyData.identified || anyData.approved || anyData.verified) {
      return [
        ...(anyData.identified ?? []).map((e: any) => ({
          ...e,
          status: e.status || "identified",
        })),
        ...(anyData.approved ?? []).map((e: any) => ({
          ...e,
          status: e.status || "approved",
        })),
        ...(anyData.verified ?? []).map((e: any) => ({
          ...e,
          status: e.status || "verified",
        })),
      ];
    }
    return [];
  }, [data]);

  // Three primary buckets
  const identifiedSavings = useMemo(
    () => entries.filter((e) => e.status === "identified"),
    [entries]
  );

  const approvedActions = useMemo(
    () =>
      entries.filter(
        (e) =>
          e.status === "approved" ||
          e.status === "executing" ||
          e.status === "pending_approval"
      ),
    [entries]
  );

  const verifiedSavings = useMemo(
    () =>
      entries.filter(
        (e) => e.status === "verified" || e.status === "realized"
      ),
    [entries]
  );

  // Totals calculated dynamically from data layer
  const totalRealized = useMemo(() => {
    if (
      data &&
      "total_realized_savings" in data &&
      typeof data.total_realized_savings === "number"
    ) {
      return data.total_realized_savings;
    }
    return verifiedSavings.reduce(
      (acc, curr) => acc + (Number(curr.savings_amount) || 0),
      0
    );
  }, [data, verifiedSavings]);

  const totalPipeline = useMemo(() => {
    if (
      data &&
      "total_pipeline_savings" in data &&
      typeof data.total_pipeline_savings === "number"
    ) {
      return data.total_pipeline_savings;
    }
    return [...identifiedSavings, ...approvedActions].reduce(
      (acc, curr) => acc + (Number(curr.savings_amount) || 0),
      0
    );
  }, [data, identifiedSavings, approvedActions]);

  const totalIdentified = useMemo(() => {
    return totalRealized + totalPipeline;
  }, [totalRealized, totalPipeline]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: entries.length,
      identified: identifiedSavings.length,
      approved: approvedActions.length,
      verified: verifiedSavings.length,
    };
  }, [entries.length, identifiedSavings.length, approvedActions.length, verifiedSavings.length]);

  // Filtered rows
  const filteredEntries = useMemo(() => {
    return entries.filter((row) => {
      if (statusFilter === "identified" && row.status !== "identified") {
        return false;
      }
      if (
        statusFilter === "approved" &&
        row.status !== "approved" &&
        row.status !== "executing" &&
        row.status !== "pending_approval"
      ) {
        return false;
      }
      if (
        statusFilter === "verified" &&
        row.status !== "verified" &&
        row.status !== "realized"
      ) {
        return false;
      }
      if (
        searchQuery &&
        !row.action_type.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [entries, statusFilter, searchQuery]);

  const columns: Column<SavingsEntry>[] = [
    {
      key: "action_type",
      header: "Action / Strategy",
      render: (val) => (
        <span className="font-semibold text-white text-sm leading-snug font-mono">
          {String(val)}
        </span>
      ),
    },
    {
      key: "baseline_cost",
      header: "Baseline Cost",
      render: (val) => (
        <span className="font-medium text-xs sm:text-sm text-zinc-400 font-mono tabular-nums">
          ${formatNumber(Number(val))}
        </span>
      ),
    },
    {
      key: "realized_cost",
      header: "Realized Cost",
      render: (val) => (
        <span className="font-medium text-xs sm:text-sm text-zinc-300 font-mono tabular-nums">
          ${formatNumber(Number(val))}
        </span>
      ),
    },
    {
      key: "savings_amount",
      header: "Monthly Savings",
      render: (val) => (
        <span className="font-bold text-sm sm:text-base text-white font-mono tabular-nums">
          +${formatNumber(Number(val))}/mo
        </span>
      ),
    },
    {
      key: "confidence_badge",
      header: "Confidence",
      render: (val) => (
        <Badge variant="neutral" className="text-[11px] font-semibold px-2 py-0.5 font-mono">
          {String(val)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (_val, row) => {
        if (row.status === "realized" || row.status === "verified") {
          return (
            <Badge variant="success" className="text-[11px] font-semibold px-2 py-0.5 font-mono">
              {row.status === "verified" ? "Verified" : "Realized"}
            </Badge>
          );
        }
        if (row.status === "approved" || row.status === "executing") {
          return (
            <Badge variant="info" className="text-[11px] font-semibold px-2 py-0.5 font-mono">
              {row.status === "executing" ? "Executing" : "Approved"}
            </Badge>
          );
        }
        if (row.status === "pending_approval") {
          return (
            <div className="flex items-center gap-2">
              <Badge variant="warning" className="text-[11px] font-semibold px-2 py-0.5 font-mono">
                Pending Gate
              </Badge>
              <button
                type="button"
                onClick={() => approveActionMutation.mutate(row.id)}
                disabled={approveActionMutation.isPending}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-black hover:bg-zinc-200 active:scale-95 transition-all shadow-xs flex items-center gap-1 disabled:opacity-50 font-mono cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-black" />
                Approve
              </button>
            </div>
          );
        }
        return (
          <Badge variant="neutral" className="text-[11px] font-semibold px-2 py-0.5 font-mono">
            Identified
          </Badge>
        );
      },
    },
    {
      key: "date",
      header: "Date",
      render: (val) => (
        <span className="text-xs sm:text-sm font-medium text-zinc-500 font-mono tabular-nums">
          {String(val)}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Topbar title="Savings" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
        {/* Unboxed Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 pb-2">
          {/* Total Monthly Savings */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
              Total Monthly Savings
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400 tabular-nums font-mono">
              ${formatNumber(totalIdentified)}
              <span className="text-sm font-medium text-zinc-500 ml-1">/mo</span>
            </div>
          </div>

          {/* Realized Savings */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
              Realized Savings
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums font-mono">
              ${formatNumber(totalRealized)}
            </div>
          </div>

          {/* Pipeline Opportunities */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
              Pipeline Opportunities
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-300/90 tabular-nums font-mono">
              ${formatNumber(totalPipeline)}
            </div>
          </div>

          {/* Active Opportunities */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
              Active Opportunities
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums font-mono">
              {entries.length}
            </div>
          </div>
        </div>

        {/* Table Controls & Data Ledger */}
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Rounded Pill Bar */}
            <div className="inline-flex items-center p-0.5 sm:p-1 rounded-full bg-zinc-900/90 border border-zinc-800 max-w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {[
                { id: "all", label: `All (${counts.all})` },
                { id: "identified", label: `Identified (${counts.identified})` },
                { id: "approved", label: `Approved (${counts.approved})` },
                { id: "verified", label: `Verified (${counts.verified})` },
              ].map((tab) => {
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? "bg-amber-400 text-black font-bold shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                        : "text-zinc-400 hover:text-white font-medium"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actions..."
                className="w-full h-8 pl-8 pr-3 rounded-full bg-[#09090b] border border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 transition-all font-mono"
              />
            </div>
          </div>

          {/* Savings Ledger Table */}
          <DataTable
            columns={columns}
            data={filteredEntries}
            loading={isLoading}
            emptyText="No savings opportunities found matching criteria"
            cellStyle={{ padding: "12px 16px" }}
          />
        </div>
      </main>
    </div>
  );
}
