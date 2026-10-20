import * as React from "react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  subtitle,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-5 flex flex-col justify-between", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        {icon && <div className="text-zinc-400 dark:text-zinc-500">{icon}</div>}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {value}
        </div>

        {(change || subtitle) && (
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            {change && (
              <span
                className={cn(
                  "font-medium",
                  changeType === "positive" && "text-emerald-600 dark:text-emerald-400",
                  changeType === "negative" && "text-rose-600 dark:text-rose-400",
                  changeType === "neutral" && "text-zinc-500"
                )}
              >
                {change}
              </span>
            )}
            {subtitle && (
              <span className="text-zinc-500 dark:text-zinc-400">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
