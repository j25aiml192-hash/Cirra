"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Check } from "lucide-react";

export function ActionCenterTile() {
  const [approved, setApproved] = React.useState(false);

  return (
    <section id="actions" className="w-full bg-[#f5f5f7] text-[#1d1d1f] py-24 px-4 sm:px-6">
      <div className="max-w-[1024px] mx-auto text-center">
        {/* Apple Headline Hierarchy */}
        <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-[#1d1d1f] leading-[1.10]">
          Action Center.
        </h2>

        <p className="mt-2 text-[22px] sm:text-[28px] font-normal tracking-[0.007em] text-[#1d1d1f] leading-[1.14]">
          Human in the loop. Verified in production.
        </p>

        <p className="mt-3 text-[17px] font-normal text-[#1d1d1f] tracking-[-0.015em] max-w-xl mx-auto leading-[1.47]">
          Recommendations without safety are dangerous. Cirra pairs automated FinOps intelligence with dry-run verification, GitHub pull-request cost comments, and 1-click rollback.
        </p>

        {/* Action Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center text-[15px] sm:text-[17px] font-normal text-[#ffffff] bg-[#0066cc] hover:bg-[#0071e3] px-6 py-2.5 rounded-full apple-btn-active transition-all"
          >
            Explore Action Center
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-[15px] sm:text-[17px] font-normal text-[#0066cc] hover:underline"
          >
            <span>Learn about rollback safety</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Render resting on Parchment with the system shadow */}
        <div className="mt-14 max-w-[860px] mx-auto">
          <div
            className="rounded-[18px] bg-[#ffffff] border border-[#e0e0e0] apple-product-shadow overflow-hidden text-left"
            style={{ boxShadow: "rgba(0, 0, 0, 0.22) 3px 5px 30px 0" }}
          >
            {/* Header bar */}
            <div className="h-10 bg-[#fafafc] border-b border-[#e0e0e0] px-4 flex items-center justify-between text-[12px] text-[#7a7a7a]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e0e0e0]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#e0e0e0]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#e0e0e0]" />
                <span className="ml-2 font-mono text-[11px] text-[#7a7a7a]">
                  action-orchestrator://temporal/rec_9921
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#0066cc] bg-[#f0f5ff] px-2.5 py-0.5 rounded-full">
                Pre-Execution Dry-Run Passed
              </span>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#f0f0f0]">
                <div>
                  <h3 className="text-[18px] font-semibold text-[#1d1d1f]">
                    Rightsize Overprovisioned RDS PostgreSQL Cluster
                  </h3>
                  <p className="text-[13px] text-[#7a7a7a] mt-1 font-mono">
                    Instance db.r6g.4xlarge (8% avg CPU) → db.r6g.xlarge • Zero Downtime
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[24px] font-semibold text-[#1d1d1f] block">
                    Save $1,420/mo
                  </span>
                  <span className="text-[12px] text-[#7a7a7a]">Annual ROI: $17,040</span>
                </div>
              </div>

              {/* Simulation trace */}
              <div className="rounded-[11px] bg-[#fafafc] p-4 font-mono text-[13px] text-[#1d1d1f] space-y-1.5 border border-[#e0e0e0]">
                <div className="text-[#0066cc]">
                  ✓ [Dry-Run] Target replica spun up in us-east-1a
                </div>
                <div className="text-[#0066cc]">
                  ✓ [Dry-Run] Replication lag: 0.1ms • Failover health test verified
                </div>
                <div className="text-[#7a7a7a]">
                  → [Temporal] Awaiting authenticated engineer sign-off
                </div>
              </div>

              {/* Interactive approval button */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                <span className="text-[12px] text-[#7a7a7a]">
                  Auto-rollback enabled if p99 query latency increases &gt; 5%
                </span>
                <button
                  onClick={() => setApproved(!approved)}
                  className={`inline-flex items-center gap-2 text-[14px] font-normal px-5 py-2 rounded-full apple-btn-active transition-all ${
                    approved
                      ? "bg-[#30d158] text-[#ffffff]"
                      : "bg-[#0066cc] text-[#ffffff] hover:bg-[#0071e3]"
                  }`}
                >
                  {approved ? (
                    <>
                      <Check className="w-4 h-4" />
                      Approved &amp; Executed
                    </>
                  ) : (
                    "Approve & Execute Migration"
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
