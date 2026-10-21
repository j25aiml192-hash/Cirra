import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'indigo';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-green-50 text-green-700 border border-green-200/50",
  warning: "bg-amber-50 text-amber-700 border border-amber-200/50",
  danger: "bg-red-50 text-red-700 border border-red-200/50",
  info: "bg-blue-50 text-blue-700 border border-blue-200/50",
  neutral: "bg-slate-100 text-slate-600 border border-slate-200/50",
  indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200/50",
};

export function Badge({
  className,
  variant = "neutral",
  children,
  style,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 leading-none select-none",
        variantClasses[variant],
        className
      )}
      style={{
        borderRadius: 999,
        padding: "3px 8px",
        fontSize: 11,
        fontWeight: 600,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
