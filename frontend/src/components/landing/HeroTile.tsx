"use client";

import * as React from "react";
import Link from "next/link";
import OrbitImages from "@/components/ui/OrbitImages";
import { BRAND_DATA_URLS } from "@/components/ui/BrandLogos";
import { ThreeDLetterSwap } from "@/components/ui/ThreeDLetterSwap";
import FlowingRibbons from "@/components/ui/flowing-ribbons-effect";
import { VoxelArc } from "@/components/ui/VoxelArc";

export function HeroTile() {
  return (
    <section
      id="overview"
      className="relative w-full min-h-[calc(100vh-52px)] flex flex-col justify-center bg-white text-[#0A192F] overflow-hidden"
    >
      {/* 1. Base Layer: Interactive Flowing Ribbons filling the page from the right */}
      <FlowingRibbons backgroundColor="transparent" lineColor="#A8C0DD" position="right" fadeLeft={true} />

      {/* 2. 3D Wave Layer: Rolling blue voxel arc across bottom with transparent sky */}
      <VoxelArc theme="light" transparentBackground={true} />



      <div className="relative z-10 max-w-[1400px] mx-auto w-full px-6 sm:px-12 py-10 lg:py-14 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center -translate-y-6 sm:-translate-y-10 lg:-translate-y-14">
          {/* LEFT COLUMN: Hero text and actions */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Main Title with 3D Letter Swap */}
            <div className="mb-4 sm:mb-6">
              <h1 className="text-[64px] sm:text-[80px] lg:text-[104px] font-bold tracking-[-0.035em] text-[#0A192F] leading-[0.98]">
                <ThreeDLetterSwap
                  text="Cirra"
                  frontFaceClassName="text-[#0A192F]"
                  secondFaceClassName="text-[#0062E0]"
                />
              </h1>
            </div>

            {/* Subtitle */}
            <h2 className="text-[24px] sm:text-[28px] lg:text-[34px] font-semibold tracking-[-0.015em] text-[#0A192F] leading-[1.25] mb-3">
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
                className="inline-flex items-center justify-center text-[14px] sm:text-[15px] font-medium text-white bg-[#0062E0] hover:bg-[#0052C2] px-6 sm:px-7 py-2.5 sm:py-3 rounded-full apple-btn-active transition-all shadow-[0_4px_16px_rgba(0,98,224,0.28)]"
              >
                Run your free audit
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center text-[14px] sm:text-[15px] font-medium text-[#0062E0] bg-white/80 hover:bg-[#EBF3FE] border border-[#BCD9FC] px-6 sm:px-7 py-2.5 sm:py-3 rounded-full apple-btn-active transition-all backdrop-blur-sm shadow-sm"
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
                pathColor="rgba(113, 117, 123, 0.38)"
                pathDash={3}
                draggable={true}
                clickToFront={true}
                className="w-full h-[320px] sm:h-[380px] lg:h-[420px]"
                centerContent={
                  <div className="flex flex-col items-center justify-center px-4 py-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#D6E4F5] shadow-[0_4px_24px_-4px_rgba(12,48,96,0.08)] text-center transition-transform hover:scale-105">
                    <img
                      src="/cirra-logo.png"
                      alt="Cirra Core"
                      className="w-10 h-10 rounded-xl object-contain mb-1 shadow-sm"
                    />
                    <span className="text-[12px] font-bold text-[#0A192F] tracking-tight">
                      Cirra Core
                    </span>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroTile;
