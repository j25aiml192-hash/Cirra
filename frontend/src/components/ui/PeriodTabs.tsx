"use client";

import * as React from "react";
import type { Period } from "@/types";
import { cn } from "@/lib/utils";

export interface PeriodTabsProps {
  value: Period;
  onChange: (p: Period) => void;
}

const pills: Array<{ value: Period; label: string }> = [
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
];

export function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Select period"
      className="inline-flex items-center p-1 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 select-none font-mono text-xs shadow-inner"
    >
      {pills.map((pill) => {
        const isActive = value === pill.value;
        return (
          <button
            key={pill.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(pill.value)}
            className={cn(
              "relative px-3 sm:px-3.5 py-1 rounded-full text-xs transition-all duration-200 cursor-pointer overflow-hidden",
              "focus:outline-none focus:ring-0",
              isActive
                ? "text-white font-bold bg-white/[0.18] border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.3)] backdrop-blur-md"
                : "text-zinc-400 hover:text-white font-medium hover:bg-white/[0.06]"
            )}
          >
            {isActive && (
              <>
                <div className="absolute top-0 inset-x-1 h-[50%] rounded-t-full bg-gradient-to-b from-white/50 via-white/15 to-transparent pointer-events-none" />
                <div className="absolute top-[1px] inset-x-2 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />
              </>
            )}
            <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">{pill.label}</span>
          </button>
        );
      })}
    </div>
  );
}
