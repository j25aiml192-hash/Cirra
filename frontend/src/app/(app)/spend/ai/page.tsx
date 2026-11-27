"use client";

import React, { useState } from "react";
import { Cpu, Zap, Key, Layers, Database, TrendingUp } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProviderLogo } from "@/components/ui/provider-logos";
import { useAiSpend } from "@/hooks/useSpend";
import { formatNumber } from "@/lib/utils";
import type { AiSpendRecord } from "@/types";

interface AtmosphericMetricCardProps {
  theme: "purple" | "cyan" | "emerald";
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  delta?: string;
  progress?: number;
  loading?: boolean;
}

function AtmosphericMetricCard({
  theme,
  icon,
  label,
  value,
  sub,
  delta,
  progress,
  loading = false,
}: AtmosphericMetricCardProps) {
  // Themes matching reference design with atmospheric ambient mesh + glowing wave paths
  const themes = {
    purple: {
      bg: "from-[#221834] via-[#1a1429] to-[#0d0a14]",
      border: "border-purple-500/20 hover:border-purple-500/40",
      accent: "text-purple-300",
      iconBox: "bg-purple-950/40 border-purple-500/30 text-purple-200",
      waveColor: "#a855f7",
      glowColor: "rgba(168, 85, 247, 0.12)",
      ringColor: "#c084fc",
      badge: "bg-purple-950/60 border-purple-500/30 text-purple-300",
    },
    cyan: {
      bg: "from-[#112a38] via-[#0d1e29] to-[#071118]",
      border: "border-cyan-500/20 hover:border-cyan-500/40",
      accent: "text-cyan-300",
      iconBox: "bg-cyan-950/40 border-cyan-500/30 text-cyan-200",
      waveColor: "#06b6d4",
      glowColor: "rgba(6, 182, 212, 0.12)",
      ringColor: "#22d3ee",
      badge: "bg-cyan-950/60 border-cyan-500/30 text-cyan-300",
    },
    emerald: {
      bg: "from-[#102e26] via-[#0c221c] to-[#061410]",
      border: "border-emerald-500/20 hover:border-emerald-500/40",
      accent: "text-emerald-300",
      iconBox: "bg-emerald-950/40 border-emerald-500/30 text-emerald-200",
      waveColor: "#10b981",
      glowColor: "rgba(16, 185, 129, 0.12)",
      ringColor: "#34d399",
      badge: "bg-emerald-950/60 border-emerald-500/30 text-emerald-300",
    },
  };

  const t = themes[theme];

  if (loading) {
    return (
      <div className="h-44 rounded-2xl bg-zinc-950 border border-zinc-800/80 p-5 animate-pulse flex flex-col justify-between">
        <div className="w-28 h-4 bg-zinc-800 rounded" />
        <div className="w-40 h-8 bg-zinc-800 rounded" />
        <div className="w-32 h-4 bg-zinc-800 rounded" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.bg} border ${t.border} p-5 sm:p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/60 flex flex-col justify-between min-h-[175px] group select-none`}
    >
      {/* Background Abstract Glowing Spline Lines (similar to reference) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-30 group-hover:opacity-45 transition-opacity"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 400 200"
      >
        <defs>
          <linearGradient id={`grad-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={t.waveColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor={t.waveColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d="M-50,180 C80,120 180,190 280,100 C340,40 380,80 450,30"
          fill="none"
          stroke={`url(#grad-${theme})`}
          strokeWidth="1.5"
        />
        <path
          d="M-30,80 C70,160 190,40 310,130 C370,175 420,120 460,150"
          fill="none"
          stroke={`url(#grad-${theme})`}
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />
        <circle cx="340" cy="50" r="110" fill={t.glowColor} filter="blur(45px)" />
      </svg>

      {/* Top Row: Icon Container + Label */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl ${t.iconBox} border backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm`}
          >
            {icon}
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-zinc-300">
              {label}
            </span>
          </div>
        </div>

        {delta && (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border backdrop-blur-sm ${t.badge}`}
          >
            <TrendingUp className="w-3 h-3" />
            {delta}
          </span>
        )}
      </div>

      {/* Middle Metric Value & Ring */}
      <div className="relative z-10 my-3 flex items-baseline justify-between gap-2">
        <div className="text-3xl sm:text-[34px] font-extrabold text-white font-mono tracking-tight cirra-metric">
          {value}
        </div>

        {progress !== undefined && (
          <div className="relative flex items-center justify-center shrink-0">
            <svg width="46" height="46" className="-rotate-90">
              <circle
                cx="23"
                cy="23"
                r="18"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3.5"
                fill="none"
              />
              <circle
                cx="23"
                cy="23"
                r="18"
                stroke={t.ringColor}
                strokeWidth="3.5"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - progress / 100)}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute text-[10px] font-bold font-mono text-zinc-200">
              {progress}%
            </span>
          </div>
        )}
      </div>

      {/* Bottom Subtitle */}
      <div className="relative z-10 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-mono">
        <span className="text-zinc-400 font-medium truncate">{sub}</span>
        <span className={`text-[10px] font-semibold ${t.accent}`}>TELEMETRY LIVE</span>
      </div>
    </div>
  );
}

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
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
            <ProviderLogo provider={row.provider} name={String(val)} size={18} />
          </div>
          <div>
            <div className="font-semibold text-white tracking-tight font-mono text-[13px]">{String(val)}</div>
            <div className="text-[11px] text-zinc-400 font-mono">{row.customer ?? "Standard"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      render: (val) => (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
          <ProviderLogo provider={String(val)} size={14} />
          <span className="text-xs font-mono font-medium text-zinc-200">{String(val)}</span>
        </div>
      ),
    },
    {
      key: "apiKeyId",
      header: "Key (Masked)",
      render: (val) => (
        <span className="font-mono text-xs text-zinc-300 bg-zinc-900/90 border border-zinc-800/80 px-2.5 py-1 rounded-md">
          {String(val)}
        </span>
      ),
    },
    {
      key: "team",
      header: "Attributed Team",
      render: (val) => (
        <span className="text-xs font-medium text-zinc-300 font-mono">{String(val)}</span>
      ),
    },
    {
      key: "inputTokens",
      header: "Tokens (In / Out)",
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-400">
          {(Number(row.inputTokens) / 1000000).toFixed(0)}M in / {(Number(row.outputTokens) / 1000000).toFixed(0)}M out
        </span>
      ),
    },
    {
      key: "cacheRate",
      header: "Prompt Cache",
      render: (val) => (
        <span className="font-mono text-xs text-emerald-400 font-medium">
          {String(val)} Cached
        </span>
      ),
    },
    {
      key: "costUsd",
      header: "Cost (USD)",
      render: (val) => (
        <span className="font-bold text-white font-mono text-[13px]">
          ${formatNumber(Number(val))}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
        {/* 3 Atmospheric StatCards with Cirra Context and Glowing Ambient Curves */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <AtmosphericMetricCard
            theme="purple"
            icon={<Cpu className="w-5 h-5 text-purple-200" />}
            label="Total AI Run-Rate"
            value={data ? `$${formatNumber(data.totalCostUsd)}` : "$0"}
            sub="OpenAI + Anthropic APIs"
            delta="+18.4%"
            loading={isLoading}
          />
          <AtmosphericMetricCard
            theme="cyan"
            icon={<Zap className="w-5 h-5 text-cyan-200" />}
            label="Billable Tokens"
            value={`${data ? (data.totalTokens / 1000000000).toFixed(1) : 0}B`}
            sub="Prompt + completion volume"
            delta="+24.1%"
            loading={isLoading}
          />
          <AtmosphericMetricCard
            theme="emerald"
            icon={<Database className="w-5 h-5 text-emerald-200" />}
            label="Cache Optimization"
            value={`${data ? data.cachedTokensPercent : 0}%`}
            sub="Saved ~$8,400 via prompt cache"
            progress={data?.cachedTokensPercent ? Math.round(data.cachedTokensPercent) : 0}
            loading={isLoading}
          />
        </div>

        {/* Provider Tabs Filter + Model Cost Card */}
        <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-white text-base font-mono">Model Cost Attribution</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Aggregated costs by foundation model family</p>
            </div>

            {/* Provider Tabs */}
            <div className="inline-flex items-center p-1 rounded-full bg-zinc-900/90 border border-zinc-800 overflow-x-auto">
              {["all", "OpenAI", "Anthropic"].map((p) => {
                const active = activeProvider === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActiveProvider(p)}
                    className={`px-4 sm:px-5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? "bg-emerald-600 text-white font-bold shadow-[0_0_12px_rgba(5,150,105,0.4)]"
                        : "text-zinc-400 hover:text-white font-medium"
                    }`}
                  >
                    {p === "all" ? "All Providers" : p}
                  </button>
                );
              })}
            </div>
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {filteredModels.map((m) => {
            const isAnthropic = m.provider.toLowerCase().includes("anthropic");
            return (
              <div
                key={m.model}
                className="group relative p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/90 hover:bg-zinc-900/60 hover:border-zinc-700/80 transition-all flex flex-col justify-between overflow-hidden shadow-sm"
              >
                {/* Subtle top brand color accent line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[2px] opacity-40 group-hover:opacity-100 transition-opacity ${
                    isAnthropic ? "bg-[#D97757]" : "bg-[#10A37F]"
                  }`}
                />

                <div className="space-y-2.5">
                  {/* Provider Header with authentic Logo and Name */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900/90 border border-zinc-800">
                      <ProviderLogo provider={m.provider} size={13} />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                        {m.provider}
                      </span>
                    </div>
                  </div>

                  {/* Model Name */}
                  <div className="text-sm font-bold text-white tracking-tight truncate font-mono">
                    {m.model}
                  </div>
                </div>

                {/* Cost metric */}
                <div className="mt-4 pt-2.5 border-t border-zinc-900/80 flex items-baseline justify-between">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Spend</span>
                  <span className="text-base font-extrabold text-white font-mono tracking-tight">
                    ${formatNumber(m.cost)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Usage DataTable */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-white text-base font-mono">API Key Token Telemetry</h3>
          <span className="text-xs text-zinc-400 font-mono">{filteredItems.length} active keys tracked</span>
        </div>
        <DataTable
          columns={columns}
          data={filteredItems}
          loading={isLoading}
          emptyText="No AI spend records for this filter"
        />
        </div>
      </main>
    </div>
  );
}
