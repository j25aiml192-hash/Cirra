"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Download,
  CheckCircle,
  Tag,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import {
  MultiCloudSpendChart,
  SpendVelocityChart,
} from "@/components/charts/SpendAreaChart";
import { SpendHeatmapChart } from "@/components/charts/SpendHeatmapChart";
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
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

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
      if (teamFilter !== "all" && item.team?.toLowerCase() !== teamFilter.toLowerCase()) {
        return false;
      }
      if (search && !item.service.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [items, providerFilter, teamFilter, search]);

  const totalCloudSpend = useMemo(() => {
    return filteredItems.reduce((acc, curr) => acc + (curr.spend || 0), 0);
  }, [filteredItems]);

  // Group items by App / Cloud Provider (Categorized structure as requested)
  const groupedApps = useMemo(() => {
    const map: Record<
      string,
      {
        provider: string;
        title: string;
        items: CloudSpendRecord[];
        totalSpend: number;
        priorTotalSpend: number;
      }
    > = {};

    filteredItems.forEach((item) => {
      const key = item.provider || "Other";
      if (!map[key]) {
        const title =
          key.toUpperCase() === "AWS"
            ? "Amazon Web Services (AWS)"
            : key.toUpperCase() === "GCP"
            ? "Google Cloud Platform (GCP)"
            : key.toUpperCase() === "AZURE"
            ? "Microsoft Azure"
            : `${key} Cloud Services`;

        map[key] = {
          provider: key,
          title,
          items: [],
          totalSpend: 0,
          priorTotalSpend: 0,
        };
      }
      map[key].items.push(item);
      map[key].totalSpend += item.spend || 0;
      map[key].priorTotalSpend += item.priorPeriodSpend || 0;
    });

    return Object.values(map);
  }, [filteredItems]);

  const toggleGroup = (provider: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  const handleExport = () => {
    const headers = [
      "Service",
      "Provider",
      "Region",
      "Attribution",
      "Spend",
      "PriorPeriodSpend",
      "Change",
      "Team",
    ];
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
    link.setAttribute(
      "download",
      `cirra_cloud_spend_${providerFilter}_${teamFilter}.csv`
    );
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

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
        {/* Filter Bar (Liquid Glass Soft White/Stone Palette) */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          {/* Provider Pills in Glass */}
          <div className="inline-flex items-center p-1 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 overflow-x-auto shadow-inner">
            {["all", "AWS", "GCP"].map((p) => {
              const active = providerFilter === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProviderFilter(p)}
                  className={`relative px-4 sm:px-5 py-1.5 rounded-full text-xs font-mono transition-all whitespace-nowrap cursor-pointer overflow-hidden ${
                    active
                      ? "text-white font-bold bg-white/[0.18] border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.3)] backdrop-blur-md"
                      : "text-zinc-400 hover:text-white font-medium hover:bg-white/[0.06]"
                  }`}
                >
                  {active && (
                    <div className="absolute top-0 inset-x-1 h-[50%] rounded-t-full bg-gradient-to-b from-white/50 to-transparent pointer-events-none" />
                  )}
                  <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">{p === "all" ? "All Apps" : p}</span>
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
                placeholder="Search services or apps..."
                className="w-full h-9 pl-9 pr-4 text-xs rounded-full border border-zinc-800 bg-[#09090b] text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-all font-mono"
              />
            </div>

            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="h-9 px-4 text-xs rounded-full border border-zinc-800 bg-[#09090b] text-zinc-300 font-medium focus:outline-none focus:border-zinc-700 transition-all cursor-pointer font-mono"
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
              className="group relative h-9 px-4 rounded-full text-xs font-mono font-medium text-white bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 backdrop-blur-xl flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] overflow-hidden"
              title="Export filtered line items to CSV"
            >
              <div className="absolute top-0 inset-x-1.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
              <Download className="w-3.5 h-3.5 text-zinc-200 relative z-10" />
              <span className="relative z-10">Export</span>
            </button>
          </div>
        </div>

        {/* 1. FIRST: Spend Velocity & Ingestion Heatmap Matrix */}
        <SpendHeatmapChart
          title="$85,420 Spend Velocity"
          subtitle="1,648 telemetry events ingested · ±4.2% daily velocity stability · 34 day streak"
        />

        {/* 2. THEN: Multi-Cloud Spend Trajectory Chart */}
        <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2 pb-2.5 border-b border-zinc-800/80">
              <div>
                <h3 className="font-semibold text-white text-base tracking-tight font-display">
                  Multi-Cloud Spend
                </h3>
                <p className="text-xs text-zinc-400 font-sans">
                  Daily aggregated billing telemetry across clouds
                </p>
              </div>

              {/* MTD Spend */}
              <div className="text-left sm:text-right">
                <div className="text-lg font-bold text-white font-mono leading-none">
                  ${data ? formatNumber(data.totalCost) : 0}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono mt-0.5">
                  MTD Total
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

        {/* 3. CATEGORIZED INTO APPS (NO TEXT BOXES, SOFT WHITE / STONE GREY PALETTE) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-white text-lg tracking-tight font-mono flex items-center gap-2">
              <span>App &amp; Cloud Infrastructure Spend</span>
              <span className="text-xs font-mono text-zinc-400 font-normal">
                ({filteredItems.length} services across {groupedApps.length} apps)
              </span>
            </h3>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#09090b] border border-zinc-800/80 text-center">
              <EmptyState
                title="No matching services found"
                description="Try clearing your search query or adjusting the provider/team filter."
              />
            </div>
          ) : (
            <div className="space-y-5">
              {groupedApps.map((group) => {
                const isCollapsed = !!collapsedGroups[group.provider];
                const groupPct =
                  totalCloudSpend > 0
                    ? ((group.totalSpend / totalCloudSpend) * 100).toFixed(1)
                    : "0.0";

                return (
                  <div
                    key={group.provider}
                    className="rounded-2xl border border-zinc-800/80 bg-[#09090b]/95 shadow-2xl backdrop-blur-xl overflow-hidden"
                  >
                    {/* Category Header with App Logo (Image 1 Style) */}
                    <div
                      onClick={() => toggleGroup(group.provider)}
                      className="px-5 py-3.5 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/90 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* App Logo squircle */}
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                          <ProviderLogo
                            provider={group.provider}
                            name={group.title}
                            size={18}
                          />
                        </div>

                        <div className="min-w-0 flex items-baseline gap-2.5">
                          <h4 className="font-bold text-white text-sm font-mono tracking-tight truncate">
                            {group.title}
                          </h4>
                          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full shrink-0">
                            {group.items.length} {group.items.length === 1 ? "service" : "services"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 font-mono">
                        <div className="text-right">
                          <span className="text-sm font-bold text-white">
                            ${formatNumber(group.totalSpend)}
                          </span>
                          <span className="text-[11px] text-zinc-500 ml-1.5 hidden sm:inline">
                            ({groupPct}% share)
                          </span>
                        </div>

                        <div className="w-6 h-6 rounded-md bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Category Service Table */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-mono text-xs">
                          <thead className="bg-zinc-950/40 border-b border-zinc-800/70 text-[11px] uppercase tracking-wider text-zinc-500 select-none">
                            <tr>
                              <th className="py-3 px-5 font-semibold">Service</th>
                              <th className="py-3 px-4 font-semibold">Attribution</th>
                              <th className="py-3 px-4 font-semibold">Spend</th>
                              <th className="py-3 px-4 font-semibold">Prior Period</th>
                              <th className="py-3 px-4 font-semibold">Change</th>
                              <th className="py-3 px-5 font-semibold text-right">Impact</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/50">
                            {group.items.map((row) => {
                              const numImpact = Number(row.impactPercent) || 0;
                              const isDecrease = String(row.change).startsWith("-") || row.changePositive;

                              return (
                                <tr
                                  key={row.service}
                                  className="hover:bg-zinc-900/50 transition-colors"
                                >
                                  {/* SERVICE */}
                                  <td className="py-3.5 px-5">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                                        <ProviderLogo
                                          provider={row.provider}
                                          name={row.service}
                                          size={16}
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-semibold text-white text-xs font-mono tracking-tight truncate">
                                          {row.service}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                                          {row.team ?? "Unallocated"} · FOCUS 1.0
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* ATTRIBUTION */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <span className="text-[11px] font-mono text-zinc-300 flex items-center gap-1.5">
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          row.attributed ? "bg-zinc-300" : "bg-zinc-600"
                                        }`}
                                      />
                                      <span>{row.attributed ? "Tagged" : "Untagged"}</span>
                                    </span>
                                  </td>

                                  {/* SPEND */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <span className="font-mono font-bold text-white text-xs">
                                      ${formatNumber(row.spend)}
                                    </span>
                                  </td>

                                  {/* PRIOR PERIOD */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <span className="font-mono text-zinc-400 text-xs">
                                      ${formatNumber(row.priorPeriodSpend)}
                                    </span>
                                  </td>

                                  {/* CHANGE (SOFT STONE PILL - NO POPPING NEON COLOR) */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-900/90 border border-zinc-800 text-zinc-300">
                                      <span>{isDecrease ? "↓" : "↑"}</span>
                                      <span>{row.change}</span>
                                    </span>
                                  </td>

                                  {/* IMPACT (SOFT WHITE / STONE PROGRESS BAR - NO POPPING COLORS) */}
                                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                    <div className="inline-flex flex-col items-end gap-1 w-24">
                                      <span className="font-mono text-[11px] font-semibold text-zinc-300">
                                        {numImpact.toFixed(1)}%
                                      </span>
                                      <div className="h-1.5 w-full bg-zinc-800/90 rounded-full overflow-hidden">
                                        <div
                                          className="h-full rounded-full bg-zinc-300 transition-all duration-300"
                                          style={{
                                            width: `${Math.min(100, Math.max(8, numImpact * 3.2))}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
