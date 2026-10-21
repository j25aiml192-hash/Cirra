"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import OrbitImages from "@/components/ui/OrbitImages";
import { BRAND_DATA_URLS } from "@/components/ui/BrandLogos";

export function HeroTile() {
  return (
    <section
      id="overview"
      className="w-full min-h-[calc(100vh-44px)] flex flex-col justify-between bg-white text-[#0A192F] pt-12 sm:pt-16 pb-8 sm:pb-12 px-4 sm:px-6 overflow-hidden"
    >
      <div className="max-w-[1024px] mx-auto text-center w-full">
        <h1 className="text-[44px] sm:text-[56px] lg:text-[64px] font-semibold tracking-[-0.022em] text-[#0A192F] leading-[1.07]">
          Cirra.
        </h1>

        <p className="mt-2 text-[22px] sm:text-[28px] lg:text-[32px] font-normal tracking-[0.007em] text-[#0A192F] leading-[1.14]">
          Cloud and AI. Under total control.
        </p>

        <p className="mt-3 text-[17px] sm:text-[19px] font-normal text-[#475569] tracking-[-0.015em] max-w-2xl mx-auto leading-[1.47]">
          See every dollar across AWS, GCP, Azure, and OpenAI in real time. Autonomous anomaly detection with human-approved remediation.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center text-[15px] sm:text-[17px] font-medium text-white bg-[#0062E0] hover:bg-[#0052C2] px-6 py-2.5 rounded-full apple-btn-active transition-all shadow-sm"
          >
            Run your free audit
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center text-[15px] sm:text-[17px] font-medium text-[#0062E0] border border-[#BCD9FC] hover:bg-[#EBF3FE] px-6 py-2.5 rounded-full apple-btn-active transition-all"
          >
            Explore Live Demo
          </Link>
        </div>
      </div>

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
          pathColor="rgba(12, 48, 96, 0.12)"
          pathDash={3}
          draggable={true}
          clickToFront={true}
          className="w-full h-[320px] sm:h-[380px] lg:h-[420px]"
          centerContent={
            <div className="flex flex-col items-center justify-center px-5 py-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#D6E4F5] shadow-md text-center transition-transform hover:scale-105">
              <img
                src="/cirra-logo.png"
                alt="Cirra Core"
                className="w-12 h-12 rounded-xl object-contain mb-1 shadow-sm"
              />
              <span className="text-[13px] font-semibold text-[#0A192F] tracking-tight">
                Cirra Core
              </span>
              <span className="text-[10px] text-[#64748B] font-mono tracking-wide">
                FOCUS 1.0
              </span>
            </div>
          }
        />
      </div>

      <div className="mt-8 max-w-[940px] w-full mx-auto">
        <div className="rounded-[18px] bg-white border border-[#D6E4F5] overflow-hidden text-left shadow-[0_4px_24px_-4px_rgba(12,48,96,0.06)]">
          <div className="h-10 bg-[#F8FAFD] border-b border-[#D6E4F5] px-4 flex items-center justify-between text-[12px] text-[#475569]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#BCD4F0] flex-shrink-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#BCD4F0] flex-shrink-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#BCD4F0] flex-shrink-0" />
              <span className="ml-2 font-mono text-[11px] text-[#64748B] truncate">
                app.cirra.cloud/console/overview
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span className="text-[11px] text-[#0A192F] font-medium">FOCUS 1.0 Live</span>
            </div>
          </div>

          <div className="p-5 sm:p-8 bg-white">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-[#EBF2FA]">
              <div>
                <span className="text-[12px] text-[#64748B] block">Total MTD Spend</span>
                <span className="text-[26px] font-semibold text-[#0A192F] tracking-tight block mt-0.5">
                  $128,420
                </span>
                <span className="text-[12px] text-[#0062E0] font-medium">-4.2% vs last month</span>
              </div>
              <div>
                <span className="text-[12px] text-[#64748B] block">AI Foundation Models</span>
                <span className="text-[26px] font-semibold text-[#0A192F] tracking-tight block mt-0.5">
                  $42,890
                </span>
                <span className="text-[12px] text-[#64748B]">2.1B tokens attributed</span>
              </div>
              <div>
                <span className="text-[12px] text-[#64748B] block">Attribution Coverage</span>
                <span className="text-[26px] font-semibold text-[#0A192F] tracking-tight block mt-0.5">
                  84.2%
                </span>
                <span className="text-[12px] text-[#64748B]">168 of 199 resources</span>
              </div>
              <div>
                <span className="text-[12px] text-[#64748B] block">Audited Net Savings</span>
                <span className="text-[26px] font-semibold text-[#0A192F] tracking-tight block mt-0.5">
                  $34,200
                </span>
                <span className="text-[12px] text-[#0062E0] font-medium">Verified in Ledger</span>
              </div>
            </div>

            <div className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <span className="text-[14px] font-semibold text-[#0A192F]">
                  Monthly Multi-Provider Spend Trajectory
                </span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[#475569]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F58536]" /> AWS
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1A73E8]" /> GCP
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10A37F]" /> OpenAI
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9333EA]" /> Anthropic
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 items-end h-32 pt-4 px-2 border-b border-[#EBF2FA] pb-2">
                {[
                  { month: "May", aws: 48, gcp: 24, oai: 12, ant: 6 },
                  { month: "Jun", aws: 51, gcp: 25, oai: 16, ant: 8 },
                  { month: "Jul", aws: 49, gcp: 27, oai: 21, ant: 11 },
                  { month: "Aug", aws: 53, gcp: 29, oai: 24, ant: 14 },
                  { month: "Sep", aws: 52, gcp: 28, oai: 28, ant: 16 },
                  { month: "Oct", aws: 54, gcp: 31, oai: 26, ant: 17 },
                ].map((bar) => (
                  <div key={bar.month} className="flex flex-col items-center gap-1 h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1 h-24">
                      <div style={{ height: `${(bar.aws / 60) * 100}%` }} className="w-3 rounded-t-[3px] bg-[#F58536]" />
                      <div style={{ height: `${(bar.gcp / 60) * 100}%` }} className="w-3 rounded-t-[3px] bg-[#1A73E8]" />
                      <div style={{ height: `${(bar.oai / 60) * 100}%` }} className="w-3 rounded-t-[3px] bg-[#10A37F]" />
                      <div style={{ height: `${(bar.ant / 60) * 100}%` }} className="w-3 rounded-t-[3px] bg-[#9333EA]" />
                    </div>
                    <span className="text-[11px] text-[#64748B] font-medium">{bar.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[12px]">
              <span className="text-[#475569]">
                Ingesting AWS CUR 2.0 • BigQuery • OpenAI API • Claude Admin
              </span>
              <Link
                href="/dashboard"
                className="text-[#0062E0] hover:underline font-medium flex items-center gap-0.5"
              >
                View full live console <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
