import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'indigo';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-zinc-900 text-zinc-200 border border-zinc-700/80",
  warning: "bg-zinc-900 text-zinc-300 border border-zinc-700/80",
  danger: "bg-zinc-900 text-white border border-zinc-600",
  info: "bg-zinc-900 text-zinc-300 border border-zinc-800",
  neutral: "bg-zinc-900 text-zinc-400 border border-zinc-800",
  indigo: "bg-zinc-900 text-zinc-300 border border-zinc-800",
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
