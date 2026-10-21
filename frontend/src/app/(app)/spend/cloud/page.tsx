"use client";

import React, { useState, useMemo } from "react";
import { Search, Download, CheckCircle, Tag } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import {
  MultiCloudSpendChart,
  SpendVelocityChart,
} from "@/components/charts/SpendAreaChart";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useCloudSpend } from "@/hooks/useSpend";
import type { CloudSpendRecord } from "@/types";

export default function CloudSpendPage() {
  const { data, isLoading } = useCloudSpend();
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");

  const items = data?.items ?? [];

  // Filter items dynamically
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (
        providerFilter !== "all" &&
        item.provider.toLowerCase() !== providerFilter.toLowerCase()
      ) {
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
  }, [items, providerFilter, teamFilter, search]);

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

  // Table columns styled to match the reference layout in the light palette
  const cloudColumns: Column<CloudSpendRecord>[] = [
    {
      key: "service",
      header: "Service",
      render: (val, row) => (
        <div>
          <div className="font-semibold text-[#0f172a] text-sm">{row.service}</div>
          <div className="text-xs text-slate-600 font-normal mt-0.5">
            {row.team ?? "Unallocated"}
          </div>
        </div>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      width: "110px",
      render: (val) => (
        <span
          className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-md border ${
            val === "AWS"
              ? "bg-[#FFF4E5] text-[#B45309] border-[#FDE68A]"
              : val === "GCP"
              ? "bg-[#EBF3FE] text-[#0062E0] border-[#BCD9FC]"
              : "bg-[#F0F5FD] text-[#4A607A] border-[#D6E4F5]"
          }`}
        >
          {String(val)}
        </span>
      ),
    },
    {
      key: "region",
      header: "Region",
      width: "120px",
      render: (val) => (
        <span className="font-mono text-[13px] text-slate-600 font-medium">
          {String(val)}
        </span>
      ),
    },
    {
      key: "attributed",
      header: "Attribution",
      width: "120px",
      render: (val) =>
        val ? (
          <div className="flex items-center gap-1.5 text-[13px] text-[#0D824D] font-semibold">
            <CheckCircle className="w-3.5 h-3.5 text-[#0D824D]" />
            <span>Tagged</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[13px] text-[#334155] font-medium">
            <Tag className="w-3.5 h-3.5 text-[#334155]" />
            <span>Untagged</span>
          </div>
        ),
    },
    {
      key: "spend",
      header: "Spend",
      render: (val) => (
        <span className="font-bold text-[#0f172a] cirra-metric text-sm">
          ${Number(val).toLocaleString()}
        </span>
      ),
    },
    {
      key: "priorPeriodSpend",
      header: "Prior Period",
      render: (val) => (
        <span className="text-[#475569] font-medium text-[13px] cirra-metric">
          ${Number(val).toLocaleString()}
        </span>
      ),
    },
    {
      key: "change",
      header: "Change",
      render: (val, row) => (
        <span
          className={`inline-flex items-center text-[13px] font-semibold px-2.5 py-0.5 rounded-full border shadow-xs ${
            row.changePositive
              ? "bg-[#E6F8F0] text-[#0D824D] border-[#B3ECCB]"
              : "bg-[#FEECEC] text-[#DC2626] border-[#FECACA]"
          }`}
        >
          {row.change}
        </span>
      ),
    },
    {
      key: "impactPercent",
      header: "Impact",
      render: (val) => (
        <div className="w-24">
          <div className="flex justify-between text-[13px] font-semibold text-[#0f172a] mb-1">
            <span>{val}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#EBF2FA] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0062E0] to-[#6366F1] rounded-full"
              style={{ width: `${val}%` }}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      <Topbar
        title="Cloud Spend"
        subtitle="Real-time multi-cloud telemetry normalized into FOCUS 1.0 format"
      />

      {/* Filter Bar */}
      <div className="cirra-card p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        {/* Provider pills matching reference design */}
        <div className="flex items-center gap-1.5 bg-[#F0F5FD] p-1 rounded-xl border border-[#D6E4F5]">
          {["all", "AWS", "GCP"].map((p) => {
            const active = providerFilter === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setProviderFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? "bg-[#0062E0] text-white shadow-sm shadow-[#0062E0]/20"
                    : "text-[#5A6E85] hover:text-[#0A192F] hover:bg-white/60"
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
            <Search className="w-3.5 h-3.5 text-[#7E93AB] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FOCUS resources, tags, services..."
              className="w-full h-8 pl-8 pr-3 text-sm rounded-xl border border-[#D6E4F5] bg-white text-[#0f172a] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0062E0]/20 focus:border-[#0062E0] transition-all shadow-xs"
            />
          </div>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="h-8 px-3 text-sm rounded-xl border border-[#D6E4F5] bg-white text-[#334155] font-medium focus:outline-none focus:ring-2 focus:ring-[#0062E0]/20 focus:border-[#0062E0] transition-all shadow-xs cursor-pointer"
          >
            <option value="all">All Teams</option>
            <option value="Core Platform">Core Platform</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Data Lake">Data Lake</option>
            <option value="Unallocated">Unallocated</option>
          </select>

          <button
            type="button"
            className="h-8 px-3 rounded-xl border border-[#D6E4F5] text-sm font-semibold text-[#0A192F] bg-white hover:bg-[#F0F5FD] hover:border-[#BCD4F0] flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5 text-[#5A6E85]" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Upper Charts Row: Total Multi-Cloud Spend & Spend Velocity side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Main Multi-Cloud Stacked Area Chart (8 cols) */}
        <div className="lg:col-span-8 cirra-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 pb-3 border-b border-[#EBF2FA]">
              <div>
                <h3 className="font-semibold text-[#0A192F] text-base tracking-tight">
                  Total Multi-Cloud Spend
                </h3>
                <p className="text-[13px] text-[#475569] mt-0.5">
                  Aggregated hourly billing telemetry smoothed daily
                </p>
              </div>

              {/* MTD Spend pill matching reference image top-right badge */}
              <div className="bg-[#E6F8F0] border border-[#B3ECCB] px-3.5 py-1.5 rounded-xl text-left sm:text-right w-fit">
                <div className="text-base sm:text-lg font-bold text-[#0D824D] cirra-metric leading-tight">
                  ${data ? data.totalCost.toLocaleString() : 0}
                </div>
                <div className="text-[10px] font-semibold text-[#0D824D] uppercase tracking-wider">
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

        {/* Spend Velocity Chart (4 cols) */}
        <div className="lg:col-span-4 cirra-card p-6 flex flex-col justify-between">
          <div>
            <div className="mb-3 pb-3 border-b border-[#EBF2FA]">
              <h3 className="font-semibold text-[#0A192F] text-base tracking-tight">
                Spend Velocity
              </h3>
              <p className="text-[13px] text-[#475569] mt-0.5">
                Aggregated hourly billing telemetry smoothed daily
              </p>
            </div>

            <SpendVelocityChart
              data={data?.dailyVelocity ?? []}
              loading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Cloud Table Card: FOCUS Normalized Line Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-[#0A192F] text-lg tracking-tight">
            FOCUS Normalized Line Items
          </h3>
          <span className="text-[13px] font-medium text-[#64748b] bg-white border border-[#D6E4F5] px-2.5 py-1 rounded-lg shadow-xs">
            {filteredItems.length} services found
          </span>
        </div>

        <div className="cirra-card overflow-hidden">
          <DataTable
            columns={cloudColumns}
            data={filteredItems}
            loading={isLoading}
            emptyText="No matching cloud services found"
            headerStyle={{
              fontSize: 12,
              fontWeight: 700,
              color: "#334155",
            }}
          />
        </div>
      </div>
    </div>
  );
}
