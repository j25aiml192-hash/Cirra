"use client";

import React, { useState, useMemo } from "react";
import { Search, Download, CheckCircle, Tag } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import {
  MultiCloudSpendChart,
  SpendVelocityChart,
} from "@/components/charts/SpendAreaChart";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCloudSpend } from "@/hooks/useSpend";
import { formatNumber } from "@/lib/utils";
import type { CloudSpendRecord } from "@/types";

const DEMO_CLOUD_SPEND_ITEMS: CloudSpendRecord[] = [
  {
    service: "Amazon Elastic Compute Cloud (EC2)",
    provider: "AWS",
    region: "us-east-1",
    attributed: true,
    spend: 24150,
    priorPeriodSpend: 22900,
    change: "+5.4%",
    changePositive: false,
    impactPercent: 28.4,
    team: "Core Platform",
    billedCost: 24150,
    effectiveCost: 24150,
  },
  {
    service: "Google Kubernetes Engine (GKE)",
    provider: "GCP",
    region: "us-central1",
    attributed: true,
    spend: 14850,
    priorPeriodSpend: 15200,
    change: "-2.3%",
    changePositive: true,
    impactPercent: 17.5,
    team: "Infrastructure",
    billedCost: 14850,
    effectiveCost: 14850,
  },
  {
    service: "Amazon Relational Database Service (RDS)",
    provider: "AWS",
    region: "us-east-1",
    attributed: true,
    spend: 12400,
    priorPeriodSpend: 11950,
    change: "+3.8%",
    changePositive: false,
    impactPercent: 14.6,
    team: "Core Platform",
    billedCost: 12400,
    effectiveCost: 12400,
  },
  {
    service: "Google Cloud Storage (Standard Tier)",
    provider: "GCP",
    region: "us-central1",
    attributed: true,
    spend: 7920,
    priorPeriodSpend: 7450,
    change: "+6.3%",
    changePositive: false,
    impactPercent: 9.3,
    team: "Data Lake",
    billedCost: 7920,
    effectiveCost: 7920,
  },
  {
    service: "Amazon Simple Storage Service (S3)",
    provider: "AWS",
    region: "us-east-1",
    attributed: true,
    spend: 6850,
    priorPeriodSpend: 6600,
    change: "+3.7%",
    changePositive: false,
    impactPercent: 8.1,
    team: "Data Lake",
    billedCost: 6850,
    effectiveCost: 6850,
  },
  {
    service: "BigQuery Analysis & Storage Slots",
    provider: "GCP",
    region: "us-central1",
    attributed: true,
    spend: 5200,
    priorPeriodSpend: 4900,
    change: "+6.1%",
    changePositive: false,
    impactPercent: 6.1,
    team: "Data Lake",
    billedCost: 5200,
    effectiveCost: 5200,
  },
  {
    service: "AWS Lambda Serverless Functions",
    provider: "AWS",
    region: "us-east-1",
    attributed: true,
    spend: 4180,
    priorPeriodSpend: 3950,
    change: "+5.8%",
    changePositive: false,
    impactPercent: 4.9,
    team: "Core Platform",
    billedCost: 4180,
    effectiveCost: 4180,
  },
  {
    service: "Amazon CloudFront Global Edge",
    provider: "AWS",
    region: "global",
    attributed: true,
    spend: 3650,
    priorPeriodSpend: 3800,
    change: "-3.9%",
    changePositive: true,
    impactPercent: 4.3,
    team: "Infrastructure",
    billedCost: 3650,
    effectiveCost: 3650,
  },
  {
    service: "AWS Application Load Balancer",
    provider: "AWS",
    region: "us-east-1",
    attributed: true,
    spend: 3000,
    priorPeriodSpend: 2950,
    change: "+1.7%",
    changePositive: false,
    impactPercent: 3.5,
    team: "Infrastructure",
    billedCost: 3000,
    effectiveCost: 3000,
  },
  {
    service: "Google Cloud Virtual Network & Interconnect",
    provider: "GCP",
    region: "us-central1",
    attributed: false,
    spend: 2800,
    priorPeriodSpend: 2650,
    change: "+5.7%",
    changePositive: false,
    impactPercent: 3.3,
    team: "Unallocated",
    billedCost: 2800,
    effectiveCost: 2800,
  },
];

const DEMO_DAILY_VELOCITY = [
  { date: "2026-10-15", amount: 2750 },
  { date: "2026-10-16", amount: 2810 },
  { date: "2026-10-17", amount: 2690 },
  { date: "2026-10-18", amount: 2720 },
  { date: "2026-10-19", amount: 2850 },
  { date: "2026-10-20", amount: 2890 },
  { date: "2026-10-21", amount: 2910 },
  { date: "2026-10-22", amount: 2870 },
  { date: "2026-10-23", amount: 2820 },
  { date: "2026-10-24", amount: 2790 },
  { date: "2026-10-25", amount: 2830 },
  { date: "2026-10-26", amount: 2860 },
  { date: "2026-10-27", amount: 2880 },
  { date: "2026-10-28", amount: 2920 },
  { date: "2026-10-29", amount: 2950 },
  { date: "2026-10-30", amount: 2890 },
  { date: "2026-10-31", amount: 2840 },
  { date: "2026-11-01", amount: 2780 },
  { date: "2026-11-02", amount: 2830 },
  { date: "2026-11-03", amount: 2870 },
  { date: "2026-11-04", amount: 2890 },
  { date: "2026-11-05", amount: 2910 },
  { date: "2026-11-06", amount: 2930 },
  { date: "2026-11-07", amount: 2880 },
  { date: "2026-11-08", amount: 2850 },
  { date: "2026-11-09", amount: 2890 },
  { date: "2026-11-10", amount: 2940 },
  { date: "2026-11-11", amount: 2970 },
  { date: "2026-11-12", amount: 2990 },
  { date: "2026-11-13", amount: 3020 },
];

export default function CloudSpendPage() {
  const { data, isLoading } = useCloudSpend();
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");

  const items = useMemo(() => {
    if (data?.items && data.items.length > 0) {
      return data.items;
    }
    return DEMO_CLOUD_SPEND_ITEMS;
  }, [data?.items]);

  const velocityData = useMemo(() => {
    if (data?.dailyVelocity && data.dailyVelocity.length > 0) {
      return data.dailyVelocity;
    }
    return DEMO_DAILY_VELOCITY;
  }, [data?.dailyVelocity]);

  const totalCost = useMemo(() => {
    if (data?.totalCost && data.totalCost > 0) {
      return data.totalCost;
    }
    return items.reduce((sum, i) => sum + i.spend, 0);
  }, [data?.totalCost, items]);

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

  // Derive multi-cloud stacked time series from velocityData & items ratio
  const multiCloudData = useMemo(() => {
    const awsTotal = items
      .filter((i) => i.provider === "AWS")
      .reduce((sum, i) => sum + i.spend, 0);
    const gcpTotal = items
      .filter((i) => i.provider === "GCP")
      .reduce((sum, i) => sum + i.spend, 0);
    const total = awsTotal + gcpTotal || 1;
    const awsRatio = awsTotal / total;

    return velocityData.map((pt) => {
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
  }, [velocityData, items, providerFilter]);

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
          ${formatNumber(Number(val))}
        </span>
      ),
    },
    {
      key: "priorPeriodSpend",
      header: "Prior Period",
      render: (val) => (
        <span className="text-[#475569] font-medium text-[13px] cirra-metric">
          ${formatNumber(Number(val))}
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
    <div className="min-h-screen">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          {/* Provider pills matching reference design */}
          <div className="inline-flex items-center p-1 rounded-full bg-[#E5EBF2] border border-[#D5E0EB] shadow-inner overflow-x-auto">
            {["all", "AWS", "GCP"].map((p) => {
              const active = providerFilter === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProviderFilter(p)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? "bg-[#181B20] text-white shadow-xs"
                      : "text-[#4A5E73] font-medium hover:text-[#0A192F] hover:bg-white/40"
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
              <Search className="w-3.5 h-3.5 text-[#7E93AB] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resources..."
                className="w-full h-9 pl-9 pr-4 text-xs sm:text-sm rounded-full border border-[#D6E4F5] bg-white text-[#0f172a] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0062E0]/20 focus:border-[#0062E0] transition-all shadow-xs"
              />
            </div>

            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="h-9 px-4 text-xs sm:text-sm rounded-full border border-[#D6E4F5] bg-white text-[#334155] font-medium focus:outline-none focus:ring-2 focus:ring-[#0062E0]/20 focus:border-[#0062E0] transition-all shadow-xs cursor-pointer"
            >
            <option value="all">All Teams</option>
            <option value="Core Platform">Core Platform</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Data Lake">Data Lake</option>
            <option value="Unallocated">Unallocated</option>
          </select>

          <button
            type="button"
            onClick={handleExport}
            className="h-8 px-3 rounded-xl border border-[#D6E4F5] text-sm font-semibold text-[#0A192F] bg-white hover:bg-[#F0F5FD] hover:border-[#BCD4F0] flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Export filtered line items to CSV"
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
                  ${formatNumber(totalCost)}
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
              data={velocityData}
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
      </main>
    </div>
  );
}
