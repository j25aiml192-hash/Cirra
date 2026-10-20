"use client";

import * as React from "react";
import type { Period } from "@/types";

export interface PeriodTabsProps {
  value: Period;
  onChange: (p: Period) => void;
}

const pills: Array<{ value: Period; label: string }> = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "6m", label: "6 Months" },
  { value: "12m", label: "12 Months" },
];

export function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {pills.map((pill) => {
        const isActive = value === pill.value;
        return (
          <button
            key={pill.value}
            type="button"
            onClick={() => onChange(pill.value)}
            style={{
              background: isActive ? "#4F46E5" : "rgba(255,255,255,0.7)",
              color: isActive ? "#FFFFFF" : "#475569",
              border: isActive ? "1px solid #4F46E5" : "1px solid rgba(0,0,0,0.08)",
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: isActive ? "0 2px 8px rgba(79, 70, 229, 0.25)" : "none",
            }}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}
