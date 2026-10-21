"use client";

import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export type StatCardVariant = 'blue' | 'green' | 'red' | 'amber' | 'violet';

export interface StatCardProps {
  variant: StatCardVariant;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  delta?: string;          // e.g. "+4.2%"
  deltaPositive?: boolean; // green if true, red if false
  progress?: number;       // 0–100, shows ring if provided
  loading?: boolean;
}

function StatProgressRing({
  value,
  color = "#0062E0",
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
          stroke="#E2EDF8"
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
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#0A192F]">
        {Math.round(clamped)}%
      </div>
    </div>
  );
}

export function StatCard({
  variant,
  icon,
  label,
  value,
  sub,
  delta,
  deltaPositive = false,
  progress,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="cirra-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="w-24 h-3 bg-[#E2EDF8] rounded animate-pulse" />
          <div className="w-7 h-7 bg-[#E2EDF8] rounded-lg animate-pulse" />
        </div>
        <div className="w-32 h-7 bg-[#E2EDF8] rounded mb-2 animate-pulse" />
        <div className="w-20 h-3 bg-[#E2EDF8] rounded animate-pulse" />
      </div>
    );
  }

  const ringColor =
    variant === "green"
      ? "#10A37F"
      : variant === "amber"
      ? "#F58536"
      : variant === "red"
      ? "#EA3943"
      : "#0062E0";

  return (
    <div className="cirra-card p-5 flex flex-col justify-between group">
      <div>
        {/* Header row: Label & Icon */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A6E85]">
            {label}
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#EBF3FE] border border-[#BCD9FC]/80 flex items-center justify-center text-[#0062E0] group-hover:scale-105 transition-transform">
            {icon}
          </div>
        </div>

        {/* Value and Ring */}
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-2xl sm:text-[28px] font-bold text-[#0A192F] cirra-metric leading-tight">
            {value}
          </div>
          {progress !== undefined && (
            <StatProgressRing value={progress} color={ringColor} size={42} strokeWidth={3.5} />
          )}
        </div>
      </div>

      {/* Footer row: Subtitle & Delta badge */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[#D6E4F5]/70 text-xs">
        {sub ? (
          <span className="text-xs text-[#5A6E85] font-medium truncate" title={sub}>
            {sub}
          </span>
        ) : (
          <span />
        )}

        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 shadow-sm ${
              deltaPositive
                ? "bg-[#E6F8F0] text-[#0D824D] border border-[#B3ECCB]"
                : "bg-[#FEECEC] text-[#DC2626] border border-[#FECACA]"
            }`}
          >
            {deltaPositive ? (
              <TrendingDown className="w-3 h-3 text-[#0D824D]" />
            ) : (
              <TrendingUp className="w-3 h-3 text-[#DC2626]" />
            )}
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

