"use client";

import * as React from "react";
import { Layers } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { TopService } from "@/types";
import { MagicBentoCard } from "@/components/ui/MagicBento";

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
    const loaderContent = (
      <div className="space-y-3">
        <div className="h-5 w-44 bg-[#E5E7EB] rounded animate-pulse mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 w-full bg-[#F3F4F6] rounded-xl animate-pulse" />
        ))}
      </div>
    );

    if (embedded) {
      return <div className="w-full h-full">{loaderContent}</div>;
    }

    return (
      <MagicBentoCard
        radius={22}
        className="bg-white border-gray-200/90 shadow-2xs h-full"
        contentClassName="p-6 h-full"
      >
        {loaderContent}
      </MagicBentoCard>
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
          <div className="py-12 text-center space-y-2">
            <Layers className="w-8 h-8 text-[#9CA3AF] mx-auto opacity-60" />
            <p className="text-xs text-[#5E5E5E] font-medium">
              No service spend facts recorded for this filter
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedServices.map((service, index) => (
              <div
                key={service.name}
                className="p-3 rounded-xl border border-[#F3F4F6] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-[#9CA3AF] w-4">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-bold text-[#1A1A1A]">
                      {service.name}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-[#1A1A1A] font-mono">
                    ${formatNumber(service.spend)}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2 ml-7">
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

  if (embedded) {
    return innerContent;
  }

  return (
    <MagicBentoCard
      radius={22}
      className="bg-white border-gray-200/90 shadow-2xs h-full"
      contentClassName="p-6 h-full flex flex-col justify-between"
    >
      {innerContent}
    </MagicBentoCard>
  );
}
