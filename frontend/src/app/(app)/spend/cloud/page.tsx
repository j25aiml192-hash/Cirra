"use client";

import React, { useState } from "react";
import { Search, Download, CheckCircle, Tag, Filter } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { SpendAreaChart } from "@/components/charts/SpendAreaChart";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useCloudSpend } from "@/hooks/useSpend";
import type { CloudSpendRecord } from "@/types";

export default function CloudSpendPage() {
  const { data, isLoading } = useCloudSpend();
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");

  const items = data?.items ?? [];

  const filteredItems = items.filter((item) => {
    if (providerFilter !== "all" && item.provider.toLowerCase() !== providerFilter.toLowerCase()) {
      return false;
    }
    if (teamFilter !== "all" && item.team !== teamFilter) {
      return false;
    }
    if (search && !item.service.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const cloudColumns: Column<CloudSpendRecord>[] = [
    {
      key: "service",
      header: "Service",
      render: (val, row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.service}</div>
          <div className="text-[11px] text-slate-400 font-mono">{row.team ?? "Unallocated"}</div>
        </div>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      width: "110px",
      render: (val) => (
        <Badge variant={val === "AWS" ? "warning" : val === "GCP" ? "info" : "neutral"}>
          {String(val)}
        </Badge>
      ),
    },
    {
      key: "region",
      header: "Region",
      width: "120px",
      render: (val) => (
        <span className="font-mono text-xs text-slate-500">{String(val)}</span>
      ),
    },
    {
      key: "attributed",
      header: "Attribution",
      width: "120px",
      render: (val) =>
        val ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Tagged</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Tag className="w-3.5 h-3.5" />
            <span>Untagged</span>
          </div>
        ),
    },
    {
      key: "spend",
      header: "Spend",
      render: (val) => (
        <span className="font-bold text-slate-900">
          ${Number(val).toLocaleString()}
        </span>
      ),
    },
    {
      key: "priorPeriodSpend",
      header: "Prior Period",
      render: (val) => (
        <span className="text-slate-500 font-medium">
          ${Number(val).toLocaleString()}
        </span>
      ),
    },
    {
      key: "change",
      header: "Change",
      render: (val, row) => (
        <Badge variant={row.changePositive ? "success" : "danger"}>
          {row.change}
        </Badge>
      ),
    },
    {
      key: "impactPercent",
      header: "Impact",
      render: (val) => (
        <div className="w-24">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>{val}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${val}%` }}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <Topbar title="Cloud Spend" subtitle="Real-time multi-cloud telemetry normalized into FOCUS 1.0 format" />

      {/* Filter Bar (Glass card) */}
      <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm border border-black/5 flex flex-wrap items-center justify-between gap-4">
        {/* Provider pills */}
        <div className="flex items-center gap-2">
          {["all", "AWS", "GCP"].map((p) => {
            const active = providerFilter === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setProviderFilter(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p === "all" ? "All Providers" : p}
              </button>
            );
          })}
        </div>

        {/* Search & Team dropdown */}
        <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter service..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-400"
            />
          </div>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:border-indigo-400"
          >
            <option value="all">All Teams</option>
            <option value="Core Platform">Core Platform</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Data Lake">Data Lake</option>
            <option value="Unallocated">Unallocated</option>
          </select>

          <button
            type="button"
            className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Spend Area Chart Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Daily Cloud Spend Velocity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Aggregated hourly billing telemetry smoothed daily</p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            ${data ? data.totalCost.toLocaleString() : 0} MTD
          </span>
        </div>
        <SpendAreaChart data={data?.dailyVelocity ?? []} loading={isLoading} />
      </div>

      {/* Cloud Table Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-slate-900 text-base">FOCUS Normalized Line Items</h3>
          <span className="text-xs text-slate-400">{filteredItems.length} services found</span>
        </div>
        <DataTable
          columns={cloudColumns}
          data={filteredItems}
          loading={isLoading}
          emptyText="No matching cloud services found"
        />
      </div>
    </div>
  );
}
