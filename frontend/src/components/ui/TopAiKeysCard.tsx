import * as React from "react";
import { Key, Bot } from "lucide-react";
import type { TopAiKey } from "@/types";
import { Badge } from "./Badge";

export interface TopAiKeysCardProps {
  data: TopAiKey[];
  loading?: boolean;
}

export function TopAiKeysCard({ data, loading = false }: TopAiKeysCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 h-full">
        <div className="animate-shimmer h-5 w-32 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-shimmer h-14 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Top AI Keys</h3>
              <p className="text-xs text-slate-400 mt-0.5">Token volume & cost run-rate</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {data.map((keyItem, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-mono font-medium text-slate-800">
                    {keyItem.keyName}
                  </span>
                </div>
                <Badge variant={keyItem.provider === "OpenAI" ? "success" : "indigo"}>
                  {keyItem.provider}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-500">
                  <span>{keyItem.team}</span> · <span className="font-medium text-purple-600">{keyItem.tokens}</span>
                </div>
                <div className="text-xs font-bold text-slate-900">
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
