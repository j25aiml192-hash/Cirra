"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SentinelTile() {
  return (
    <section id="sentinel" className="w-full bg-[#F1F6FD] text-[#0A192F] py-24 px-4 sm:px-6">
      <div className="max-w-[1024px] mx-auto text-center">
        {/* Apple Headline Hierarchy */}
        <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-[#0A192F] leading-[1.10]">
          Sentinel.
        </h2>

        <p className="mt-2 text-[22px] sm:text-[28px] font-normal tracking-[0.007em] text-[#0A192F] leading-[1.14]">
          Autonomous anomaly detection.
        </p>

        <p className="mt-3 text-[17px] font-normal text-[#475569] tracking-[-0.015em] max-w-xl mx-auto leading-[1.47]">
          Statistical drift detection across multi-cloud infrastructure and LLM token streams with 15-minute granularity. Circuit-breaker kill switches before rogue jobs drain budgets.
        </p>

        {/* CTA Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center text-[15px] sm:text-[17px] font-medium text-white bg-[#0062E0] hover:bg-[#0052C2] px-6 py-2.5 rounded-full apple-btn-active transition-all"
          >
            Explore Sentinel
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-[15px] sm:text-[17px] font-medium text-[#0062E0] hover:underline"
          >
            <span>See live anomalies</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dark Product Render resting with single system shadow */}
        <div className="mt-14 max-w-[860px] mx-auto">
          <div
            className="rounded-[18px] bg-white border border-[#D6E4F5] apple-product-shadow overflow-hidden text-left shadow-[0_4px_24px_-4px_rgba(12,48,96,0.06)]"
          >
            {/* Header bar */}
            <div className="h-10 bg-[#F8FAFD] border-b border-[#D6E4F5] px-4 flex items-center justify-between text-[12px] text-[#475569]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BCD4F0]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#BCD4F0]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#BCD4F0]" />
                <span className="ml-2 font-mono text-[11px] text-[#64748B]">
                  sentinel://events/anom_882b_spike
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#DC2626] uppercase tracking-wider bg-[#FEECEC] border border-[#FECACA] px-2 py-0.5 rounded-full">
                Active Anomaly Triggered
              </span>
            </div>

            {/* Event Payload Content */}
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D6E4F5]">
                <div>
                  <h3 className="text-[18px] font-semibold text-[#0A192F]">
                    Anthropic Claude 3.5 Sonnet: Infinite Prompt Recursion
                  </h3>
                  <p className="text-[13px] text-[#475569] mt-1 font-mono">
                    Service: agentic-workflow-v2 • Team: Autonomous Eng • Model: claude-3-5-sonnet
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[24px] font-semibold text-[#ff453a] block">+$2,480/hr</span>
                  <span className="text-[12px] text-[#64748B]">Baseline: $18/hr</span>
                </div>
              </div>

              {/* Attribution diagnosis */}
              <div className="rounded-[11px] bg-[#F8FAFD] p-4 font-mono text-[13px] text-[#334155] space-y-1.5 border border-[#D6E4F5]">
                <div className="text-[#0062E0]">
                  &gt; [Sentinel.AI] Confidence: 0.994 • Detection Latency: 14m 12s
                </div>
                <div className="text-[#0A192F]">
                  &gt; [Root Cause] Recursive prompt depth loop triggered in worker task #819.
                </div>
                <div className="text-[#30d158]">
                  &gt; [Action Taken] Kill switch dispatched. Avoided estimated $11,958 runaway blast radius.
                </div>
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-3 gap-4 pt-2 text-[12px]">
                <div>
                  <span className="text-[#64748B] block">False Positive Rate</span>
                  <span className="text-[16px] font-semibold text-[#0A192F] mt-0.5 block">
                    0.02%
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Statistical Engine</span>
                  <span className="text-[16px] font-semibold text-[#0A192F] mt-0.5 block">
                    Adaptive EWMA
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Alert Latency</span>
                  <span className="text-[16px] font-semibold text-[#0A192F] mt-0.5 block">
                    &lt; 15 min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
