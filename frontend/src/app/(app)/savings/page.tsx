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
        <span className="font-semibold text-[#0A192F] text-sm leading-snug">
          {String(val)}
        </span>
      ),
    },
    {
      key: "baseline_cost",
      header: "Baseline Cost",
      render: (val) => (
        <span className="font-medium text-xs sm:text-sm text-[#475569] tabular-nums">
          ${formatNumber(Number(val))}
        </span>
      ),
    },
    {
      key: "realized_cost",
      header: "Realized Cost",
      render: (val) => (
        <span className="font-medium text-xs sm:text-sm text-[#334155] tabular-nums">
          ${formatNumber(Number(val))}
        </span>
      ),
    },
    {
      key: "savings_amount",
      header: "Monthly Savings",
      render: (val) => (
        <span className="font-bold text-sm sm:text-base text-emerald-600 tabular-nums">
          +${formatNumber(Number(val))}/mo
        </span>
      ),
    },
    {
      key: "confidence_badge",
      header: "Confidence",
      render: (val) => (
        <Badge variant="indigo" className="text-[11px] font-semibold px-2 py-0.5">
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
            <Badge variant="success" className="text-[11px] font-semibold px-2 py-0.5">
              {row.status === "verified" ? "Verified" : "Realized"}
            </Badge>
          );
        }
        if (row.status === "approved" || row.status === "executing") {
          return (
            <Badge variant="info" className="text-[11px] font-semibold px-2 py-0.5">
              {row.status === "executing" ? "Executing" : "Approved"}
            </Badge>
          );
        }
        if (row.status === "pending_approval") {
          return (
            <div className="flex items-center gap-2">
              <Badge variant="warning" className="text-[11px] font-semibold px-2 py-0.5">
                Pending Gate
              </Badge>
              <button
                type="button"
                onClick={() => approveActionMutation.mutate(row.id)}
                disabled={approveActionMutation.isPending}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-[#181B20] text-white hover:bg-[#2D333B] active:scale-95 transition-all shadow-xs flex items-center gap-1 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                Approve
              </button>
            </div>
          );
        }
        return (
          <Badge variant="neutral" className="text-[11px] font-semibold px-2 py-0.5">
            Identified
          </Badge>
        );
      },
    },
    {
      key: "date",
      header: "Date",
      render: (val) => (
        <span className="text-xs sm:text-sm font-medium text-[#64748B] tabular-nums">
          {String(val)}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Topbar title="Savings" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Unboxed Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 pb-2">
          {/* Total Monthly Savings */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5A6E85]">
              Total Monthly Savings
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A192F] tabular-nums">
              ${formatNumber(totalIdentified)}
              <span className="text-sm font-medium text-[#5A6E85] ml-1">/mo</span>
            </div>
          </div>

          {/* Realized Savings */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5A6E85]">
              Realized Savings
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A192F] tabular-nums">
              ${formatNumber(totalRealized)}
            </div>
          </div>

          {/* Pipeline Opportunities */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5A6E85]">
              Pipeline Opportunities
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A192F] tabular-nums">
              ${formatNumber(totalPipeline)}
            </div>
          </div>

          {/* Active Opportunities */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5A6E85]">
              Active Opportunities
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A192F] tabular-nums">
              {entries.length}
            </div>
          </div>
        </div>

        {/* Table Controls & Data Ledger */}
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Rounded Pill Bar */}
            <div className="inline-flex items-center p-0.5 sm:p-1 rounded-full bg-[#E5EBF2] border border-[#D5E0EB] shadow-inner max-w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                    className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                      active
                        ? "bg-[#181B20] text-white font-semibold shadow-xs"
                        : "text-[#4A5E73] font-medium hover:text-[#0A192F] hover:bg-white/40"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-[#7E93AB] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actions..."
                className="w-full h-8 pl-8 pr-3 rounded-full bg-white border border-[#D6E4F5] text-xs text-[#0A192F] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0062E0]/20 focus:border-[#0062E0] transition-all shadow-xs"
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
