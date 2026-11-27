"use client";

import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { MagicBentoCard } from "@/components/ui/MagicBento";

export type StatCardVariant = "blue" | "green" | "red" | "amber" | "violet" | "steel";

export interface StatCardProps {
  variant?: StatCardVariant;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  delta?: string;          // e.g. "+4.2%"
  deltaPositive?: boolean;
  progress?: number;       // 0–100, shows ring if provided
  loading?: boolean;
  className?: string;
}

function StatProgressRing({
  value,
  color = "#F59E0B",
  size = 42,
  strokeWidth = 3.5,
}: {
  value: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#27272a"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-amber-300 font-mono">
        {Math.round(clamped)}%
      </div>
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  delta,
  deltaPositive,
  progress,
  loading = false,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <MagicBentoCard
        radius={22}
        className="bg-[#09090b] border-zinc-800 shadow-none"
        contentClassName="p-5 flex flex-col justify-between h-full"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-24 h-3 bg-zinc-800 rounded animate-pulse" />
          <div className="w-8 h-8 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="w-32 h-7 bg-zinc-800 rounded mb-2 animate-pulse" />
        <div className="w-20 h-3 bg-zinc-800 rounded animate-pulse" />
      </MagicBentoCard>
    );
  }

  return (
    <MagicBentoCard
      radius={22}
      className={`bg-[#09090b] border-zinc-800/80 shadow-none hover:border-zinc-700 transition-all group ${className ?? ""}`}
      contentClassName="p-5 flex flex-col justify-between h-full"
    >
      <div>
        {/* Header row: Label & Icon in Runway dark editorial tokens */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
            {label}
          </span>
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 group-hover:bg-zinc-800 transition-colors">
            {icon}
          </div>
        </div>

        {/* Value and Progress Ring */}
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-2xl sm:text-[28px] font-bold text-white cirra-metric leading-tight font-mono tracking-tight">
            {value}
          </div>
          {progress !== undefined && (
            <StatProgressRing value={progress} color="#F59E0B" size={42} strokeWidth={3.5} />
          )}
        </div>
      </div>

      {/* Footer row: Subtitle & Delta badge */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-zinc-850 text-xs">
        {sub ? (
          <span className="text-xs text-zinc-400 font-medium truncate" title={sub}>
            {sub}
          </span>
        ) : (
          <span />
        )}

        {delta && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono flex-shrink-0 bg-zinc-900 text-zinc-300 border border-zinc-800">
            {deltaPositive !== undefined ? (
              deltaPositive ? (
                <TrendingDown className="w-3 h-3 text-zinc-400" />
              ) : (
                <TrendingUp className="w-3 h-3 text-zinc-400" />
              )
            ) : null}
            {delta}
          </span>
        )}
      </div>
    </MagicBentoCard>
  );
}
