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
      className="inline-flex items-center bg-[#EAF2FC] p-1 rounded-xl border border-[#D6E4F5] select-none shadow-sm"
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
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3] ${
              isActive
                ? "bg-white text-[#0062E0] shadow-[0_2px_8px_rgba(0,98,224,0.12)] border border-[#BCD9FC]"
                : "text-[#4A607A] hover:text-[#0A192F] hover:bg-white/50"
            }`}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}

