"use client";

import * as React from "react";
import { Key, Bot, ShieldCheck } from "lucide-react";
import type { TopAiKey } from "@/types";

export interface TopAiKeysCardProps {
  data: TopAiKey[];
  loading?: boolean;
}

export function TopAiKeysCard({ data, loading = false }: TopAiKeysCardProps) {
  if (loading) {
    return (
      <div className="cirra-card p-6 h-full">
        <div className="h-5 w-36 bg-[#E2EDF8] rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full bg-[#E2EDF8]/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="cirra-card p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EBF2FA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EBF3FE] border border-[#BCD9FC] flex items-center justify-center text-[#0062E0]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#0A192F] text-base tracking-tight">Top AI Keys</h3>
              <p className="text-xs text-[#5A6E85] mt-0.5">Token volume & inference spend run-rate</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-[#0D824D] bg-[#E6F8F0] border border-[#B3ECCB] px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#0D824D]" />
              Scoped
            </span>
            <a
              href="/spend/ai"
              className="text-xs font-bold text-[#0062E0] hover:underline hidden sm:inline"
            >
              View all AI keys →
            </a>
          </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {data.map((keyItem, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#F8FAFD] border border-[#D6E4F5] hover:border-[#BCD4F0] hover:bg-[#F2F7FD] transition-all flex flex-col justify-between gap-2.5 group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Key className="w-3.5 h-3.5 text-[#7E93AB] flex-shrink-0 group-hover:text-[#0062E0] transition-colors" />
                  <span
                    className="text-xs font-mono font-bold text-[#0A192F] truncate"
                    title={keyItem.keyName}
                  >
                    {keyItem.keyName}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border flex-shrink-0 ${
                    keyItem.provider === "OpenAI"
                      ? "bg-[#E6F8F0] text-[#0D824D] border-[#B3ECCB]"
                      : "bg-[#F5ECFE] text-[#7C3AED] border-[#DDD6FE]"
                  }`}
                >
                  {keyItem.provider}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-[#D6E4F5]/60 text-xs">
                <div className="text-[11px] text-[#5A6E85] font-medium truncate mr-2">
                  <span>{keyItem.team}</span>
                  <span className="mx-1.5 text-[#BCD4F0]">·</span>
                  <span className="font-bold text-[#0A192F]">{keyItem.tokens}</span>
                </div>
                <div className="text-xs font-bold text-[#0A192F] cirra-metric flex-shrink-0">
                  ${keyItem.spend.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

