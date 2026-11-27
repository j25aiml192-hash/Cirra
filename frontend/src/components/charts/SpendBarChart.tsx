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

const BarChartAny = BarChart as any;
const BarAny = Bar as any;
const XAxisAny = XAxis as any;
const YAxisAny = YAxis as any;
const CartesianGridAny = CartesianGrid as any;
const TooltipAny = Tooltip as any;
const ResponsiveContainerAny = ResponsiveContainer as any;

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
      <div className="bg-zinc-950 text-white rounded-xl p-3.5 border border-zinc-800 shadow-xl min-w-[210px] select-none font-mono">
        <div className="text-xs font-bold text-zinc-100 mb-2.5 pb-1.5 border-b border-zinc-800 flex items-center justify-between">
          <span>{label} Spend Total</span>
          <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
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
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ background: entry.color }}
                />
                <span className="text-zinc-400 font-medium">{entry.name}</span>
              </div>
              <span className="font-bold text-zinc-100 cirra-metric">
                ${formatNumber(Number(entry.value))}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-bold text-zinc-200">
          <span>COMBINED</span>
          <span className="cirra-metric text-amber-400 font-bold">${formatNumber(total)}</span>
        </div>
      </div>
    );
  }
  return null;
}

const legendItems = [
  { name: "AWS", color: "#F59E0B" },
  { name: "GCP", color: "#FBBF24" },
  { name: "OpenAI", color: "#FDE047" },
  { name: "Anthropic", color: "#D97706" },
];

export function SpendBarChart({
  data,
  loading = false,
  selectedProvider = "All",
}: SpendBarChartProps) {
  if (loading) {
    return (
      <div className="w-full h-[320px] flex items-center justify-center p-4">
        <div className="w-full h-full rounded-xl bg-zinc-900/60 animate-pulse" />
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
        <ResponsiveContainerAny width="100%" height="100%">
          <BarChartAny data={data} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="barGoldAws" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                <stop offset="100%" stopColor="#B45309" stopOpacity={0.75} />
              </linearGradient>
              <linearGradient id="barGoldGcp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDE047" stopOpacity={1} />
                <stop offset="100%" stopColor="#D97706" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="barGoldOpenai" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity={1} />
                <stop offset="100%" stopColor="#EAB308" stopOpacity={0.65} />
              </linearGradient>
              <linearGradient id="barGoldAnthropic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D97706" stopOpacity={1} />
                <stop offset="100%" stopColor="#78350F" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGridAny stroke="#1f1f23" strokeDasharray="3 3" vertical={false} />
            <XAxisAny
              dataKey="month"
              axisLine={{ stroke: "#27272a" }}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#FFFFFF", fontWeight: 500 }}
              dy={8}
            />
            <YAxisAny
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#FFFFFF", fontWeight: 500 }}
              tickFormatter={(val: number) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              dx={-4}
            />
            <TooltipAny content={<CustomTooltip />} cursor={{ fill: "rgba(245,158,11,0.06)" }} />
            <BarAny
              dataKey="aws"
              name="AWS"
              fill="url(#barGoldAws)"
              fillOpacity={getBarOpacity("AWS")}
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <BarAny
              dataKey="gcp"
              name="GCP"
              fill="url(#barGoldGcp)"
              fillOpacity={getBarOpacity("GCP")}
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <BarAny
              dataKey="openai"
              name="OpenAI"
              fill="url(#barGoldOpenai)"
              fillOpacity={getBarOpacity("OpenAI")}
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <BarAny
              dataKey="anthropic"
              name="Anthropic"
              fill="url(#barGoldAnthropic)"
              fillOpacity={getBarOpacity("Anthropic")}
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
          </BarChartAny>
        </ResponsiveContainerAny>
      </div>

      {/* Legend bottom */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-4 pt-3.5 border-t border-zinc-800/80">
        {legendItems.map((item) => {
          const isDimmed =
            selectedProvider !== "All" &&
            selectedProvider.toLowerCase() !== item.name.toLowerCase();
          return (
            <div
              key={item.name}
              className={`flex items-center gap-2 text-xs font-medium transition-opacity duration-200 ${isDimmed ? "opacity-35 text-zinc-600" : "text-zinc-300"
                }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: item.color }}
              />
              <span className="font-mono text-[11px]">{item.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
