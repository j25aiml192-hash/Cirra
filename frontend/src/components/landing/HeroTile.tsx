"use client";

import * as React from "react";
import Link from "next/link";
import OrbitImages from "@/components/ui/OrbitImages";
import { BRAND_DATA_URLS } from "@/components/ui/BrandLogos";

export function HeroTile() {
  return (
    <section
      id="overview"
      className="w-full min-h-[calc(100vh-44px)] flex flex-col justify-between bg-[#ffffff] text-[#1d1d1f] pt-12 sm:pt-16 pb-8 sm:pb-12 px-4 sm:px-6 overflow-hidden"
    >
      <div className="max-w-[1024px] mx-auto text-center w-full">
        {/* Apple Headline Hierarchy */}
        <h1 className="text-[44px] sm:text-[56px] lg:text-[64px] font-semibold tracking-[-0.022em] text-[#1d1d1f] leading-[1.07]">
          Cirra.
        </h1>

        <p className="mt-2 text-[22px] sm:text-[28px] lg:text-[32px] font-normal tracking-[0.007em] text-[#1d1d1f] leading-[1.14]">
          Cloud and AI. Under total control.
        </p>

        <p className="mt-3 text-[17px] sm:text-[19px] font-normal text-[#7a7a7a] tracking-[-0.015em] max-w-2xl mx-auto leading-[1.47]">
          See every dollar across AWS, GCP, Azure, and OpenAI in real time. Autonomous anomaly detection with human-approved remediation.
        </p>

        {/* Two Tiny Pill CTAs (Apple button grammar) */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center text-[15px] sm:text-[17px] font-normal text-[#ffffff] bg-[#0066cc] hover:bg-[#0071e3] px-6 py-2.5 rounded-full apple-btn-active transition-all shadow-sm"
          >
            Run your free audit
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center text-[15px] sm:text-[17px] font-normal text-[#0066cc] border border-[#0066cc] hover:bg-[#0066cc]/5 px-6 py-2.5 rounded-full apple-btn-active transition-all"
          >
            Explore Live Demo
          </Link>
        </div>
      </div>

      {/* Orbit Images Animation (React Bits) showing unified AI & Cloud engines */}
      <div className="mt-8 sm:mt-10 w-full max-w-[1140px] xl:max-w-[1240px] mx-auto flex items-center justify-center overflow-visible">
        <OrbitImages
          images={BRAND_DATA_URLS}
          shape="ellipse"
          radiusX={460}
          radiusY={130}
          rotation={-3}
          duration={36}
          itemSize={56}
          depth={0.45}
          showPath={true}
          pathColor="rgba(0, 0, 0, 0.08)"
          pathDash={3}
          draggable={true}
          clickToFront={true}
          className="w-full h-[320px] sm:h-[380px] lg:h-[420px]"
          centerContent={
            <div className="flex flex-col items-center justify-center px-5 py-3.5 rounded-2xl bg-[#ffffff]/95 backdrop-blur-md border border-[#e5e5e5] shadow-md text-center transition-transform hover:scale-105">
              <img
                src="/cirra-logo.png"
                alt="Cirra Core"
                className="w-12 h-12 rounded-xl object-contain mb-1 shadow-sm"
              />
              <span className="text-[13px] font-semibold text-[#1d1d1f] tracking-tight">Cirra Core</span>
              <span className="text-[10px] text-[#7a7a7a] font-mono tracking-wide">FOCUS 1.0</span>
            </div>
          }
        />
      </div>
    </section>
  );
}
