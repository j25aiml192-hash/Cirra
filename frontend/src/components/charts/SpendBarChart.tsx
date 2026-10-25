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
import { BarChart3 } from "lucide-react";
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
      <div className="bg-white rounded-xl p-3.5 border border-[#E5E7EB] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] min-w-[210px] select-none">
        <div className="text-xs font-bold text-[#1A1A1A] mb-2.5 pb-1.5 border-b border-[#F3F4F6] flex items-center justify-between">
          <span>{label} Spend Total</span>
          <span className="text-[10px] font-semibold text-[#2B2B2B] bg-[#F3F4F6] px-2 py-0.5 rounded-full border border-[#E5E7EB]">
            FOCUS 1.0
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
                <span className="text-[#4D4D4D] font-medium">{entry.name}</span>
              </div>
              <span className="font-bold text-[#1A1A1A] cirra-metric">
                ${formatNumber(Number(entry.value))}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 pt-2 border-t border-[#F3F4F6] flex items-center justify-between text-xs font-bold text-[#1A1A1A]">
          <span>Combined Billed</span>
          <span className="cirra-metric text-[#1A1A1A]">${formatNumber(total)}</span>
        </div>
      </div>
    );
  }
  return null;
}

// Steel & Smoke shades for multi-cloud & AI providers
const legendItems = [
  { name: "AWS", color: "#1A1A1A" },       // Obsidian Shadow
  { name: "GCP", color: "#3C3C3C" },       // Urban Asphalt
  { name: "OpenAI", color: "#5E5E5E" },    // Graphite Smoke
  { name: "Anthropic", color: "#808080" }, // Classic Grey
];

export function SpendBarChart({
  data,
  loading = false,
  selectedProvider = "All",
}: SpendBarChartProps) {
  if (loading) {
    return (
      <div className="w-full h-[320px] flex items-center justify-center p-4">
        <div className="w-full h-full rounded-xl bg-[#F3F4F6] animate-pulse" />
      </div>
    );
  }

  // Authentic Empty State when no real data has been ingested yet
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#D1D5DB] rounded-2xl bg-[#F9FAFB]/50">
        <div className="w-12 h-12 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#4D4D4D] mb-3">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-[#1A1A1A] mb-1">
          No Spend Trajectory Recorded
        </h4>
        <p className="text-xs text-[#6F6F6F] max-w-sm">
          Connect your AWS, GCP, or AI foundation model accounts in Settings to stream and visualize monthly FOCUS billing data.
        </p>
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
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6F6F6F", fontWeight: 500 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6F6F6F", fontWeight: 500 }}
              tickFormatter={(val: number) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              dx={-4}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar
              dataKey="aws"
              name="AWS"
              fill="#1A1A1A"
              fillOpacity={getBarOpacity("AWS")}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="gcp"
              name="GCP"
              fill="#3C3C3C"
              fillOpacity={getBarOpacity("GCP")}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="openai"
              name="OpenAI"
              fill="#5E5E5E"
              fillOpacity={getBarOpacity("OpenAI")}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="anthropic"
              name="Anthropic"
              fill="#808080"
              fillOpacity={getBarOpacity("Anthropic")}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend in Steel & Smoke shades */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-4 pt-3.5 border-t border-[#F3F4F6]">
        {legendItems.map((item) => {
          const isDimmed =
            selectedProvider !== "All" &&
            selectedProvider.toLowerCase() !== item.name.toLowerCase();
          return (
            <div
              key={item.name}
              className={`flex items-center gap-2 text-xs font-semibold transition-opacity duration-200 ${
                isDimmed ? "opacity-35 text-[#808080]" : "text-[#2B2B2B]"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shadow-2xs"
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
