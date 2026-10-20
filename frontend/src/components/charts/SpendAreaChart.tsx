"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface SpendAreaChartProps {
  data: Array<{ date: string; amount: number }>;
  loading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const val = payload[0]?.value ?? 0;
    return (
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 10,
          padding: "8px 12px",
          border: "1px solid #F1F5F9",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ fontSize: 11, color: "#94A3B8" }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#4F46E5" }}>
          ${val.toLocaleString()}
        </div>
      </div>
    );
  }
  return null;
}

export function SpendAreaChart({ data, loading = false }: SpendAreaChartProps) {
  if (loading) {
    return (
      <div className="w-full h-[260px] flex items-center justify-center p-4">
        <div className="animate-shimmer w-full h-full rounded-xl" />
      </div>
    );
  }

  return (
    <div style={{ height: 260, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="spendVelocityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#4F46E5"
            strokeWidth={2.5}
            fill="url(#spendVelocityGradient)"
            dot={false}
            activeDot={{ r: 5, fill: "#4F46E5", stroke: "#FFFFFF", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
