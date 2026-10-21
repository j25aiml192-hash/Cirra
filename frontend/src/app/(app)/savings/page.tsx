"use client";

import React, { useState, useMemo } from "react";
import { Check, Search } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useSavings } from "@/hooks/useSavings";
import { formatNumber } from "@/lib/utils";
import type { SavingsEntry } from "@/types";

export default function SavingsPage() {
  const { data, isLoading, approveAction } = useSavings();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const entries = useMemo(() => data?.entries ?? [], [data?.entries]);

  // Totals calculated dynamically from backend data layer
  const totalIdentified = useMemo(() => {
    if (data?.total_realized_savings !== undefined && data?.total_pipeline_savings !== undefined) {
      return data.total_realized_savings + data.total_pipeline_savings;
    }
    return entries.reduce((acc, curr) => acc + curr.savings_amount, 0);
  }, [data, entries]);

  const totalRealized = useMemo(() => {
    if (data?.total_realized_savings !== undefined) {
      return data.total_realized_savings;
    }
    return entries
      .filter((e) => e.status === "realized")
      .reduce((acc, curr) => acc + curr.savings_amount, 0);
  }, [data, entries]);

  const totalPipeline = useMemo(() => {
    if (data?.total_pipeline_savings !== undefined) {
      return data.total_pipeline_savings;
    }
    return entries
      .filter((e) => e.status !== "realized")
      .reduce((acc, curr) => acc + curr.savings_amount, 0);
  }, [data, entries]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: entries.length,
      realized: entries.filter((e) => e.status === "realized").length,
      pending_approval: entries.filter((e) => e.status === "pending_approval").length,
      approved: entries.filter((e) => e.status === "approved").length,
      identified: entries.filter((e) => e.status === "identified").length,
    };
  }, [entries]);

  // Filtered rows
  const filteredEntries = useMemo(() => {
    return entries.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) {
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
        if (row.status === "realized") {
          return (
            <Badge variant="success" className="text-[11px] font-semibold px-2 py-0.5">
              Realized
            </Badge>
          );
        }
        if (row.status === "approved") {
          return (
            <Badge variant="info" className="text-[11px] font-semibold px-2 py-0.5">
              Approved
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
                onClick={() => approveAction(row.id)}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-[#181B20] text-white hover:bg-[#2D333B] active:scale-95 transition-all shadow-xs flex items-center gap-1"
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
        {/* Unboxed Key Metrics (Refined font sizes, clean direct typography) */}
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
            {/* Rounded Pill Bar (Refined Apple pill size) */}
            <div className="inline-flex items-center p-0.5 sm:p-1 rounded-full bg-[#E5EBF2] border border-[#D5E0EB] shadow-inner max-w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {[
                { id: "all", label: `All (${counts.all})` },
                { id: "realized", label: `Realized (${counts.realized})` },
                { id: "pending_approval", label: `Pending (${counts.pending_approval})` },
                { id: "approved", label: `Approved (${counts.approved})` },
                { id: "identified", label: `Identified (${counts.identified})` },
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

            {/* Search Input (Pill Shaped) */}
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
