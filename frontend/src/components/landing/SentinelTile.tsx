"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SentinelTile() {
  return (
    <section id="sentinel" className="w-full bg-[#272729] text-[#ffffff] py-24 px-4 sm:px-6">
      <div className="max-w-[1024px] mx-auto text-center">
        {/* Apple Headline Hierarchy */}
        <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-[#ffffff] leading-[1.10]">
          Sentinel.
        </h2>

        <p className="mt-2 text-[22px] sm:text-[28px] font-normal tracking-[0.007em] text-[#ffffff] leading-[1.14]">
          Autonomous anomaly detection.
        </p>

        <p className="mt-3 text-[17px] font-normal text-[#cccccc] tracking-[-0.015em] max-w-xl mx-auto leading-[1.47]">
          Statistical drift detection across multi-cloud infrastructure and LLM token streams with 15-minute granularity. Circuit-breaker kill switches before rogue jobs drain budgets.
        </p>

        {/* CTA Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center text-[15px] sm:text-[17px] font-normal text-[#ffffff] bg-[#0066cc] hover:bg-[#0071e3] px-6 py-2.5 rounded-full apple-btn-active transition-all"
          >
            Explore Sentinel
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-[15px] sm:text-[17px] font-normal text-[#2997ff] hover:underline"
          >
            <span>See live anomalies</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dark Product Render resting with single system shadow */}
        <div className="mt-14 max-w-[860px] mx-auto">
          <div
            className="rounded-[18px] bg-[#2a2a2c] border border-[#3a3a3c] apple-product-shadow overflow-hidden text-left"
            style={{ boxShadow: "rgba(0, 0, 0, 0.22) 3px 5px 30px 0" }}
          >
            {/* Header bar */}
            <div className="h-10 bg-[#252527] border-b border-[#3a3a3c] px-4 flex items-center justify-between text-[12px] text-[#cccccc]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3a3a3c]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#3a3a3c]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#3a3a3c]" />
                <span className="ml-2 font-mono text-[11px] text-[#8e8e93]">
                  sentinel://events/anom_882b_spike
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#ff453a] uppercase tracking-wider bg-[#3a1d1d] px-2 py-0.5 rounded-full">
                Active Anomaly Triggered
              </span>
            </div>

            {/* Event Payload Content */}
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#3a3a3c]">
                <div>
                  <h3 className="text-[18px] font-semibold text-[#ffffff]">
                    Anthropic Claude 3.5 Sonnet: Infinite Prompt Recursion
                  </h3>
                  <p className="text-[13px] text-[#cccccc] mt-1 font-mono">
                    Service: agentic-workflow-v2 • Team: Autonomous Eng • Model: claude-3-5-sonnet
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[24px] font-semibold text-[#ff453a] block">+$2,480/hr</span>
                  <span className="text-[12px] text-[#8e8e93]">Baseline: $18/hr</span>
                </div>
              </div>

              {/* Attribution diagnosis */}
              <div className="rounded-[11px] bg-[#1d1d1f] p-4 font-mono text-[13px] text-[#cccccc] space-y-1.5 border border-[#333333]">
                <div className="text-[#2997ff]">
                  &gt; [Sentinel.AI] Confidence: 0.994 • Detection Latency: 14m 12s
                </div>
                <div className="text-[#ffffff]">
                  &gt; [Root Cause] Recursive prompt depth loop triggered in worker task #819.
                </div>
                <div className="text-[#30d158]">
                  &gt; [Action Taken] Kill switch dispatched. Avoided estimated $11,958 runaway blast radius.
                </div>
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-3 gap-4 pt-2 text-[12px]">
                <div>
                  <span className="text-[#8e8e93] block">False Positive Rate</span>
                  <span className="text-[16px] font-semibold text-[#ffffff] mt-0.5 block">
                    0.02%
                  </span>
                </div>
                <div>
                  <span className="text-[#8e8e93] block">Statistical Engine</span>
                  <span className="text-[16px] font-semibold text-[#ffffff] mt-0.5 block">
                    Adaptive EWMA
                  </span>
                </div>
                <div>
                  <span className="text-[#8e8e93] block">Alert Latency</span>
                  <span className="text-[16px] font-semibold text-[#ffffff] mt-0.5 block">
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
