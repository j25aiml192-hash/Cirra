"use client";

import * as React from "react";
import { Layers } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { TopService } from "@/types";
import { ProviderLogo } from "@/components/ui/provider-logos";

export interface TopServicesTableProps {
  data: TopService[];
  loading?: boolean;
  selectedProvider?: string;
  embedded?: boolean;
}

// 5 exact palette colors extracted from user reference swatch
const SERVICE_BAR_COLORS = [
  "#275966", // 1: Dark Slate Teal
  "#21a387", // 2: Jade Green
  "#e5431c", // 3: Coral Red-Orange
  "#f5bb1d", // 4: Sunflower Gold
  "#f4981e", // 5: Tangerine Amber
];

function ProviderBadge({ provider }: { provider: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium px-2 py-0.5 rounded border bg-zinc-900 text-zinc-300 border-zinc-800">
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
      <div className="space-y-3">
        <div className="h-5 w-44 bg-zinc-800 rounded animate-pulse mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
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

  const innerContent = (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/80 font-mono">
          <div>
            <h3 className="font-bold text-[#EDEAE0] text-[17px] tracking-tight font-mono">
              Top Consuming Cloud Services
            </h3>
            <p className="text-[13px] text-zinc-400 font-sans mt-0.5">
              Highest billed FOCUS line items by spend volume
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full text-[11px] font-bold text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{selectedProvider !== "All" ? selectedProvider : "Ranked"}</span>
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
          <div className="space-y-2.5">
            {displayedServices.map((service, index) => {
              const barColor = SERVICE_BAR_COLORS[index % SERVICE_BAR_COLORS.length];
              return (
                <div
                  key={service.name}
                  className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-zinc-500 w-4 shrink-0">
                        #{index + 1}
                      </span>
                      <div className="w-6 h-6 rounded-md bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center shrink-0 p-1">
                        <ProviderLogo provider={service.provider} name={service.name} size={14} />
                      </div>
                      <span className="text-xs font-bold text-[#EDEAE0]">
                        {service.name}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-[#EDEAE0] font-mono">
                      ${formatNumber(service.spend)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 ml-7">
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

                  {/* Percentage Progress bar with custom color palette */}
                  <div className="w-full bg-zinc-800/90 h-2 rounded-full overflow-hidden mt-2 ml-7 max-w-[calc(100%-28px)]">
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{
                        width: `${Math.min(100, Math.max(6, service.share * 2.2))}%`,
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
    </div>
  );

  if (embedded) {
    return innerContent;
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#09090b] border border-zinc-800/80 h-full flex flex-col justify-between">
      {innerContent}
    </div>
  );
}
