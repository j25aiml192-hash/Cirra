"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatNumber } from "@/lib/utils";

const BarChartAny = BarChart as any;
const BarAny = Bar as any;
const XAxisAny = XAxis as any;
const YAxisAny = YAxis as any;
const CartesianGridAny = CartesianGrid as any;
const TooltipAny = Tooltip as any;
const ResponsiveContainerAny = ResponsiveContainer as any;

interface ModelCostChartProps {
  data: Array<{ model: string; cost: number }>;
}

export function ModelCostChart({ data }: ModelCostChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainerAny width="100%" height="100%">
        <BarChartAny
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
        >
          <CartesianGridAny strokeDasharray="3 3" horizontal={false} stroke="#1f1f23" />
          <XAxisAny
            type="number"
            stroke="#EDEAE0"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: number) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <YAxisAny
            type="category"
            dataKey="model"
            stroke="#EDEAE0"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <TooltipAny
            formatter={(value: number) => [`$${formatNumber(value)}`, "Cost"]}
            contentStyle={{
              backgroundColor: "#09090b",
              borderRadius: "12px",
              border: "1px solid #27272a",
              color: "#EDEAE0",
              fontSize: "12px",
              boxShadow: "0 10px 30px -4px rgba(0,0,0,0.5)",
            }}
          />
          <BarAny dataKey="cost" fill="#F59E0B" radius={[0, 4, 4, 0]} />
        </BarChartAny>
      </ResponsiveContainerAny>
    </div>
  );
}
