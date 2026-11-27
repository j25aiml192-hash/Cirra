"use client";

import * as React from "react";
import type { Period } from "@/types";

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
      className="inline-flex items-center p-1 rounded-full bg-zinc-900/90 border border-zinc-800 select-none font-mono text-xs"
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
            className={`px-3 sm:px-3.5 py-1 rounded-full text-xs transition-all duration-200 cursor-pointer focus:outline-none ${
              isActive
                ? "bg-zinc-100 hover:bg-white text-black font-bold shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                : "text-zinc-400 hover:text-white font-medium hover:bg-zinc-800/60"
            }`}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}
