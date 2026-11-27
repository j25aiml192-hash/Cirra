"use client";

import * as React from "react";
import Link from "next/link";
import { ChalkRobotIcon, ChalkKeyIcon, ChalkShieldIcon } from "@/components/ui/chalk-icons";
import { ProviderLogo } from "@/components/ui/provider-logos";
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
      <div className={embedded ? "w-full h-full p-[21px]" : "bg-[#09090b] rounded-2xl p-[21px] border border-zinc-800/80 h-full"}>
        <div className="h-5 w-36 bg-zinc-800 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[13px]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 w-full bg-zinc-900/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "flex flex-col justify-between h-full p-[21px]" : "bg-[#09090b] rounded-2xl p-[21px] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between h-full"}>
      <div>
        {/* Header with Golden Ratio Proportions */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <ChalkRobotIcon size={34} className="flex-shrink-0" />
            <div>
              <h3 className="font-bold text-[#EDEAE0] text-[17px] tracking-tight font-mono">Top AI Keys</h3>
              <p className="text-[13px] text-zinc-400 font-sans mt-0.5">Token volume &amp; inference spend run-rate</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <ChalkShieldIcon size={16} />
              Scoped
            </span>
            <Link
              href="/spend/ai"
              className="text-[13px] font-sans font-medium text-zinc-400 hover:text-white hover:underline hidden sm:inline transition-colors"
            >
              View all AI keys →
            </Link>
          </div>
        </div>

        {/* Empty state */}
        {!data || data.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center p-5 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
            <div className="mb-3">
              <ChalkKeyIcon size={36} />
            </div>
            <p className="text-[13px] font-bold text-white font-mono">No AI Key Telemetry</p>
            <p className="text-[12px] text-zinc-400 font-sans max-w-xs mt-1">
              Connect OpenAI or Anthropic API keys in Settings to monitor token usage and costs.
            </p>
          </div>
        ) : (
          /* List styled with Golden Ratio */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[13px]">
            {data.map((keyItem, idx) => (
              <div
                key={idx}
                className="p-[13px] rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all flex flex-col justify-between gap-2.5 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center shrink-0 p-1 shadow-sm">
                      <ProviderLogo
                        provider={keyItem.provider}
                        name={keyItem.keyName}
                        size={15}
                      />
                    </div>
                    <span
                      className="text-[13px] font-mono font-bold text-[#EDEAE0] truncate"
                      title={keyItem.keyName}
                    >
                      {keyItem.keyName}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium px-2 py-0.5 rounded border bg-zinc-800/90 text-zinc-300 border-zinc-700/80 flex-shrink-0">
                    <ProviderLogo
                      provider={keyItem.provider}
                      name={keyItem.keyName}
                      size={11}
                      className="shrink-0"
                    />
                    <span>{keyItem.provider}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                  <div className="text-[12px] text-zinc-400 font-sans font-medium truncate mr-2">
                    <span>{keyItem.team}</span>
                    <span className="mx-1.5 text-zinc-600">·</span>
                    <span className="font-mono text-zinc-300">{keyItem.tokens}</span>
                  </div>
                  <div className="text-[14px] font-bold font-mono text-[#EDEAE0] cirra-metric flex-shrink-0">
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
