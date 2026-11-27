"use client";

import * as React from "react";
import { formatNumber } from "@/lib/utils";

export interface HeatmapDay {
  date: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  count: number;
  spend: number;
  dateStr: string;
  isFuture: boolean;
}

export interface SpendHeatmapChartProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

// 5 exact color levels matching the user's reference teal/emerald ramp
const COLOR_RAMP = [
  "#161b22", // Level 0: Inactive dark slate
  "#154c46", // Level 1: Deep teal
  "#207a70", // Level 2: Medium sea teal
  "#2da496", // Level 3: Bright teal
  "#38dfca", // Level 4: Luminous glowing teal/cyan
];

export function SpendHeatmapChart({
  title = "$85,420 Spend Velocity",
  subtitle = "1,648 telemetry events ingested · ±4.2% daily velocity stability · 34 day streak",
  className = "",
}: SpendHeatmapChartProps) {
  // Deterministic 32-bit Murmur/FNV date hash for organic random scatter without diagonal repetition
  const hashDate = (str: string): number => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    }
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };

  // Generate 52 weeks leading up to today (Nov 27, 2026)
  const { gridData, monthMarkers } = React.useMemo(() => {
    // Current date anchor in application context
    const today = new Date(2026, 10, 27); // Nov 27, 2026
    today.setHours(23, 59, 59, 999);

    // End on Saturday Nov 28, 2026 to complete the 52nd week
    const endDate = new Date(2026, 10, 28);
    const totalDays = 52 * 7;
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    const weeks: HeatmapDay[][] = [];
    const months: { text: string; col: number }[] = [];
    let lastMonth = -1;

    let dayCursor = new Date(startDate);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let w = 0; w < 52; w++) {
      const week: HeatmapDay[] = [];
      const colMonth = dayCursor.getMonth();

      // Record month column indicator without overcrowding
      if (colMonth !== lastMonth && (w - (months[months.length - 1]?.col ?? -10) >= 3)) {
        months.push({ text: monthNames[colMonth] ?? "", col: w });
        lastMonth = colMonth;
      }

      for (let d = 0; d < 7; d++) {
        const isFuture = dayCursor > today;
        const dateIso = dayCursor.toISOString().split("T")[0] ?? "";
        let count = 0;
        let spend = 0;

        // ONLY mark dates up to today. NEVER mark future dates!
        // Uses pseudo-random hash of date string to create an organic, realistic distribution (no diagonal streaks)
        if (!isFuture) {
          const r = hashDate(dateIso);
          const rSpend = hashDate(dateIso + "_spend");

          // ~22% empty/low days (level 0), ~30% level 1, ~25% level 2, ~13% level 3, ~10% level 4
          if (r >= 0.22) {
            if (r > 0.90) {
              // Level 4 (Highest velocity / active clusters)
              count = Math.floor(14 + rSpend * 12);
              spend = Math.floor(3000 + rSpend * 2200);
            } else if (r > 0.76) {
              // Level 3 (High velocity)
              count = Math.floor(8 + rSpend * 5);
              spend = Math.floor(1700 + rSpend * 1100);
            } else if (r > 0.50) {
              // Level 2 (Moderate velocity)
              count = Math.floor(4 + rSpend * 4);
              spend = Math.floor(850 + rSpend * 800);
            } else {
              // Level 1 (Low velocity)
              count = Math.floor(1 + rSpend * 3);
              spend = Math.floor(300 + rSpend * 500);
            }
          }
        }

        const dateOptions: Intl.DateTimeFormatOptions = {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        };
        const dateStr = dayCursor.toLocaleDateString("en-US", dateOptions);

        week.push({
          date: dateIso,
          dayOfWeek: d,
          count,
          spend,
          dateStr,
          isFuture,
        });

        dayCursor.setDate(dayCursor.getDate() + 1);
      }
      weeks.push(week);
    }

    return { gridData: weeks, monthMarkers: months };
  }, []);

  const [hoveredDay, setHoveredDay] = React.useState<HeatmapDay | null>(null);

  const getLevel = (count: number) => {
    if (count === 0) return 0;
    if (count <= 3) return 1;
    if (count <= 7) return 2;
    if (count <= 12) return 3;
    return 4;
  };

  return (
    <div
      className={`bg-[#09090b] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 select-none font-mono flex flex-col justify-between ${className}`}
    >
      {/* Top Header Row in Cirra Spend Velocity context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-[#EDEAE0] text-base sm:text-[18px] tracking-tight">
              {title}
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            {subtitle}
          </p>
        </div>

        {/* Less ... More legend */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono self-end sm:self-auto">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {COLOR_RAMP.map((color, idx) => (
              <span
                key={idx}
                className="w-3 h-3 rounded-[2.5px] border border-black/40 inline-block transition-transform hover:scale-125"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* SVG 52-Week Matrix Grid */}
      <div className="w-full overflow-x-auto pb-1 pt-1">
        <svg
          viewBox="0 0 740 120"
          className="w-full h-auto min-w-[650px] overflow-visible"
        >
          {/* Month labels along the top (aligned with actual calendar weeks) */}
          <g className="text-[10px] font-mono fill-zinc-400">
            {monthMarkers.map((m, idx) => (
              <text
                key={idx}
                x={36 + m.col * 13.2}
                y={11}
                textAnchor="start"
                fill="#a1a1aa"
                fontSize="10"
              >
                {m.text}
              </text>
            ))}
          </g>

          {/* Weekday labels along the left side (Mon, Wed, Fri) */}
          <g className="text-[10px] font-mono fill-zinc-400">
            <text x={0} y={38} fill="#a1a1aa" fontSize="10">
              Mon
            </text>
            <text x={0} y={64} fill="#a1a1aa" fontSize="10">
              Wed
            </text>
            <text x={0} y={90} fill="#a1a1aa" fontSize="10">
              Fri
            </text>
          </g>

          {/* 52 Columns x 7 Rows Grid of Rounded Rectangles */}
          <g transform="translate(36, 18)">
            {gridData.map((week, wIdx) => (
              <g key={wIdx} transform={`translate(${wIdx * 13.2}, 0)`}>
                {week.map((day, dIdx) => {
                  const level = getLevel(day.count);
                  const isHovered = hoveredDay?.date === day.date;
                  return (
                    <rect
                      key={dIdx}
                      x={0}
                      y={dIdx * 13}
                      width={10.5}
                      height={10.5}
                      rx={2.2}
                      ry={2.2}
                      fill={day.isFuture ? "#101418" : COLOR_RAMP[level]}
                      className="cursor-pointer transition-all duration-150"
                      style={{
                        opacity: day.isFuture ? 0.35 : 1,
                        stroke: isHovered
                          ? "#ffffff"
                          : day.isFuture
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(0,0,0,0.4)",
                        strokeWidth: isHovered ? 1.5 : 0.5,
                      }}
                      onMouseEnter={() => setHoveredDay(day)}
                    />
                  );
                })}
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Interactive inspection status line in Cirra FinOps context */}
      <div className="mt-3 pt-3 border-t border-zinc-800/80 text-xs text-zinc-400 font-mono flex items-center justify-between">
        <div>
          {hoveredDay ? (
            hoveredDay.isFuture ? (
              <span className="text-zinc-500 font-medium">
                Upcoming billing cycle on {hoveredDay.dateStr} (no spend telemetry yet)
              </span>
            ) : hoveredDay.count > 0 ? (
              <span className="text-[#EDEAE0] font-medium">
                <strong className="text-[#38dfca]">{hoveredDay.count} billing events</strong> on{" "}
                {hoveredDay.dateStr} (${formatNumber(hoveredDay.spend)} spend velocity)
              </span>
            ) : (
              <span>No spend events recorded on {hoveredDay.dateStr}</span>
            )
          ) : (
            <span className="text-[#EDEAE0]">
              <strong className="text-[#38dfca]">18 billing events</strong> on Fri, Nov 27, 2026 ($2,840 spend velocity)
            </span>
          )}
        </div>
        <span className="text-[11px] text-zinc-500 hidden sm:inline">
          FOCUS 1.0 Telemetry Matrix
        </span>
      </div>
    </div>
  );
}
