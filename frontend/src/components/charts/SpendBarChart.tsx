"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { MonthlySpendData } from "@/types";

export interface SpendBarChartProps {
  data: MonthlySpendData[];
  loading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, item) => sum + item.value, 0);

    return (
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          padding: "12px 16px",
          border: "1px solid #F1F5F9",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          minWidth: 180,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
          {label} Spend
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {payload.map((entry, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: entry.color,
                  }}
                />
                <span style={{ color: "#64748B" }}>{entry.name}</span>
              </div>
              <span style={{ fontWeight: 600, color: "#0F172A" }}>
                ${entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid #F1F5F9",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            fontWeight: 700,
            color: "#0F172A",
          }}
        >
          <span>Total</span>
          <span>${total.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
}

const legendItems = [
  { name: "AWS", color: "#F59E0B" },
  { name: "GCP", color: "#3B82F6" },
  { name: "OpenAI", color: "#10B981" },
  { name: "Anthropic", color: "#7C3AED" },
];

export function SpendBarChart({ data, loading = false }: SpendBarChartProps) {
  if (loading) {
    return (
      <div className="w-full h-[280px] flex items-center justify-center p-4">
        <div className="animate-shimmer w-full h-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div style={{ height: 280, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#94A3B8" }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
            <Bar dataKey="aws" name="AWS" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            <Bar dataKey="gcp" name="GCP" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            <Bar dataKey="openai" name="OpenAI" fill="#10B981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="anthropic" name="Anthropic" fill="#7C3AED" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend bottom */}
      <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-slate-100">
        {legendItems.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: item.color }}
            />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
