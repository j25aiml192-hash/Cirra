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
      className="inline-flex items-center p-1 rounded-full bg-[#E5EBF2] border border-[#D5E0EB] select-none shadow-inner"
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
            className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#181B20] ${
              isActive
                ? "bg-[#181B20] text-white shadow-xs"
                : "text-[#4A5E73] hover:text-[#0A192F] hover:bg-white/40 font-medium"
            }`}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}
