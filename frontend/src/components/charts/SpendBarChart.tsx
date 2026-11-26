"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { MonthlySpendData } from "@/types";
import { formatNumber } from "@/lib/utils";

export interface SpendBarChartProps {
  data: MonthlySpendData[];
  loading?: boolean;
  selectedProvider?: string;
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
      <div className="bg-white rounded-xl p-3.5 border border-[#BCD9FC] shadow-[0_10px_30px_-4px_rgba(12,48,96,0.12)] min-w-[210px] select-none">
        <div className="text-xs font-bold text-[#0A192F] mb-2.5 pb-1.5 border-b border-[#E2EDF8] flex items-center justify-between">
          <span>{label} Spend Total</span>
          <span className="text-[10px] font-semibold text-[#0062E0] bg-[#EBF3FE] px-2 py-0.5 rounded-full border border-[#BCD9FC]">
            FOCUS Normalized
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {payload.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: entry.color }}
                />
                <span className="text-[#4A607A] font-medium">{entry.name}</span>
              </div>
              <span className="font-bold text-[#0A192F] cirra-metric">
                ${formatNumber(Number(entry.value))}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 pt-2 border-t border-[#E2EDF8] flex items-center justify-between text-xs font-bold text-[#0A192F]">
          <span>Combined Billed</span>
          <span className="cirra-metric text-[#0062E0]">${formatNumber(total)}</span>
        </div>
      </div>
    );
  }
  return null;
}

const legendItems = [
  { name: "AWS", color: "#F58536" },
  { name: "GCP", color: "#1A73E8" },
  { name: "OpenAI", color: "#10A37F" },
  { name: "Anthropic", color: "#9333EA" },
];

export function SpendBarChart({
  data,
  loading = false,
  selectedProvider = "All",
}: SpendBarChartProps) {
  if (loading) {
    return (
      <div className="w-full h-[320px] flex items-center justify-center p-4">
        <div className="w-full h-full rounded-xl bg-[#E2EDF8]/60 animate-pulse" />
      </div>
    );
  }

  const getBarOpacity = (provName: string) => {
    if (!selectedProvider || selectedProvider === "All") return 1;
    return selectedProvider.toLowerCase() === provName.toLowerCase() ? 1 : 0.2;
  };

  return (
    <div className="w-full select-none">
      <div className="h-[290px] sm:h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#EBF2FA" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={{ stroke: "#D6E4F5" }}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
              tickFormatter={(val: number) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              dx={-4}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,98,224,0.03)" }} />
            <Bar
              dataKey="aws"
              name="AWS"
              fill="#F58536"
              fillOpacity={getBarOpacity("AWS")}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="gcp"
              name="GCP"
              fill="#1A73E8"
              fillOpacity={getBarOpacity("GCP")}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="openai"
              name="OpenAI"
              fill="#10A37F"
              fillOpacity={getBarOpacity("OpenAI")}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="anthropic"
              name="Anthropic"
              fill="#9333EA"
              fillOpacity={getBarOpacity("Anthropic")}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend bottom */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-4 pt-3.5 border-t border-[#EBF2FA]">
        {legendItems.map((item) => {
          const isDimmed =
            selectedProvider !== "All" &&
            selectedProvider.toLowerCase() !== item.name.toLowerCase();
          return (
            <div
              key={item.name}
              className={`flex items-center gap-2 text-xs font-semibold transition-opacity duration-200 ${
                isDimmed ? "opacity-35 text-[#64748B]" : "text-[#334155]"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{ background: item.color }}
              />
              <span>{item.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
