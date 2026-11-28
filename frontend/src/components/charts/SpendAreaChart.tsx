"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatNumber } from "@/lib/utils";

const AreaChartAny = AreaChart as any;
const AreaAny = Area as any;
const XAxisAny = XAxis as any;
const YAxisAny = YAxis as any;
const TooltipAny = Tooltip as any;
const ResponsiveContainerAny = ResponsiveContainer as any;
const CartesianGridAny = CartesianGrid as any;

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface MultiCloudSpendDataPoint {
  date: string;
  amount: number;
  aws?: number;
  gcp?: number;
}

export interface MultiCloudSpendChartProps {
  data: MultiCloudSpendDataPoint[];
  loading?: boolean;
  selectedProvider?: string;
}

export interface SpendVelocityChartProps {
  data: Array<{ date: string; amount: number }>;
  loading?: boolean;
}

export interface SpendAreaChartProps {
  data: Array<{ date: string; amount: number; aws?: number; gcp?: number }>;
  loading?: boolean;
  selectedProvider?: string;
}

/* -------------------------------------------------------------------------- */
/* Tooltip for Multi-Cloud Stacked Chart                                      */
/* -------------------------------------------------------------------------- */

interface MultiCloudTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function MultiCloudTooltip({ active, payload, label }: MultiCloudTooltipProps) {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, item) => sum + (item.value || 0), 0);

    return (
      <div className="bg-[#09090b] rounded-xl p-3.5 border border-zinc-800 shadow-2xl min-w-[200px] select-none font-mono">
        <div className="text-xs font-bold text-white mb-2 pb-1.5 border-b border-zinc-800 flex items-center justify-between">
          <span>{label} Billing</span>
          <span className="text-[10px] font-semibold text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded-full border border-zinc-800">
            FOCUS 1.0
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: entry.color }}
                />
                <span className="text-zinc-400 font-medium">{entry.name}</span>
              </div>
              <span className="font-bold text-white cirra-metric">
                ${formatNumber(Math.round(entry.value))}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-bold text-white">
          <span>Combined Spend</span>
          <span className="cirra-metric text-white font-mono">
            ${formatNumber(Math.round(total))}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Tooltip for Single Velocity Chart                                          */
/* -------------------------------------------------------------------------- */

interface VelocityTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
  }>;
  label?: string;
}

function VelocityTooltip({ active, payload, label }: VelocityTooltipProps) {
  if (active && payload && payload.length) {
    const val = payload[0]?.value ?? 0;
    return (
      <div className="bg-[#09090b] rounded-xl p-3 border border-zinc-800 shadow-2xl select-none font-mono">
        <div className="text-[11px] font-medium text-zinc-400">{label} Telemetry</div>
        <div className="text-sm font-bold text-white cirra-metric mt-0.5">
          ${formatNumber(Math.round(val))}
          <span className="text-[11px] font-normal text-zinc-500 ml-1">/ day</span>
        </div>
      </div>
    );
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Component 1: MultiCloudSpendChart (Layered Stacked Area Chart)             */
/* -------------------------------------------------------------------------- */

export function MultiCloudSpendChart({
  data,
  loading = false,
  selectedProvider = "all",
}: MultiCloudSpendChartProps) {
  if (loading) {
    return (
      <div className="w-full h-[270px] flex items-center justify-center p-4">
        <div className="w-full h-full rounded-xl bg-zinc-900/60 animate-pulse" />
      </div>
    );
  }

  // Calculate provider visibility
  const showAws = selectedProvider === "all" || selectedProvider.toUpperCase() === "AWS";
  const showGcp = selectedProvider === "all" || selectedProvider.toUpperCase() === "GCP";

  return (
    <div className="w-full relative select-none">
      {/* Chart container */}
      <div className="h-[270px] w-full">
        <ResponsiveContainerAny width="100%" height="100%">
          <AreaChartAny
            data={data}
            margin={{ top: 18, right: 12, left: -14, bottom: 0 }}
          >
            <defs>
              {/* AWS Golden gradient fill */}
              <linearGradient id="cirraAwsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.4} />
                <stop offset="60%" stopColor="#D97706" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#B45309" stopOpacity={0.02} />
              </linearGradient>

              {/* GCP Dark Green gradient fill */}
              <linearGradient id="cirraGcpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity={0.4} />
                <stop offset="60%" stopColor="#047857" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#064e3b" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGridAny
              stroke="#1f1f23"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxisAny
              dataKey="date"
              axisLine={{ stroke: "#27272a" }}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#a1a1aa", fontWeight: 500 }}
              interval="preserveStartEnd"
              minTickGap={28}
              tickFormatter={(val: string) => {
                if (!val) return "";
                const parts = val.split("-");
                if (parts.length === 3 && parts[1]) {
                  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  const m = parseInt(parts[1], 10) - 1;
                  return `${months[m] || parts[1]} ${parts[2] || ""}`;
                }
                return val;
              }}
              dy={6}
            />

            <YAxisAny
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#71717a", fontWeight: 500 }}
              tickFormatter={(val: number) =>
                `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`
              }
              dx={-4}
            />

            <TooltipAny content={<MultiCloudTooltip />} />

            {/* AWS Area (Bottom layer of stack) */}
            {showAws && (
              <AreaAny
                type="monotone"
                dataKey="aws"
                name="AWS"
                stackId="1"
                stroke="#F59E0B"
                strokeWidth={2}
                fill="url(#cirraAwsGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#F59E0B",
                  stroke: "#000000",
                  strokeWidth: 2,
                }}
              />
            )}

            {/* GCP Area (Top layer of stack) */}
            {showGcp && (
              <AreaAny
                type="monotone"
                dataKey="gcp"
                name="GCP"
                stackId="1"
                stroke="#059669"
                strokeWidth={2}
                fill="url(#cirraGcpGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#10B981",
                  stroke: "#000000",
                  strokeWidth: 2,
                }}
              />
            )}
          </AreaChartAny>
        </ResponsiveContainerAny>
      </div>

      {/* Provider share indicators */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-800/80 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs text-zinc-300 font-sans">AWS</span>
            <span className="text-xs text-zinc-400 font-mono">63.8%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="text-xs text-zinc-300 font-sans">GCP</span>
            <span className="text-xs text-zinc-400 font-mono">36.2%</span>
          </div>
        </div>

        <div className="text-[11px] text-zinc-500 font-mono">
          Daily smoothed
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Component 2: SpendVelocityChart (Smoothed Daily Spend Velocity)            */
/* -------------------------------------------------------------------------- */

export function SpendVelocityChart({
  data,
  loading = false,
}: SpendVelocityChartProps) {
  if (loading) {
    return (
      <div className="w-full h-[270px] flex items-center justify-center p-4">
        <div className="w-full h-full rounded-xl bg-zinc-900/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      <div className="h-[270px] w-full">
        <ResponsiveContainerAny width="100%" height="100%">
          <AreaChartAny
            data={data}
            margin={{ top: 18, right: 10, left: -14, bottom: 0 }}
          >
            <defs>
              <linearGradient id="cirraVelocityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity={0.45} />
                <stop offset="60%" stopColor="#047857" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#064e3b" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGridAny
              stroke="#1f1f23"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxisAny
              dataKey="date"
              axisLine={{ stroke: "#27272a" }}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#a1a1aa", fontWeight: 500 }}
              interval="preserveStartEnd"
              minTickGap={28}
              tickFormatter={(val: string) => {
                if (!val) return "";
                const parts = val.split("-");
                if (parts.length === 3 && parts[1]) {
                  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  const m = parseInt(parts[1], 10) - 1;
                  return `${months[m] || parts[1]} ${parts[2] || ""}`;
                }
                return val;
              }}
              dy={6}
            />

            <YAxisAny
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#71717a", fontWeight: 500 }}
              tickFormatter={(val: number) =>
                `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`
              }
              dx={-4}
            />

            <TooltipAny content={<VelocityTooltip />} />

            <AreaAny
              type="monotone"
              dataKey="amount"
              name="Velocity"
              stroke="#059669"
              strokeWidth={2}
              fill="url(#cirraVelocityGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#10B981",
                stroke: "#000000",
                strokeWidth: 2,
              }}
            />
          </AreaChartAny>
        </ResponsiveContainerAny>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-800/80 text-xs font-mono">
        <span className="text-[13px] text-zinc-300 font-semibold">Daily Telemetry Rate</span>
        <span className="text-[13px] font-semibold text-white bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">
          ±4.2% Stability
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Default Export: SpendAreaChart (Backward Compatible)                       */
/* -------------------------------------------------------------------------- */

export function SpendAreaChart({
  data,
  loading = false,
  selectedProvider,
}: SpendAreaChartProps) {
  const first = data[0];
  const hasMultiProvider = Boolean(first && ("aws" in first || "gcp" in first));

  if (hasMultiProvider) {
    return (
      <MultiCloudSpendChart
        data={data as MultiCloudSpendDataPoint[]}
        loading={loading}
        selectedProvider={selectedProvider}
      />
    );
  }

  return <SpendVelocityChart data={data} loading={loading} />;
}
