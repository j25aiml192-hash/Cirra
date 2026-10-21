import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D6E4F5] bg-white/70 p-8 text-center",
        className
      )}
    >
      {icon && <div className="mb-4 text-[#64748B]">{icon}</div>}
      <h3 className="text-base font-semibold text-[#0A192F]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-[#4A607A]">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
