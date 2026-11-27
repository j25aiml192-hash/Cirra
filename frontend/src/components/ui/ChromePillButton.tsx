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
        "group relative w-full rounded-full p-[1px] cursor-pointer transition-all duration-300 select-none",
        "focus:outline-none focus:ring-0 shadow-none active:shadow-none",
        "disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.98]",
        className
      )}
      {...props}
    >
      {/* ── Liquid Glass Outer Bevel & Refraction Rim ──────── */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-300 pointer-events-none",
          "bg-gradient-to-b from-white/35 via-white/10 to-transparent",
          "border border-white/25",
          "shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-1.5px_2px_rgba(0,0,0,0.35)]"
        )}
      />

      {/* ── Transparent Liquid Glass Body (Apple VisionOS / Gloss Lens) ──────── */}
      <div
        className={cn(
          "relative w-full h-[42px] px-5 rounded-full overflow-hidden flex items-center justify-center gap-2",
          "bg-gradient-to-b from-white/[0.18] via-white/[0.08] to-white/[0.02]",
          "backdrop-blur-2xl backdrop-saturate-[180%]",
          "transition-all duration-300 group-hover:from-white/[0.28] group-hover:via-white/[0.14] group-hover:to-white/[0.05]"
        )}
      >
        {/* Curved Top Liquid Gloss Dome Reflection (The Signature Glass Shine) */}
        <div className="absolute top-0 inset-x-2 h-[52%] rounded-t-full bg-gradient-to-b from-white/65 via-white/20 to-transparent pointer-events-none" />

        {/* Specular Horizontal Glint at Top Edge */}
        <div className="absolute top-[1px] inset-x-6 h-[1px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

        {/* Bottom Ambient Rim Light */}
        <div className="absolute bottom-[1px] inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Button Content: Crisp High-Legibility White Text with Drop Shadow */}
        <div className="relative z-10 flex items-center justify-center gap-2 text-white select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white stroke-[2.5]" />
          ) : success ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
          ) : icon ? (
            <span className="text-zinc-200 group-hover:text-white group-hover:scale-105 transition-all">
              {icon}
            </span>
          ) : null}

          <span className="font-mono text-[11px] sm:text-xs font-bold tracking-wider text-white uppercase">
            {loading ? "INJECTING..." : success ? "INJECTED // DETECTING" : label}
          </span>
        </div>
      </div>
    </button>
  );
}

/**
 * Circular Companion Button in Liquid Glass Style
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
        "group relative w-10 h-10 rounded-full p-[1px] cursor-pointer transition-all duration-300 select-none",
        "focus:outline-none focus:ring-0 shadow-none active:shadow-none hover:scale-105 active:scale-95",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/35 via-white/10 to-transparent border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-1.5px_2px_rgba(0,0,0,0.35)] pointer-events-none" />
      <div className="relative w-full h-full rounded-full bg-gradient-to-b from-white/[0.18] via-white/[0.08] to-white/[0.02] backdrop-blur-2xl flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:from-white/[0.28] group-hover:via-white/[0.14] group-hover:to-white/[0.05]">
        <div className="absolute top-0 inset-x-1.5 h-[50%] bg-gradient-to-b from-white/65 via-white/20 to-transparent rounded-t-full pointer-events-none" />
        <div className="relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] transition-transform duration-200 group-hover:scale-110">
          {icon}
        </div>
      </div>
    </button>
  );
}
