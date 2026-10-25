"use client";

import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

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
}

function StatProgressRing({
  value,
  color = "#2B2B2B",
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
          stroke="#E5E7EB"
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
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#1A1A1A]">
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
}: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="w-24 h-3 bg-[#E5E7EB] rounded animate-pulse" />
          <div className="w-8 h-8 bg-[#F3F4F6] rounded-lg animate-pulse" />
        </div>
        <div className="w-32 h-7 bg-[#E5E7EB] rounded mb-2 animate-pulse" />
        <div className="w-20 h-3 bg-[#E5E7EB] rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] hover:border-[#D1D5DB] transition-all shadow-xs flex flex-col justify-between group">
      <div>
        {/* Header row: Label & Icon in Steel & Smoke tones */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#4D4D4D]">
            {label}
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#2B2B2B] group-hover:bg-[#E5E7EB] transition-colors shadow-2xs">
            {icon}
          </div>
        </div>

        {/* Value and Progress Ring */}
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-2xl sm:text-[28px] font-bold text-[#1A1A1A] cirra-metric leading-tight">
            {value}
          </div>
          {progress !== undefined && (
            <StatProgressRing value={progress} color="#2B2B2B" size={42} strokeWidth={3.5} />
          )}
        </div>
      </div>

      {/* Footer row: Subtitle & Delta badge */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[#F3F4F6] text-xs">
        {sub ? (
          <span className="text-xs text-[#5E5E5E] font-medium truncate" title={sub}>
            {sub}
          </span>
        ) : (
          <span />
        )}

        {delta && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 bg-[#F3F4F6] text-[#2B2B2B] border border-[#E5E7EB] shadow-2xs">
            {deltaPositive !== undefined ? (
              deltaPositive ? (
                <TrendingDown className="w-3 h-3 text-[#4D4D4D]" />
              ) : (
                <TrendingUp className="w-3 h-3 text-[#4D4D4D]" />
              )
            ) : null}
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
