"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CirraGlassCardProps {
  className?: string;
  cloudSpendFormatted?: string;
  cloudSpendBudget?: string;
  aiSpendFormatted?: string;
  aiSpendBudget?: string;
  coveragePercentFormatted?: string;
  projectedFormatted?: string;
  potentialSavingsFormatted?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function CirraGlassCard({
  className,
  cloudSpendFormatted = "$85,420",
  cloudSpendBudget = "$150K",
  aiSpendFormatted = "$42,180",
  aiSpendBudget = "$50K",
  coveragePercentFormatted = "84.2%",
  projectedFormatted = "$165K",
  potentialSavingsFormatted = "+$34,200/mo",
}: CirraGlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Subtle physical tilt
    const rotateY = ((mouseX / width) - 0.5) * 7;
    const rotateX = ((mouseY / height) - 0.5) * -7;

    setRotate({ x: rotateX, y: rotateY });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  }, []);

  return (
    <div
      className={cn(
        "relative w-full [perspective:1000px] select-none group",
        className
      )}
    >
      {/* 3D Container with Vertical Ivory/Cream Paper Ticket Body */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateY(-2px)`
            : "rotateX(0deg) rotateY(0deg) translateY(0px)",
          transition: isHovered
            ? "transform 0.12s cubic-bezier(0.2, 0, 0, 1)"
            : "transform 0.4s cubic-bezier(0.2, 0, 0, 1)",
        }}
        className={cn(
          "relative w-full rounded-[22px] overflow-hidden",
          // Warm ivory/cream matte paper texture matching reference image
          "bg-gradient-to-b from-[#f8f5ee] via-[#f3eee4] to-[#ebe4d6]",
          "text-[#1c1917] shadow-[0_20px_45px_rgba(0,0,0,0.85),0_3px_8px_rgba(0,0,0,0.4)]",
          "transition-all duration-300"
        )}
      >
        {/* Subtle Paper Grain & Ambient Surface Lighting */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20 mix-blend-multiply bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_60%),radial-gradient(circle_at_70%_80%,black_0%,transparent_70%)]"
        />

        {/* 4 Corner Cutouts */}
        <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-black pointer-events-none z-20" />
        <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-black pointer-events-none z-20" />
        <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-black pointer-events-none z-20" />
        <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-black pointer-events-none z-20" />

        {/* TOP PART OF TICKET (Header + 3 Headlines) */}
        <div className="relative z-10 p-5 pb-4 space-y-4">
          {/* Header Row: Last 30 Days + Upgrade Link */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>Last 30 days</span>
            </div>

            <Link
              href="/settings"
              className="text-xs font-bold text-stone-900 hover:text-black transition-colors flex items-center gap-1 group/link underline decoration-stone-400 decoration-1 underline-offset-2"
            >
              <span>Upgrade</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-stone-700 group-hover/link:text-black group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {/* 3 Headlines */}
          <div className="space-y-3.5 pt-1">
            {/* Headline 1: Multi-Cloud Infra */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800">
                Multi-Cloud Infra
              </span>
              <div className="text-right flex items-baseline gap-1.5">
                <span className="text-sm font-mono font-bold text-stone-950 tracking-tight">
                  {cloudSpendFormatted}
                </span>
                <span className="text-[11px] font-mono text-stone-500 font-medium">
                  / {cloudSpendBudget}
                </span>
              </div>
            </div>

            {/* Headline 2: AI Foundation Models */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800">
                AI Foundation Models
              </span>
              <div className="text-right flex items-baseline gap-1.5">
                <span className="text-sm font-mono font-bold text-stone-950 tracking-tight">
                  {aiSpendFormatted}
                </span>
                <span className="text-[11px] font-mono text-stone-500 font-medium">
                  / {aiSpendBudget}
                </span>
              </div>
            </div>

            {/* Headline 3: FOCUS Attribution */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800">
                FOCUS Attribution
              </span>
              <div className="text-right flex items-baseline gap-1.5">
                <span className="text-sm font-mono font-bold text-stone-950 tracking-tight">
                  {coveragePercentFormatted}
                </span>
                <span className="text-[11px] font-mono text-stone-500 font-medium">
                  / 100%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TICKET PUNCH-DOT PERFORATION DIVIDER WITH NOTCHES (Exact Match to Reference Image) */}
        <div className="relative w-full flex items-center justify-between my-2">
          {/* Left Cutout Notch */}
          <div className="w-5 h-5 rounded-full bg-black -ml-2.5 z-20 shrink-0" />
          
          {/* Circular Punch Hole Dots Across the Perforation Line */}
          <div className="flex-1 flex items-center justify-evenly px-3 overflow-hidden">
            {Array.from({ length: 22 }).map((_, i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-stone-400/60 shrink-0"
              />
            ))}
          </div>
          
          {/* Right Cutout Notch */}
          <div className="w-5 h-5 rounded-full bg-black -mr-2.5 z-20 shrink-0" />
        </div>

        {/* BOTTOM PART OF TICKET (Month-End Forecast & Pipeline Optimization) */}
        <div className="relative z-10 p-5 pt-3 space-y-3">
          <div className="space-y-2.5">
            {/* Month-End Forecast */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">
                Month-End Forecast
              </span>
              <span className="text-xs font-mono font-bold text-stone-950 bg-stone-900/5 px-2 py-0.5 rounded">
                {projectedFormatted} Run-rate
              </span>
            </div>

            {/* Pipeline Optimization */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">
                Pipeline Optimization
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-700/10 px-2 py-0.5 rounded">
                {potentialSavingsFormatted}
              </span>
            </div>
          </div>

          {/* Clean Ticket Barcode Graphic at Bottom (Matching Reference) */}
          <div className="pt-2 flex items-center justify-center">
            <div className="flex items-center justify-center gap-[2.5px] h-6 opacity-75 w-full">
              {[3, 1, 4, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 1, 4, 2, 3, 1, 3, 1, 2, 4, 2, 1, 3].map((w, i) => (
                <div
                  key={i}
                  style={{ width: `${w}px` }}
                  className="h-full bg-stone-900 rounded-[0.5px]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
