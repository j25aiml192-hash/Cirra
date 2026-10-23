"use client";

import * as React from "react";
import Link from "next/link";
import OrbitImages from "@/components/ui/OrbitImages";
import { BRAND_DATA_URLS } from "@/components/ui/BrandLogos";
import { ThreeDLetterSwap } from "@/components/ui/ThreeDLetterSwap";

function WaveRibbon() {
  const lineCount = 28;
  const lines = Array.from({ length: lineCount }, (_, i) => {
    const t = i / (lineCount - 1);
    // Smooth parametric bezier lines creating the twisted ribbon wave
    const startY = 170 + t * 90;
    const cp1x = 70 + t * 65;
    const cp1y = 260 - t * 140;
    const cp2x = 180 - t * 45;
    const cp2y = 30 + t * 190;
    const cp3x = 300 + t * 40;
    const cp3y = 310 - t * 110;
    const endX = 420 + t * 80;
    const endY = 240 + t * 30;

    const d = `M 0,${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} 220,${180 + t * 40} C ${cp3x},${cp3y} ${endX - 50},${endY - 60} ${endX},${endY}`;
    const opacity = 0.15 + (1 - Math.abs(t - 0.5) * 1.5) * 0.45;

    return (
      <path
        key={i}
        d={d}
        stroke="#1E293B"
        strokeWidth="1.1"
        strokeOpacity={Math.max(0.08, Math.min(0.7, opacity))}
        fill="none"
      />
    );
  });

  return (
    <div className="absolute -bottom-8 -left-10 w-[380px] sm:w-[500px] lg:w-[620px] h-[240px] sm:h-[300px] pointer-events-none select-none z-0">
      <svg
        viewBox="0 0 540 300"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {lines}
      </svg>
    </div>
  );
}

export function HeroTile() {
  return (
    <section
      id="overview"
      className="relative w-full min-h-[calc(100vh-52px)] flex flex-col justify-center bg-white text-[#0A192F] overflow-hidden"
    >
      {/* Decorative linear wave wireframe in bottom-left corner */}
      <WaveRibbon />

      <div className="relative z-10 max-w-[1400px] mx-auto w-full px-6 sm:px-12 py-10 lg:py-14 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT COLUMN: Hero text and actions */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Main Title with 3D Letter Swap */}
            <div className="mb-4 sm:mb-6">
              <h1 className="text-[64px] sm:text-[80px] lg:text-[104px] font-bold tracking-[-0.035em] text-[#0A192F] leading-[0.98]">
                <ThreeDLetterSwap text="Cirra" />
              </h1>
            </div>

            {/* Subtitle */}
            <h2 className="text-[24px] sm:text-[28px] lg:text-[34px] font-normal tracking-[-0.015em] text-[#0A192F] leading-[1.25] mb-3">
              Cloud and AI. Under total control.
            </h2>

            {/* Paragraph Description */}
            <p className="text-[15px] sm:text-[16px] lg:text-[17px] font-normal text-[#475569] tracking-[-0.01em] max-w-[480px] leading-[1.55] mb-8">
              See every dollar across AWS, GCP, Azure, and OpenAI in real time. Autonomous anomaly detection with human-approved remediation.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center text-[14px] sm:text-[15px] font-medium text-white bg-[#0062E0] hover:bg-[#0052C2] px-6 sm:px-7 py-2.5 sm:py-3 rounded-full apple-btn-active transition-all shadow-sm"
              >
                Run your free audit
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center text-[14px] sm:text-[15px] font-medium text-[#0062E0] border border-[#BCD9FC] hover:bg-[#EBF3FE] px-6 sm:px-7 py-2.5 sm:py-3 rounded-full apple-btn-active transition-all"
              >
                Explore Live Demo
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Orbiting Brand Logos with Cirra Core center */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center w-full">
            <div className="w-full flex items-center justify-center">
              <OrbitImages
                images={BRAND_DATA_URLS}
                shape="ellipse"
                radiusX={230}
                radiusY={95}
                rotation={-2}
                duration={36}
                itemSize={38}
                depth={0.45}
                showPath={true}
                pathColor="rgba(12, 48, 96, 0.12)"
                pathDash={3}
                draggable={true}
                clickToFront={true}
                className="w-full h-[320px] sm:h-[380px] lg:h-[420px]"
                centerContent={
                  <div className="flex flex-col items-center justify-center px-4 py-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#D6E4F5] shadow-[0_4px_20px_-4px_rgba(12,48,96,0.08)] text-center transition-transform hover:scale-105">
                    <img
                      src="/cirra-logo.png"
                      alt="Cirra Core"
                      className="w-10 h-10 rounded-xl object-contain mb-1 shadow-sm"
                    />
                    <span className="text-[12px] font-bold text-[#0A192F] tracking-tight">
                      Cirra Core
                    </span>
                    <span className="text-[9px] text-[#64748B] font-mono tracking-wide">
                      FOCUS 1.0
                    </span>
                  </div>
                }
              />
            </div>

            {/* Subtle horizontal baseline line right under the orbit area */}
            <div className="w-full max-w-[560px] h-[1px] bg-[#E8EFF7] mt-3" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroTile;
