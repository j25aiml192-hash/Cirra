"use client";

import React, { useState, useMemo } from "react";
import { Search, Download, CheckCircle, Tag } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import {
  MultiCloudSpendChart,
  SpendVelocityChart,
} from "@/components/charts/SpendAreaChart";
import { SpendHeatmapChart } from "@/components/charts/SpendHeatmapChart";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCloudSpend } from "@/hooks/useSpend";
import { formatNumber } from "@/lib/utils";
import type { CloudSpendRecord } from "@/types";
import { ProviderLogo } from "@/components/ui/provider-logos";

export default function CloudSpendPage() {
  const { data, isLoading } = useCloudSpend();
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");

  const items = data?.items ?? [];

  // Filter items dynamically (hooks must be called before any conditional return)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (
        providerFilter !== "all" &&
        item.provider.toLowerCase() !== providerFilter.toLowerCase()
      ) {
        return false;
      }
      if (teamFilter !== "all" && item.team?.toLowerCase() !== teamFilter.toLowerCase()) {
        return false;
      }
      if (search && !item.service.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [items, providerFilter, teamFilter, search]);

  const handleExport = () => {
    const headers = ["Service", "Provider", "Region", "Attribution", "Spend", "PriorPeriodSpend", "Change", "Team"];
    const rows = filteredItems.map((i) => [
      `"${i.service}"`,
      `"${i.provider}"`,
      `"${i.region}"`,
      i.attributed ? "Tagged" : "Untagged",
      i.spend,
      i.priorPeriodSpend,
      `"${i.change}"`,
      `"${i.team || "Unallocated"}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cirra_cloud_spend_${providerFilter}_${teamFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Derive multi-cloud stacked time series from dailyVelocity & items ratio
  const multiCloudData = useMemo(() => {
    if (!data?.dailyVelocity) return [];

    const awsTotal = items
      .filter((i) => i.provider === "AWS")
      .reduce((sum, i) => sum + i.spend, 0);
    const gcpTotal = items
      .filter((i) => i.provider === "GCP")
      .reduce((sum, i) => sum + i.spend, 0);
    const total = awsTotal + gcpTotal || 1;
    const awsRatio = awsTotal / total;

    return data.dailyVelocity.map((pt) => {
      let aws = Math.round(pt.amount * awsRatio);
      let gcp = pt.amount - aws;

      if (providerFilter.toLowerCase() === "aws") {
        aws = pt.amount;
        gcp = 0;
      } else if (providerFilter.toLowerCase() === "gcp") {
        aws = 0;
        gcp = pt.amount;
      }

      return {
        date: pt.date,
        amount: pt.amount,
        aws,
        gcp,
      };
    });
  }, [data?.dailyVelocity, items, providerFilter]);

  // Table columns redesigned with app brand logos & modern FinOps aesthetics
  const cloudColumns: Column<CloudSpendRecord>[] = [
    {
      key: "service",
      header: "Service",
      render: (val, row) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-xl bg-zinc-900/90 border border-zinc-800/90 flex items-center justify-center p-1.5 shrink-0 shadow-inner group-hover:border-zinc-700">
            <ProviderLogo
              provider={row.provider}
              name={row.service}
              size={20}
              className="shrink-0"
            />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[#FFFFFF] text-sm tracking-tight truncate">
              {row.service}
            </div>
            <div className="text-xs text-zinc-400 font-mono mt-0.5 flex items-center gap-1.5">
              <span>{row.team ?? "Unallocated"}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-500 font-sans">FOCUS 1.0</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      width: "120px",
      render: (val) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-full border bg-zinc-900/90 text-[#FFFFFF] border-zinc-800/90 shadow-sm">
          <ProviderLogo provider={String(val)} size={13} className="shrink-0" />
          <span>{String(val)}</span>
        </span>
      ),
    },
    {
      key: "region",
      header: "Region",
      width: "125px",
      render: (val) => (
        <span className="font-mono text-xs text-zinc-300 font-medium px-2 py-0.5 rounded bg-zinc-900/60 border border-zinc-800/70">
          {String(val)}
        </span>
      ),
    },
    {
      key: "attributed",
      header: "Attribution",
      width: "110px",
      render: (val) =>
        val ? (
          <span className="text-xs font-mono font-medium text-emerald-400">
            Tagged
          </span>
        ) : (
          <span className="text-xs font-mono font-medium text-zinc-400">
            Untagged
          </span>
        ),
    },
    {
      key: "spend",
      header: "Spend",
      render: (val) => (
        <span className="font-bold text-[#FFFFFF] font-mono text-sm tracking-tight">
          ${formatNumber(Number(val))}
        </span>
      ),
    },
    {
      key: "priorPeriodSpend",
      header: "Prior Period",
      render: (val) => (
        <span className="text-zinc-400 font-medium text-xs font-mono">
          ${formatNumber(Number(val))}
        </span>
      ),
    },
    {
      key: "change",
      header: "Change",
      width: "110px",
      render: (val, row) => {
        const isDecrease = String(val).startsWith("-") || row.changePositive;
        return (
          <span
            className={`inline-flex items-center text-xs font-mono font-bold px-2 py-0.5 rounded border ${
              isDecrease
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/50"
                : "bg-rose-950/30 text-rose-300 border-rose-800/40"
            }`}
          >
            {row.change}
          </span>
        );
      },
    },
    {
      key: "impactPercent",
      header: "Impact",
      width: "130px",
      render: (val) => {
        const IMPACT_COLORS = [
          "#21a387", // Jade Green
          "#275966", // Slate Teal
          "#e5431c", // Coral Red
          "#f5bb1d", // Sunflower Gold
          "#f4981e", // Tangerine Amber
        ];
        const numVal = Number(val) || 0;
        const color =
          numVal > 20
            ? IMPACT_COLORS[0]
            : numVal > 10
            ? IMPACT_COLORS[1]
            : numVal > 5
            ? IMPACT_COLORS[2]
            : IMPACT_COLORS[3];

        return (
          <div className="w-28 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-[#FFFFFF]">
              <span>{numVal.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-800/90 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 shadow-sm"
                style={{
                  width: `${Math.min(100, Math.max(8, numVal * 3))}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          {/* Provider pills */}
          <div className="inline-flex items-center p-1 rounded-full bg-zinc-900/90 border border-zinc-800 overflow-x-auto">
            {["all", "AWS", "GCP"].map((p) => {
              const active = providerFilter === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProviderFilter(p)}
                  className={`px-4 sm:px-5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-emerald-600 text-white font-bold shadow-[0_0_12px_rgba(5,150,105,0.4)]"
                      : "text-zinc-400 hover:text-white font-medium"
                  }`}
                >
                  {p === "all" ? "All Providers" : p}
                </button>
              );
            })}
          </div>

          {/* Search, Team dropdown & Export */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl justify-end">
            <div className="relative min-w-[180px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resources..."
                className="w-full h-9 pl-9 pr-4 text-xs sm:text-sm rounded-full border border-zinc-800 bg-[#09090b] text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
              />
            </div>

            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="h-9 px-4 text-xs sm:text-sm rounded-full border border-zinc-800 bg-[#09090b] text-zinc-300 font-medium focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer font-mono"
            >
              <option value="all" className="bg-[#09090b] text-white">All Teams</option>
              <option value="Core Platform" className="bg-[#09090b] text-white">Core Platform</option>
              <option value="Infrastructure" className="bg-[#09090b] text-white">Infrastructure</option>
              <option value="Data Lake" className="bg-[#09090b] text-white">Data Lake</option>
              <option value="Unallocated" className="bg-[#09090b] text-white">Unallocated</option>
            </select>

            <button
              type="button"
              onClick={handleExport}
              className="h-9 px-4 rounded-full text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer shadow-[0_0_12px_rgba(5,150,105,0.3)]"
              title="Export filtered line items to CSV"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Export</span>
            </button>
          </div>
      </div>

      {/* 1. FIRST: Spend Velocity & Ingestion Heatmap Matrix */}
      <SpendHeatmapChart
        title="$85,420 Spend Velocity"
        subtitle="1,648 telemetry events ingested · ±4.2% daily velocity stability · 34 day streak"
      />

      {/* 2. THEN: Multi-Cloud Spend Trajectory Chart */}
      <div className="bg-[#09090b] border border-zinc-800/80 hover:border-emerald-500/30 transition-colors rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 pb-3 border-b border-zinc-800/80">
            <div>
              <h3 className="font-semibold text-white text-base tracking-tight font-mono">
                Total Multi-Cloud Spend
              </h3>
              <p className="text-[13px] text-zinc-400 mt-0.5">
                Aggregated hourly billing telemetry smoothed daily
              </p>
            </div>

            {/* MTD Spend pill */}
            <div className="bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-left sm:text-right w-fit">
              <div className="text-base sm:text-lg font-bold text-emerald-400 cirra-metric leading-tight font-mono">
                ${data ? formatNumber(data.totalCost) : 0}
              </div>
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                Total Spend (MTD)
              </div>
            </div>
          </div>

          <MultiCloudSpendChart
            data={multiCloudData}
            loading={isLoading}
            selectedProvider={providerFilter}
          />
        </div>
      </div>

      {/* Cloud Table Card: FOCUS Normalized Line Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-white text-lg tracking-tight font-mono">
            FOCUS Normalized Line Items
          </h3>
          <span className="text-[12px] font-mono font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
            {filteredItems.length} services found
          </span>
        </div>

        <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl overflow-hidden">
          <DataTable
            columns={cloudColumns}
            data={filteredItems}
            loading={isLoading}
            emptyText="No matching cloud services found"
          />
        </div>
      </div>
      </main>
    </div>
  );
}
