"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Check } from "lucide-react";

export function ActionCenterTile() {
  const [approved, setApproved] = React.useState(false);

  return (
    <section id="actions" className="w-full bg-[#F1F6FD] text-[#0A192F] pt-20 pb-24 px-4 sm:px-6 scroll-mt-20 relative overflow-hidden">
      {/* Soft ambient atmospheric haze continuing from Sentinel's dawn horizon */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-48 bg-gradient-to-b from-[#38BDF8]/10 via-[#0062E0]/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-[1024px] mx-auto text-center relative z-10">
        {/* Apple Headline Hierarchy */}
        <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-[#0A192F] leading-[1.10]">
          Action Center.
        </h2>

        <p className="mt-2 text-[22px] sm:text-[28px] font-normal tracking-[0.007em] text-[#0A192F] leading-[1.14]">
          Human in the loop. Verified in production.
        </p>

        <p className="mt-3 text-[17px] font-normal text-[#475569] tracking-[-0.015em] max-w-xl mx-auto leading-[1.47]">
          Recommendations without safety are dangerous. Cirra pairs automated FinOps intelligence with dry-run verification, GitHub pull-request cost comments, and 1-click rollback.
        </p>

        {/* Action Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center text-[15px] sm:text-[17px] font-medium text-white bg-[#0062E0] hover:bg-[#0052C2] px-6 py-2.5 rounded-full apple-btn-active transition-all"
          >
            Explore Action Center
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-[15px] sm:text-[17px] font-medium text-[#0062E0] hover:underline"
          >
            <span>Learn about rollback safety</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Render resting on Parchment with the system shadow */}
        <div className="mt-14 max-w-[860px] mx-auto">
          <div
            className="rounded-[18px] bg-white border border-[#D6E4F5] apple-product-shadow overflow-hidden text-left shadow-[0_4px_24px_-4px_rgba(12,48,96,0.06)]"
            style={{ boxShadow: "rgba(0, 0, 0, 0.22) 3px 5px 30px 0" }}
          >
            {/* Header bar */}
            <div className="h-10 bg-[#F8FAFD] border-b border-[#D6E4F5] px-4 flex items-center justify-between text-[12px] text-[#475569]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BCD4F0]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#BCD4F0]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#BCD4F0]" />
                <span className="ml-2 font-mono text-[11px] text-[#64748B]">
                  action-orchestrator://governance/lifecycle
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#0062E0] bg-[#EBF3FE] border border-[#BCD9FC] px-2.5 py-0.5 rounded-full">
                3-Stage Safety Protocol
              </span>
            </div>

            {/* General Lifecycle Steps */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#D6E4F5] space-y-2">
                  <div className="text-[11px] font-mono text-[#0062E0] uppercase tracking-wider font-semibold">
                    Stage 01
                  </div>
                  <div className="text-[14px] font-semibold text-[#0A192F]">
                    Continuous Sizing
                  </div>
                  <p className="text-[12px] text-[#475569] leading-[1.5]">
                    Autonomous detection of idle clusters, overprovisioned databases, and orphaned model endpoints.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#D6E4F5] space-y-2">
                  <div className="text-[11px] font-mono text-[#0062E0] uppercase tracking-wider font-semibold">
                    Stage 02
                  </div>
                  <div className="text-[14px] font-semibold text-[#0A192F]">
                    Non-Destructive Dry Run
                  </div>
                  <p className="text-[12px] text-[#475569] leading-[1.5]">
                    Simulated execution verifying replication health, routing latency, and SLA safety before touching production.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#D6E4F5] space-y-2">
                  <div className="text-[11px] font-mono text-[#0062E0] uppercase tracking-wider font-semibold">
                    Stage 03
                  </div>
                  <div className="text-[14px] font-semibold text-[#0A192F]">
                    Governed Execution
                  </div>
                  <p className="text-[12px] text-[#475569] leading-[1.5]">
                    GitHub PR cost checks, Slack approvals, and automated rollback if p99 latency degrades.
                  </p>
                </div>
              </div>

              {/* General Technical Trace */}
              <div className="rounded-[11px] bg-[#F8FAFD] p-4 font-mono text-[12px] sm:text-[13px] text-[#334155] space-y-1.5 border border-[#D6E4F5]">
                <div className="text-[#0062E0]">
                  ✓ [Dry-Run Engine] Target infrastructure state validated in isolated staging sandbox
                </div>
                <div className="text-[#0062E0]">
                  ✓ [Safety Verification] Network routing, health checks, and query latency verified
                </div>
                <div className="text-[#0D824D]">
                  ✓ [Guardrail SLA] Zero-downtime cutover with automated rollback trigger enabled
                </div>
              </div>

              {/* Interactive verification button */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                <span className="text-[12px] text-[#475569]">
                  Automatic rollback dispatched if p99 latency increases &gt; 5%
                </span>
                <button
                  onClick={() => setApproved(!approved)}
                  className={`inline-flex items-center gap-2 text-[14px] font-medium px-5 py-2 rounded-full apple-btn-active transition-all ${
                    approved
                      ? "bg-[#0D824D] text-white"
                      : "bg-[#0062E0] text-white hover:bg-[#0052C2]"
                  }`}
                >
                  {approved ? (
                    <>
                      <Check className="w-4 h-4" />
                      Remediation Verified
                    </>
                  ) : (
                    "Simulate Safe Remediation"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
