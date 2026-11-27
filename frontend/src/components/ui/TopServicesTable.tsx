"use client";

import * as React from "react";
import { Layers, TrendingUp, TrendingDown } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { TopService } from "@/types";
import { ProviderLogo } from "@/components/ui/provider-logos";

export interface TopServicesTableProps {
  data: TopService[];
  loading?: boolean;
  selectedProvider?: string;
  embedded?: boolean;
}

// Service bar accent colors for ranks 4+ (Clean neutral grey tones)
const SERVICE_BAR_COLORS = [
  "#71717a", // Zinc-500 Neutral Grey
  "#52525b", // Zinc-600 Slate Grey
  "#a1a1aa", // Zinc-400 Cool Grey
  "#3f3f46", // Zinc-700 Dark Grey
];

function ProviderBadge({ provider }: { provider: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border bg-zinc-900/90 text-zinc-300 border-zinc-800">
      <ProviderLogo provider={provider} size={11} className="shrink-0" />
      <span>{provider}</span>
    </span>
  );
}

export function TopServicesTable({
  data,
  loading = false,
  selectedProvider = "All",
  embedded = false,
}: TopServicesTableProps) {
  if (loading) {
    const loaderContent = (
      <div className="space-y-4">
        <div className="h-5 w-44 bg-zinc-800 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-3 gap-3 h-48">
          <div className="h-32 self-end bg-zinc-900/60 rounded-t-2xl animate-pulse" />
          <div className="h-44 self-end bg-zinc-900/60 rounded-t-2xl animate-pulse" />
          <div className="h-28 self-end bg-zinc-900/60 rounded-t-2xl animate-pulse" />
        </div>
        {[4, 5].map((i) => (
          <div key={i} className="h-12 w-full bg-zinc-900/60 rounded-xl animate-pulse" />
        ))}
      </div>
    );

    if (embedded) {
      return <div className="w-full h-full">{loaderContent}</div>;
    }

    return (
      <div className="p-6 rounded-2xl bg-[#09090b] border border-zinc-800/80 h-full">
        {loaderContent}
      </div>
    );
  }

  const displayedServices = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    if (!selectedProvider || selectedProvider === "All") return data;
    const filtered = data.filter(
      (s) => s.provider.toLowerCase() === selectedProvider.toLowerCase()
    );
    return filtered.length > 0 ? filtered : [];
  }, [data, selectedProvider]);

  const first = displayedServices[0];
  const second = displayedServices[1];
  const third = displayedServices[2];
  const rest = displayedServices.slice(3);

  const innerContent = (
    <div className="flex flex-col justify-between h-full select-none">
      <div>
        {/* Header (Clean, Victory Board removed) */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/80 font-mono">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-[16px] sm:text-[17px] tracking-tight font-mono">
                Top Consuming Cloud Services
              </h3>
            </div>
            <p className="text-[12px] sm:text-[13px] text-zinc-400 font-sans mt-0.5">
              Highest billed FOCUS line items by spend volume
            </p>
          </div>
        </div>

        {/* Empty state */}
        {displayedServices.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Layers className="w-8 h-8 text-zinc-600 mx-auto opacity-60" />
            <p className="text-xs text-zinc-500 font-medium">
              No service spend facts recorded for this filter
            </p>
          </div>
        ) : (
          <div>
            {/* ── 3-Column Victory Podium (Matching Reference Drawing) ──────── */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 items-end pt-5 pb-2">
              {/* 🥈 SECOND PLACE PODIUM (Left) */}
              {second && (
                <div className="flex flex-col items-center">
                  {/* Service info on top of pillar */}
                  <div className="flex flex-col items-center text-center mb-2 w-full px-1">
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-slate-600/50 flex items-center justify-center p-1.5 shadow-md mb-1.5 group-hover:scale-105 transition-transform">
                      <ProviderLogo provider={second.provider} name={second.name} size={15} />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-white font-mono truncate max-w-full" title={second.name}>
                      {second.name}
                    </span>
                    <span className="text-xs sm:text-[13px] font-black text-slate-200 font-mono mt-0.5">
                      ${formatNumber(second.spend)}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-sans mt-0.5">
                      {second.share.toFixed(1)}% share
                    </span>
                  </div>

                  {/* Silver / Neutral Podium Pillar (Rank 2) */}
                  <div className="w-full h-32 sm:h-36 rounded-t-2xl bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-800/40 border-t-2 border-x border-slate-700/60 shadow-none flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none" />
                    
                    {/* Big Bold Rank Number 2 */}
                    <span className="text-4xl sm:text-5xl font-black font-mono text-slate-300">
                      2
                    </span>
                    
                    {/* Trend change badge */}
                    <span className="mt-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900/90 text-slate-300 border border-slate-700/60">
                      {second.change}
                    </span>
                  </div>
                </div>
              )}

              {/* 🥇 FIRST PLACE PODIUM (Center - Off-White Bar, No Shadow, No Star) */}
              {first && (
                <div className="flex flex-col items-center relative z-10">
                  {/* Service info on top of pillar (Clean, No Star) */}
                  <div className="flex flex-col items-center text-center mb-2 w-full px-1">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center p-1.5 mb-1.5 group-hover:scale-105 transition-transform">
                      <ProviderLogo provider={first.provider} name={first.name} size={17} />
                    </div>
                    <span className="text-xs sm:text-[13px] font-black text-white font-mono truncate max-w-full" title={first.name}>
                      {first.name}
                    </span>
                    <span className="text-sm sm:text-base font-black text-white font-mono mt-0.5">
                      ${formatNumber(first.spend)}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono font-medium mt-0.5">
                      {first.share.toFixed(1)}% share
                    </span>
                  </div>

                  {/* Off-White Podium Pillar (Rank 1 - Tallest, No Shadow) */}
                  <div className="w-full h-44 sm:h-50 rounded-t-2xl bg-[#f4efe6] border-t-2 border-x border-[#e6dfd1] shadow-none flex flex-col items-center justify-center relative overflow-hidden group">
                    {/* Big Bold Rank Number 1 */}
                    <span className="text-5xl sm:text-6xl font-black font-mono text-zinc-900">
                      1
                    </span>

                    {/* Trend change badge */}
                    <span className="mt-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/10 text-zinc-800">
                      {first.change}
                    </span>
                  </div>
                </div>
              )}

              {/* 🥉 THIRD PLACE PODIUM (Right) */}
              {third && (
                <div className="flex flex-col items-center">
                  {/* Service info on top of pillar */}
                  <div className="flex flex-col items-center text-center mb-2 w-full px-1">
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center p-1.5 mb-1.5 group-hover:scale-105 transition-transform">
                      <ProviderLogo provider={third.provider} name={third.name} size={15} />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-white font-mono truncate max-w-full" title={third.name}>
                      {third.name}
                    </span>
                    <span className="text-xs sm:text-[13px] font-black text-slate-200 font-mono mt-0.5">
                      ${formatNumber(third.spend)}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-sans mt-0.5">
                      {third.share.toFixed(1)}% share
                    </span>
                  </div>

                  {/* Neutral Bronze / Dark Podium Pillar (Rank 3 - No Shadow) */}
                  <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-t from-zinc-950 via-zinc-900/60 to-zinc-850/40 border-t-2 border-x border-zinc-800/80 shadow-none flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none" />
                    
                    {/* Big Bold Rank Number 3 */}
                    <span className="text-3xl sm:text-4xl font-black font-mono text-zinc-400">
                      3
                    </span>

                    {/* Trend change badge */}
                    <span className="mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                      {third.change}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Remaining Contenders List (#4, #5...) ──────── */}
            {rest.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between px-1 text-[11px] font-mono text-zinc-400">
                  <span className="uppercase tracking-wider font-bold">Additional Contenders</span>
                  <span>{rest.length} ranked</span>
                </div>

                {rest.map((service, idx) => {
                  const actualRank = idx + 4;
                  const barColor = SERVICE_BAR_COLORS[idx % SERVICE_BAR_COLORS.length];

                  return (
                    <div
                      key={service.name}
                      className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs font-mono font-extrabold text-zinc-400 w-5 shrink-0">
                            #{actualRank}
                          </span>
                          <div className="w-6 h-6 rounded-md bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center shrink-0 p-1">
                            <ProviderLogo provider={service.provider} name={service.name} size={14} />
                          </div>
                          <span className="text-xs font-bold text-white truncate">
                            {service.name}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-white font-mono shrink-0 ml-2">
                          ${formatNumber(service.spend)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 ml-7 text-xs">
                        <div className="flex items-center gap-2">
                          <ProviderBadge provider={service.provider} />
                          <span className="text-[11px] text-zinc-400 font-sans">
                            {service.share.toFixed(1)}% of monthly cloud
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/60">
                          {service.change}
                        </span>
                      </div>

                      {/* Percentage Progress bar */}
                      <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden mt-2 ml-7 max-w-[calc(100%-28px)]">
                        <div
                          className="h-full rounded-full transition-all duration-500 shadow-sm"
                          style={{
                            width: `${Math.min(100, Math.max(6, service.share * 2.5))}%`,
                            backgroundColor: barColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return innerContent;
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#09090b]/85 backdrop-blur-xl border border-zinc-800/80 h-full flex flex-col justify-between">
      {innerContent}
    </div>
  );
}
