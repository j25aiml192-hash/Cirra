"use client";

import * as React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const LineChartAny = LineChart as any;
const LineAny = Line as any;
const ResponsiveContainerAny = ResponsiveContainer as any;

interface SparklineProps {
  data: number[];
  color?: string;
}

export function Sparkline({ data, color = "#F59E0B" }: SparklineProps) {
  const chartData = data.map((val, idx) => ({ i: idx, value: val }));

  return (
    <div className="h-9 w-24">
      <ResponsiveContainerAny width="100%" height="100%">
        <LineChartAny data={chartData}>
          <LineAny
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChartAny>
      </ResponsiveContainerAny>
    </div>
  );
}
