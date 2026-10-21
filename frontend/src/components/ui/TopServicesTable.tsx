"use client";

import * as React from "react";
import type { TopService } from "@/types";

export interface TopServicesTableProps {
  data: TopService[];
  loading?: boolean;
  selectedProvider?: string;
}

function ProviderBadge({ provider }: { provider: string }) {
  let style = "bg-[#F0F5FD] text-[#4A607A] border-[#D6E4F5]";

  if (provider === "AWS") {
    style = "bg-[#FFF4E5] text-[#B45309] border-[#FDE68A]";
  } else if (provider === "GCP") {
    style = "bg-[#EBF3FE] text-[#0062E0] border-[#BCD9FC]";
  } else if (provider === "OpenAI") {
    style = "bg-[#E6F8F0] text-[#0D824D] border-[#B3ECCB]";
  } else if (provider === "Anthropic") {
    style = "bg-[#F5ECFE] text-[#7C3AED] border-[#DDD6FE]";
  }

  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border ${style}`}
    >
      {provider}
    </span>
  );
}

export function TopServicesTable({
  data,
  loading = false,
  selectedProvider = "All",
}: TopServicesTableProps) {
  if (loading) {
    return (
      <div className="cirra-card p-6 h-full">
        <div className="h-5 w-44 bg-[#E2EDF8] rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-[#E2EDF8]/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const displayedServices = React.useMemo(() => {
    if (!selectedProvider || selectedProvider === "All") return data;
    const filtered = data.filter(
      (s) => s.provider.toLowerCase() === selectedProvider.toLowerCase()
    );
    return filtered.length > 0 ? filtered : data;
  }, [data, selectedProvider]);

  return (
    <div className="cirra-card p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EBF2FA]">
          <div>
            <h3 className="font-bold text-[#0A192F] text-base tracking-tight">
              Top Consuming Cloud Services
            </h3>
            <p className="text-xs text-[#5A6E85] mt-0.5">
              Highest billed FOCUS line items by spend volume
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-[#EBF3FE] border border-[#BCD9FC] px-2.5 py-1 rounded-full text-[11px] font-bold text-[#0062E0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0062E0] animate-pulse" />
            <span>{selectedProvider !== "All" ? selectedProvider : "Ranked"}</span>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#EBF2FA]">
          {displayedServices.map((service, idx) => (
            <div
              key={idx}
              className="py-3 px-1.5 flex flex-col gap-1.5 hover:bg-[#F4F8FD] rounded-xl transition-colors group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[11px] font-mono font-bold text-[#7E93AB] w-5 flex-shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#0A192F] truncate group-hover:text-[#0062E0] transition-colors">
                      {service.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <ProviderBadge provider={service.provider} />
                      <span className="text-xs text-[#5A6E85] font-medium">
                        {service.share}% of monthly cloud
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 pl-2">
                  <div className="text-sm font-bold text-[#0A192F] cirra-metric">
                    ${service.spend.toLocaleString()}
                  </div>
                  <div
                    className={`text-[11px] font-bold mt-0.5 ${
                      service.changePositive ? "text-[#0D824D]" : "text-[#DC2626]"
                    }`}
                  >
                    {service.change}
                  </div>
                </div>
              </div>

              {/* Share micro-progress bar */}
              <div className="w-full bg-[#EBF2FA] h-1.5 rounded-full overflow-hidden mt-0.5">
                <div
                  className="bg-[#0062E0] h-full rounded-full transition-all duration-500 opacity-80 group-hover:opacity-100"
                  style={{ width: `${Math.min(100, service.share * 2.5)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

