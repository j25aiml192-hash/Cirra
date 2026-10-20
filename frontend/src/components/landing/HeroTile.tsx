"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function HeroTile() {
  return (
    <section id="overview" className="w-full bg-[#ffffff] text-[#1d1d1f] pt-20 pb-24 px-4 sm:px-6">
      <div className="max-w-[1024px] mx-auto text-center">
        {/* Apple Headline Hierarchy */}
        <h1 className="text-[44px] sm:text-[56px] font-semibold tracking-[-0.022em] text-[#1d1d1f] leading-[1.07]">
          Cirra.
        </h1>

        <p className="mt-2 text-[22px] sm:text-[28px] font-normal tracking-[0.007em] text-[#1d1d1f] leading-[1.14]">
          Cloud and AI. Under total control.
        </p>

        <p className="mt-3 text-[17px] font-normal text-[#7a7a7a] tracking-[-0.015em] max-w-xl mx-auto leading-[1.47]">
          See every dollar across AWS, GCP, Azure, and OpenAI in real time. Autonomous anomaly detection with human-approved remediation.
        </p>

        {/* Two Tiny Pill CTAs (Apple button grammar) */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center text-[15px] sm:text-[17px] font-normal text-[#ffffff] bg-[#0066cc] hover:bg-[#0071e3] px-6 py-2.5 rounded-full apple-btn-active transition-all"
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

        {/* Product Render resting on surface with the single system shadow */}
        <div className="mt-14 max-w-[940px] mx-auto">
          <div
            className="rounded-[18px] bg-[#ffffff] border border-[#e0e0e0] apple-product-shadow overflow-hidden text-left"
            style={{ boxShadow: "rgba(0, 0, 0, 0.22) 3px 5px 30px 0" }}
          >
            {/* Apple style minimal window chrome */}
            <div className="h-10 bg-[#fafafc] border-b border-[#e0e0e0] px-4 flex items-center justify-between text-[12px] text-[#7a7a7a]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e0e0e0]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#e0e0e0]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#e0e0e0]" />
                <span className="ml-2 font-mono text-[11px] text-[#999999]">
                  app.cirra.cloud/console/overview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span className="text-[11px] text-[#1d1d1f] font-medium">FOCUS 1.0 Live</span>
              </div>
            </div>

            {/* Dashboard Surface Content */}
            <div className="p-6 sm:p-8 bg-[#ffffff]">
              {/* Header metrics row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-[#f0f0f0]">
                <div>
                  <span className="text-[12px] text-[#7a7a7a] block">Total MTD Spend</span>
                  <span className="text-[26px] font-semibold text-[#1d1d1f] tracking-tight block mt-0.5">
                    $128,420
                  </span>
                  <span className="text-[12px] text-[#0066cc] font-medium">-4.2% vs last month</span>
                </div>
                <div>
                  <span className="text-[12px] text-[#7a7a7a] block">AI Foundation Models</span>
                  <span className="text-[26px] font-semibold text-[#1d1d1f] tracking-tight block mt-0.5">
                    $42,890
                  </span>
                  <span className="text-[12px] text-[#7a7a7a]">2.1B tokens attributed</span>
                </div>
                <div>
                  <span className="text-[12px] text-[#7a7a7a] block">Attribution Coverage</span>
                  <span className="text-[26px] font-semibold text-[#1d1d1f] tracking-tight block mt-0.5">
                    84.2%
                  </span>
                  <span className="text-[12px] text-[#7a7a7a]">168 of 199 resources</span>
                </div>
                <div>
                  <span className="text-[12px] text-[#7a7a7a] block">Audited Net Savings</span>
                  <span className="text-[26px] font-semibold text-[#1d1d1f] tracking-tight block mt-0.5">
                    $34,200
                  </span>
                  <span className="text-[12px] text-[#0066cc] font-medium">Verified in Ledger</span>
                </div>
              </div>

              {/* Multi-Cloud & LLM Spend Bars */}
              <div className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[14px] font-semibold text-[#1d1d1f]">
                    Monthly Multi-Provider Spend Trajectory
                  </span>
                  <div className="flex items-center gap-4 text-[12px] text-[#7a7a7a]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> AWS
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" /> GCP
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> OpenAI
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" /> Anthropic
                    </span>
                  </div>
                </div>

                {/* Clean proportional bars */}
                <div className="grid grid-cols-6 gap-3 items-end h-32 pt-4 px-2 border-b border-[#f0f0f0] pb-2">
                  {[
                    { month: "May", aws: 48, gcp: 24, oai: 12, ant: 6 },
                    { month: "Jun", aws: 51, gcp: 25, oai: 16, ant: 8 },
                    { month: "Jul", aws: 49, gcp: 27, oai: 21, ant: 11 },
                    { month: "Aug", aws: 53, gcp: 29, oai: 24, ant: 14 },
                    { month: "Sep", aws: 52, gcp: 28, oai: 28, ant: 16 },
                    { month: "Oct", aws: 54, gcp: 31, oai: 26, ant: 17 },
                  ].map((bar, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1 h-24">
                        <div
                          style={{ height: `${(bar.aws / 60) * 100}%` }}
                          className="w-3 rounded-t-[3px] bg-[#f59e0b]"
                        />
                        <div
                          style={{ height: `${(bar.gcp / 60) * 100}%` }}
                          className="w-3 rounded-t-[3px] bg-[#3b82f6]"
                        />
                        <div
                          style={{ height: `${(bar.oai / 60) * 100}%` }}
                          className="w-3 rounded-t-[3px] bg-[#10b981]"
                        />
                        <div
                          style={{ height: `${(bar.ant / 60) * 100}%` }}
                          className="w-3 rounded-t-[3px] bg-[#7c3aed]"
                        />
                      </div>
                      <span className="text-[11px] text-[#7a7a7a] font-normal">{bar.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom footer bar */}
              <div className="mt-4 pt-3 flex items-center justify-between text-[12px]">
                <span className="text-[#7a7a7a]">
                  Ingesting AWS CUR 2.0 • BigQuery • OpenAI API • Claude Admin
                </span>
                <Link
                  href="/dashboard"
                  className="text-[#0066cc] hover:underline font-medium flex items-center gap-0.5"
                >
                  View full live console <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
