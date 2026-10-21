"use client";

import React, { useState } from "react";
import { Cpu, Zap, Key, Layers, Database } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useAiSpend } from "@/hooks/useSpend";
import type { AiSpendRecord } from "@/types";

export default function AiSpendPage() {
  const { data, isLoading } = useAiSpend();
  const [activeProvider, setActiveProvider] = useState<string>("all");

  const items = data?.items ?? [];
  const modelCosts = data?.modelCosts ?? [];

  const filteredItems = items.filter((item) => {
    if (activeProvider === "all") return true;
    return item.provider.toLowerCase() === activeProvider.toLowerCase();
  });

  const filteredModels = modelCosts.filter((m) => {
    if (activeProvider === "all") return true;
    return m.provider.toLowerCase() === activeProvider.toLowerCase();
  });

  const columns: Column<AiSpendRecord>[] = [
    {
      key: "model",
      header: "Foundation Model",
      render: (val, row) => (
        <div>
          <div className="font-semibold text-slate-900">{String(val)}</div>
          <div className="text-[11px] text-[#64748B]">{row.customer ?? "Standard"}</div>
        </div>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      render: (val) => (
        <Badge variant={val === "OpenAI" ? "success" : "indigo"}>
          {String(val)}
        </Badge>
      ),
    },
    {
      key: "apiKeyId",
      header: "Key (Masked)",
      render: (val) => (
        <span className="font-mono text-xs text-[#475569] bg-[#F0F5FD] border border-[#D6E4F5] px-2 py-0.5 rounded">
          {String(val)}
        </span>
      ),
    },
    {
      key: "team",
      header: "Attributed Team",
      render: (val) => (
        <span className="text-xs font-medium text-slate-700">{String(val)}</span>
      ),
    },
    {
      key: "inputTokens",
      header: "Tokens (In / Out)",
      render: (val, row) => (
        <span className="font-mono text-xs text-slate-600">
          {(Number(row.inputTokens) / 1000000).toFixed(0)}M in / {(Number(row.outputTokens) / 1000000).toFixed(0)}M out
        </span>
      ),
    },
    {
      key: "cacheRate",
      header: "Prompt Cache",
      render: (val) => (
        <Badge variant="info">
          {String(val)} Cached
        </Badge>
      ),
    },
    {
      key: "costUsd",
      header: "Cost (USD)",
      render: (val) => (
        <span className="font-bold text-slate-900">
          ${Number(val).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <Topbar title="AI & Foundation Model Spend" subtitle="Real-time token attribution, prompt caching rates, and model cost controls" />

      {/* 3 StatCards: violet, blue, green */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          variant="violet"
          icon={<Cpu className="w-4 h-4" />}
          label="TOTAL AI RUN-RATE"
          value={`$${data ? data.totalCostUsd.toLocaleString() : 0}`}
          sub="OpenAI + Anthropic APIs"
          delta="+18.4%"
          deltaPositive={false}
          loading={isLoading}
        />
        <StatCard
          variant="blue"
          icon={<Zap className="w-4 h-4" />}
          label="BILLABLE TOKENS"
          value={`${data ? (data.totalTokens / 1000000000).toFixed(1) : 0}B`}
          sub="Prompt + completion volume"
          delta="+24.1%"
          deltaPositive={false}
          loading={isLoading}
        />
        <StatCard
          variant="green"
          icon={<Database className="w-4 h-4" />}
          label="CACHE OPTIMIZATION"
          value={`${data ? data.cachedTokensPercent : 0}%`}
          sub="Saved ~$8,400 via prompt cache"
          progress={data?.cachedTokensPercent ? Math.round(data.cachedTokensPercent) : 0}
          loading={isLoading}
        />
      </div>

      {/* Provider Tabs Filter + Model Cost Card */}
      <div className="cirra-card p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-[#0A192F] text-base">Model Cost Attribution</h3>
            <p className="text-xs text-[#475569] mt-0.5">Aggregated costs by foundation model family</p>
          </div>

          {/* Provider Tabs */}
          <div className="flex items-center gap-1.5 bg-[#F0F5FD] border border-[#D6E4F5] p-1 rounded-full">
            {["all", "OpenAI", "Anthropic"].map((p) => {
              const active = activeProvider === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActiveProvider(p)}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? "bg-white text-[#0062E0] shadow-sm border border-[#BCD9FC]"
                      : "text-[#475569] hover:text-[#0A192F]"
                  }`}
                >
                  {p === "all" ? "All Providers" : p}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {filteredModels.map((m) => (
            <div key={m.model} className="p-4 rounded-xl border border-[#D6E4F5] bg-[#F8FAFD] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                  {m.provider}
                </span>
                <div className="text-sm font-bold text-[#0A192F] mt-1 truncate">
                  {m.model}
                </div>
              </div>
              <div className="text-base font-extrabold text-[#0062E0] mt-3">
                ${m.cost.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Usage DataTable */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-[#0A192F] text-base">API Key Token Telemetry</h3>
          <span className="text-xs text-[#64748B]">{filteredItems.length} active keys tracked</span>
        </div>
        <DataTable
          columns={columns}
          data={filteredItems}
          loading={isLoading}
          emptyText="No AI spend records for this filter"
        />
      </div>
    </div>
  );
}
