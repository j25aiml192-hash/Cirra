"use client";

import * as React from "react";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChromePillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  loading?: boolean;
  success?: boolean;
  icon?: React.ReactNode;
}

export function ChromePillButton({
  label,
  loading = false,
  success = false,
  icon,
  className,
  disabled,
  ...props
}: ChromePillButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "group relative w-full rounded-full p-[1px] cursor-pointer transition-all duration-200 select-none",
        "focus:outline-none focus:ring-0 shadow-none active:shadow-none",
        "disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]",
        className
      )}
      {...props}
    >
      {/* ── Glass Rim / Specular Border (No Colored Glow) ──────── */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-opacity duration-200",
          "bg-gradient-to-b from-white via-white/80 to-white/40",
          "border border-white/60 shadow-none"
        )}
      />

      {/* ── Inner Bright Frosted Glass Body ──────── */}
      <div
        className={cn(
          "relative w-full h-[42px] px-5 rounded-full overflow-hidden flex items-center justify-center gap-2",
          "bg-gradient-to-b from-white/95 via-white/85 to-white/75",
          "backdrop-blur-2xl backdrop-saturate-150",
          "transition-all duration-200 group-hover:from-white group-hover:via-white/90 group-hover:to-white/80",
          "shadow-[inset_0_1.5px_1.5px_0_rgba(255,255,255,1),inset_0_-1.5px_2px_0_rgba(0,0,0,0.12)]"
        )}
      >
        {/* Curved Top Glass Reflection Sheen */}
        <div className="absolute top-0 inset-x-3 h-[50%] bg-gradient-to-b from-white/80 via-white/30 to-transparent rounded-t-full pointer-events-none" />

        {/* Specular Horizontal Glint at Top Edge */}
        <div className="absolute top-[1px] inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

        {/* Button Content: High-Contrast Pure Black on Bright Glass */}
        <div className="relative z-10 flex items-center justify-center gap-2 text-black select-none">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-black stroke-[2.5]" />
          ) : success ? (
            <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
          ) : icon ? (
            <span className="text-black group-hover:scale-105 transition-transform">
              {icon}
            </span>
          ) : null}

          <span className="font-mono text-[11px] sm:text-xs font-black tracking-wider text-black uppercase">
            {loading ? "INJECTING..." : success ? "INJECTED // DETECTING" : label}
          </span>
        </div>
      </div>
    </button>
  );
}

/**
 * Circular Companion Button in Bright Theme Glass
 */
export function ChromeIconButton({
  icon,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        "group relative w-10 h-10 rounded-full p-[1px] cursor-pointer transition-all duration-200 select-none",
        "focus:outline-none focus:ring-0 shadow-none active:shadow-none hover:scale-105 active:scale-95",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white via-white/80 to-white/40 border border-white/60 shadow-none" />
      <div className="relative w-full h-full rounded-full bg-gradient-to-b from-white/95 via-white/85 to-white/75 backdrop-blur-2xl flex items-center justify-center shadow-[inset_0_1.5px_1.5px_0_rgba(255,255,255,1),inset_0_-1.5px_2px_0_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="absolute top-0 inset-x-2 h-[50%] bg-gradient-to-b from-white/80 via-white/20 to-transparent rounded-t-full pointer-events-none" />
        <div className="relative z-10 text-black transition-transform duration-200 group-hover:scale-110">
          {icon}
        </div>
      </div>
    </button>
  );
}
