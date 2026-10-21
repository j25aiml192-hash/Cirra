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
      <div className="bg-white rounded-xl p-3.5 border border-[#BCD9FC] shadow-[0_10px_30px_-4px_rgba(12,48,96,0.12)] min-w-[200px] select-none">
        <div className="text-xs font-bold text-[#0A192F] mb-2 pb-1.5 border-b border-[#E2EDF8] flex items-center justify-between">
          <span>{label} Billing</span>
          <span className="text-[10px] font-semibold text-[#0062E0] bg-[#EBF3FE] px-1.5 py-0.5 rounded-full border border-[#BCD9FC]">
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
                <span className="text-[#4A607A] font-medium">{entry.name}</span>
              </div>
              <span className="font-bold text-[#0A192F] cirra-metric">
                ${Math.round(entry.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#E2EDF8] flex items-center justify-between text-xs font-bold text-[#0A192F]">
          <span>Combined Spend</span>
          <span className="cirra-metric text-[#0062E0]">
            ${Math.round(total).toLocaleString()}
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
      <div className="bg-white rounded-xl p-3 border border-[#BCD9FC] shadow-[0_8px_24px_-4px_rgba(12,48,96,0.12)] select-none">
        <div className="text-[11px] font-medium text-[#7E93AB]">{label} Telemetry</div>
        <div className="text-sm font-bold text-[#0A192F] cirra-metric mt-0.5">
          ${Math.round(val).toLocaleString()}
          <span className="text-[11px] font-normal text-[#5A6E85] ml-1">/ day</span>
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
        <div className="w-full h-full rounded-xl bg-[#E2EDF8]/60 animate-pulse" />
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
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 18, right: 12, left: -14, bottom: 0 }}
          >
            <defs>
              {/* AWS Lavender/Purple gradient fill */}
              <linearGradient id="cirraAwsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.42} />
                <stop offset="60%" stopColor="#818CF8" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#A5B4FC" stopOpacity={0.08} />
              </linearGradient>

              {/* GCP Teal/Mint gradient fill */}
              <linearGradient id="cirraGcpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D9488" stopOpacity={0.42} />
                <stop offset="60%" stopColor="#14B8A6" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#5EEAD4" stopOpacity={0.08} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#EBF2FA"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              axisLine={{ stroke: "#D6E4F5" }}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
              dy={6}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
              tickFormatter={(val: number) =>
                `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`
              }
              dx={-4}
            />

            <Tooltip content={<MultiCloudTooltip />} />

            {/* AWS Area (Bottom layer of stack) */}
            {showAws && (
              <Area
                type="monotone"
                dataKey="aws"
                name="AWS"
                stackId="1"
                stroke="#6366F1"
                strokeWidth={2.2}
                fill="url(#cirraAwsGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#6366F1",
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
              />
            )}

            {/* GCP Area (Top layer of stack) */}
            {showGcp && (
              <Area
                type="monotone"
                dataKey="gcp"
                name="GCP"
                stackId="1"
                stroke="#0D9488"
                strokeWidth={2.2}
                fill="url(#cirraGcpGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#0D9488",
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Floating provider indicators & Legend matching reference aesthetic */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#EBF2FA] text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1] shadow-xs" />
            <span className="text-xs font-medium text-[#334155]">AWS Infrastructure</span>
            <span className="text-xs text-slate-700 font-medium font-mono">63.8%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488] shadow-xs" />
            <span className="text-xs font-medium text-[#334155]">GCP Infrastructure</span>
            <span className="text-xs text-slate-700 font-medium font-mono">36.2%</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
          <span>Interpolation:</span>
          <span className="text-[#0062E0] font-medium">Monotone Spline</span>
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
        <div className="w-full h-full rounded-xl bg-[#E2EDF8]/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      <div className="h-[270px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 18, right: 10, left: -14, bottom: 0 }}
          >
            <defs>
              <linearGradient id="cirraVelocityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.32} />
                <stop offset="60%" stopColor="#6366F1" stopOpacity={0.14} />
                <stop offset="100%" stopColor="#818CF8" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#EBF2FA"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              axisLine={{ stroke: "#D6E4F5" }}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
              dy={6}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
              tickFormatter={(val: number) =>
                `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`
              }
              dx={-4}
            />

            <Tooltip content={<VelocityTooltip />} />

            <Area
              type="monotone"
              dataKey="amount"
              name="Velocity"
              stroke="#4F46E5"
              strokeWidth={2.5}
              fill="url(#cirraVelocityGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#4F46E5",
                stroke: "#FFFFFF",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#EBF2FA] text-xs">
        <span className="text-[13px] text-[#334155] font-semibold">Daily Telemetry Rate</span>
        <span className="text-[13px] font-semibold text-[#0D824D] bg-[#E6F8F0] border border-[#B3ECCB] px-2 py-0.5 rounded-full">
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
