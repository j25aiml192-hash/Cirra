"use client";

import * as React from "react";
import { Key, Bot, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import type { TopAiKey } from "@/types";

export interface TopAiKeysCardProps {
  data: TopAiKey[];
  loading?: boolean;
  embedded?: boolean;
}

export function TopAiKeysCard({ data, loading = false, embedded = false }: TopAiKeysCardProps) {
  if (loading) {
    return (
      <div className={embedded ? "w-full h-full" : "bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs h-full"}>
        <div className="h-5 w-36 bg-[#E5E7EB] rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 w-full bg-[#F3F4F6] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "flex flex-col justify-between h-full" : "bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs flex flex-col justify-between h-full"}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F3F4F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#2B2B2B]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#1A1A1A] text-base tracking-tight">Top AI Keys</h3>
              <p className="text-xs text-[#5E5E5E] mt-0.5">Token volume & inference spend run-rate</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-[#2B2B2B] bg-[#F3F4F6] border border-[#E5E7EB] px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#4D4D4D]" />
              Scoped
            </span>
            <Link
              href="/spend/ai"
              className="text-xs font-bold text-[#2B2B2B] hover:text-[#1A1A1A] hover:underline hidden sm:inline"
            >
              View all AI keys →
            </Link>
          </div>
        </div>

        {/* Empty state */}
        {!data || data.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#D1D5DB] rounded-xl bg-[#F9FAFB]/50">
            <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#4D4D4D] mb-2.5">
              <Key className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-[#1A1A1A]">No AI Key Telemetry</p>
            <p className="text-[11px] text-[#6F6F6F] max-w-xs mt-0.5">
              Connect OpenAI or Anthropic API keys in Settings to monitor token usage and costs.
            </p>
          </div>
        ) : (
          /* List */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {data.map((keyItem, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-white transition-all flex flex-col justify-between gap-2.5 group shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Key className="w-3.5 h-3.5 text-[#6F6F6F] flex-shrink-0 group-hover:text-[#1A1A1A] transition-colors" />
                    <span
                      className="text-xs font-mono font-bold text-[#1A1A1A] truncate"
                      title={keyItem.keyName}
                    >
                      {keyItem.keyName}
                    </span>
                  </div>
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border bg-[#F3F4F6] text-[#2B2B2B] border-[#D1D5DB] flex-shrink-0">
                    {keyItem.provider}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-[#E5E7EB] text-xs">
                  <div className="text-[11px] text-[#5E5E5E] font-medium truncate mr-2">
                    <span>{keyItem.team}</span>
                    <span className="mx-1.5 text-[#D1D5DB]">·</span>
                    <span className="font-bold text-[#2B2B2B]">{keyItem.tokens}</span>
                  </div>
                  <div className="text-xs font-bold text-[#1A1A1A] cirra-metric flex-shrink-0">
                    ${formatNumber(keyItem.spend)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
