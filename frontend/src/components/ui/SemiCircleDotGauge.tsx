"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export interface MetricItem {
  label: string;
  amount: string;
  change?: string;
  percentage?: string;
  color?: string;
  accentBarColor?: string;
}

export interface SemiCircleDotGaugeProps {
  className?: string;
  totalLabel?: string;
  totalValue?: string;
  subValue?: string;
  outerMetric?: MetricItem;
  innerMetric?: MetricItem;
  outerDotsCount?: number;
  innerDotsCount?: number;
}

export function SemiCircleDotGauge({
  className,
  totalLabel = "TOTAL",
  totalValue = "$2,847",
  subValue = "/day",
  outerMetric = {
    label: "Cloud Infrastructure",
    amount: "$1,902",
    change: "+15.2%",
    percentage: "66.8%",
    color: "#3b82f6",
    accentBarColor: "bg-blue-500",
  },
  innerMetric = {
    label: "AI Foundation Models",
    amount: "$945",
    change: "+8.7%",
    percentage: "33.2%",
    color: "#10b981",
    accentBarColor: "bg-emerald-500",
  },
  outerDotsCount = 28,
  innerDotsCount = 24,
}: SemiCircleDotGaugeProps) {
  const [hoveredRing, setHoveredRing] = useState<"outer" | "inner" | null>(null);

  // SVG Geometry constants
  const cx = 160;
  const cy = 145;
  const outerR = 125;
  const innerR = 98;
  const startAngle = 196; // deg (slightly below horizontal on left)
  const endAngle = -16;   // deg (slightly below horizontal on right)
  const totalSpan = startAngle - endAngle; // 212 deg

  // Generate outer ring dots (Blue / Sapphire glow)
  const outerDots = useMemo(() => {
    return Array.from({ length: outerDotsCount }).map((_, i) => {
      const frac = i / (outerDotsCount - 1);
      const angleDeg = startAngle - frac * totalSpan;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = cx + outerR * Math.cos(angleRad);
      const y = cy - outerR * Math.sin(angleRad);

      // Opacity / brightness based on elevation (highest in middle)
      const sinElev = Math.max(0, Math.sin(angleRad));
      const opacity = 0.35 + 0.65 * sinElev;

      return { x, y, opacity, frac };
    });
  }, [outerDotsCount]);

  // Generate inner ring dots (Green / Emerald glow)
  const innerDots = useMemo(() => {
    return Array.from({ length: innerDotsCount }).map((_, i) => {
      const frac = i / (innerDotsCount - 1);
      const angleDeg = startAngle - frac * totalSpan;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = cx + innerR * Math.cos(angleRad);
      const y = cy - innerR * Math.sin(angleRad);

      const sinElev = Math.max(0, Math.sin(angleRad));
      const opacity = 0.35 + 0.65 * sinElev;

      return { x, y, opacity, frac };
    });
  }, [innerDotsCount]);

  return (
    <div className={cn("w-full flex flex-col items-center select-none", className)}>
      {/* Semi-circular dot arch */}
      <div className="relative w-full max-w-[320px] aspect-[320/195] flex items-center justify-center">
        <svg
          viewBox="0 0 320 185"
          className="w-full h-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {/* Outer ring radial glow defs */}
            <radialGradient id="outer-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.3" />
            </radialGradient>

            {/* Inner ring radial glow defs */}
            <radialGradient id="inner-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.3" />
            </radialGradient>
          </defs>

          {/* Outer Ring Dots (Blue) */}
          <g
            className="transition-opacity duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredRing("outer")}
            onMouseLeave={() => setHoveredRing(null)}
            style={{
              opacity: hoveredRing === "inner" ? 0.4 : 1,
            }}
          >
            {outerDots.map((dot, idx) => (
              <circle
                key={`outer-${idx}`}
                cx={dot.x}
                cy={dot.y}
                r={hoveredRing === "outer" ? 5.5 : 5}
                fill={
                  dot.opacity > 0.75
                    ? "#4f75f5"
                    : dot.opacity > 0.5
                    ? "#3b82f6"
                    : "#253b6e"
                }
                opacity={dot.opacity}
                className="transition-all duration-200"
              />
            ))}
          </g>

          {/* Inner Ring Dots (Green) */}
          <g
            className="transition-opacity duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredRing("inner")}
            onMouseLeave={() => setHoveredRing(null)}
            style={{
              opacity: hoveredRing === "outer" ? 0.4 : 1,
            }}
          >
            {innerDots.map((dot, idx) => (
              <circle
                key={`inner-${idx}`}
                cx={dot.x}
                cy={dot.y}
                r={hoveredRing === "inner" ? 5 : 4.5}
                fill={
                  dot.opacity > 0.75
                    ? "#10b981"
                    : dot.opacity > 0.5
                    ? "#059669"
                    : "#133827"
                }
                opacity={dot.opacity}
                className="transition-all duration-200"
              />
            ))}
          </g>
        </svg>

        {/* Center Total Display (matching Image 2) */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-3 text-center pointer-events-none">
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-zinc-400">
            {totalLabel}
          </span>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-sans">
              {totalValue}
            </span>
            {subValue && (
              <span className="text-xs font-normal text-zinc-500 font-mono">
                {subValue}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom 2-Column Metric Breakdown (Exact replica of Image 2) */}
      <div className="w-full grid grid-cols-2 gap-4 pt-4 mt-2 border-t border-zinc-850/60 font-sans">
        {/* Left Column (Outer ring / Blue) */}
        <div
          onMouseEnter={() => setHoveredRing("outer")}
          onMouseLeave={() => setHoveredRing(null)}
          className={cn(
            "space-y-1 transition-all duration-200 rounded-lg p-1.5 -m-1.5 cursor-pointer",
            hoveredRing === "outer" ? "bg-zinc-900/60" : ""
          )}
        >
          {/* Label with Vertical Blue Bar */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-[2.5px] h-3.5 rounded-full",
                outerMetric.accentBarColor || "bg-blue-500"
              )}
            />
            <span className="text-xs font-medium text-zinc-300 truncate">
              {outerMetric.label}
            </span>
          </div>

          {/* Amount */}
          <div className="text-xl font-bold text-white tracking-tight pl-2.5">
            {outerMetric.amount}
          </div>

          {/* Change / percentage badge */}
          {(outerMetric.change || outerMetric.percentage) && (
            <div className="text-[11px] font-semibold text-blue-400 pl-2.5 flex items-center gap-1">
              <span>{outerMetric.change}</span>
              {outerMetric.percentage && (
                <span className="text-zinc-500 font-normal">
                  ({outerMetric.percentage})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Column (Inner ring / Green) */}
        <div
          onMouseEnter={() => setHoveredRing("inner")}
          onMouseLeave={() => setHoveredRing(null)}
          className={cn(
            "space-y-1 transition-all duration-200 rounded-lg p-1.5 -m-1.5 cursor-pointer",
            hoveredRing === "inner" ? "bg-zinc-900/60" : ""
          )}
        >
          {/* Label with Vertical Green Bar */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-[2.5px] h-3.5 rounded-full",
                innerMetric.accentBarColor || "bg-emerald-500"
              )}
            />
            <span className="text-xs font-medium text-zinc-300 truncate">
              {innerMetric.label}
            </span>
          </div>

          {/* Amount */}
          <div className="text-xl font-bold text-white tracking-tight pl-2.5">
            {innerMetric.amount}
          </div>

          {/* Change / percentage badge */}
          {(innerMetric.change || innerMetric.percentage) && (
            <div className="text-[11px] font-semibold text-blue-400 pl-2.5 flex items-center gap-1">
              <span>{innerMetric.change}</span>
              {innerMetric.percentage && (
                <span className="text-zinc-500 font-normal">
                  ({innerMetric.percentage})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
