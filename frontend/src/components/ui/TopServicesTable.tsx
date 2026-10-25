"use client";

import * as React from "react";
import { Layers } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { TopService } from "@/types";

export interface TopServicesTableProps {
  data: TopService[];
  loading?: boolean;
  selectedProvider?: string;
  embedded?: boolean;
}

function ProviderBadge({ provider }: { provider: string }) {
  return (
    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border bg-[#F3F4F6] text-[#2B2B2B] border-[#D1D5DB]">
      {provider}
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
    return (
      <div className={embedded ? "w-full h-full" : "bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs h-full"}>
        <div className="h-5 w-44 bg-[#E5E7EB] rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-[#F3F4F6] rounded-xl animate-pulse" />
          ))}
        </div>
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

  return (
    <div className={embedded ? "flex flex-col justify-between h-full" : "bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs flex flex-col justify-between h-full"}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F3F4F6]">
          <div>
            <h3 className="font-bold text-[#1A1A1A] text-base tracking-tight">
              Top Consuming Cloud Services
            </h3>
            <p className="text-xs text-[#5E5E5E] mt-0.5">
              Highest billed FOCUS line items by spend volume
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-[#F3F4F6] border border-[#E5E7EB] px-2.5 py-1 rounded-full text-[11px] font-bold text-[#2B2B2B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2B2B2B] animate-pulse" />
            <span>{selectedProvider !== "All" ? selectedProvider : "Ranked"}</span>
          </div>
        </div>

        {/* Empty state */}
        {displayedServices.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#D1D5DB] rounded-xl bg-[#F9FAFB]/50">
            <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#4D4D4D] mb-2.5">
              <Layers className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-[#1A1A1A]">No Cloud Services Recorded</p>
            <p className="text-[11px] text-[#6F6F6F] max-w-xs mt-0.5">
              FOCUS billing services will appear here once connected provider data syncs.
            </p>
          </div>
        ) : (
          /* Rows */
          <div className="divide-y divide-[#F3F4F6]">
            {displayedServices.map((service, idx) => (
              <div
                key={idx}
                className="py-3 px-1.5 flex flex-col gap-1.5 hover:bg-[#F9FAFB] rounded-xl transition-colors group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[11px] font-mono font-bold text-[#6F6F6F] w-5 flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <span
                      className="text-xs font-semibold text-[#1A1A1A] truncate group-hover:text-black transition-colors"
                      title={service.name}
                    >
                      {service.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold text-[#1A1A1A] cirra-metric">
                      ${formatNumber(service.spend)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pl-7 pr-1">
                  <div className="flex items-center gap-2">
                    <ProviderBadge provider={service.provider} />
                    <span className="text-[11px] text-[#5E5E5E]">
                      {service.share.toFixed(1)}% of monthly cloud
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#4D4D4D] bg-[#F3F4F6] px-1.5 py-0.5 rounded">
                    {service.change}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#F3F4F6] h-1.5 rounded-full overflow-hidden mt-0.5 ml-7 max-w-[calc(100%-28px)]">
                  <div
                    className="bg-[#2B2B2B] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, service.share * 2.5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
