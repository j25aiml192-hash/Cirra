"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SavingsLedgerTile() {
  return (
    <section id="ledger" className="w-full bg-[#F1F6FD] text-[#0A192F] py-24 px-4 sm:px-6 scroll-mt-20">
      <div className="max-w-[1024px] mx-auto text-center">
        {/* Apple Headline Hierarchy */}
        <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-[#0A192F] leading-[1.10]">
          Savings Ledger.
        </h2>

        <p className="mt-2 text-[22px] sm:text-[28px] font-normal tracking-[0.007em] text-[#0A192F] leading-[1.14]">
          Audited proof. Down to the cent.
        </p>

        <p className="mt-3 text-[17px] font-normal text-[#475569] tracking-[-0.015em] max-w-xl mx-auto leading-[1.47]">
          Every dollar saved is proven with counterfactual telemetry comparing realized spend against baseline models. Cryptographically verified and exportable for CFO board reporting.
        </p>

        {/* Action Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center text-[15px] sm:text-[17px] font-medium text-white bg-[#0062E0] hover:bg-[#0052C2] px-6 py-2.5 rounded-full apple-btn-active transition-all"
          >
            Inspect the Ledger
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-[15px] sm:text-[17px] font-medium text-[#0062E0] hover:underline"
          >
            <span>Read CFO Whitepaper</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Render resting on Near-Black Tile 2 with system shadow */}
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
                  ledger://architecture/verification-engine
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#0D824D] bg-[#E6F8F0] border border-[#B3ECCB] px-2.5 py-0.5 rounded-full">
                Mathematical Proof Standard
              </span>
            </div>

            {/* General Capabilities Grid */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#D6E4F5] space-y-2">
                  <div className="text-[14px] font-semibold text-[#0A192F]">
                    Counterfactual Baselines
                  </div>
                  <p className="text-[12px] text-[#475569] leading-[1.5]">
                    Separates true optimization from organic traffic drops by contrasting actual invoices against dynamic pre-action forecasts.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#D6E4F5] space-y-2">
                  <div className="text-[14px] font-semibold text-[#0A192F]">
                    FOCUS 1.0 Reconciliation
                  </div>
                  <p className="text-[12px] text-[#475569] leading-[1.5]">
                    Normalizes heterogeneous cloud invoices and AI token consumption into a single transparent accounting schema.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#D6E4F5] space-y-2">
                  <div className="text-[14px] font-semibold text-[#0A192F]">
                    CFO &amp; Audit Ready
                  </div>
                  <p className="text-[12px] text-[#475569] leading-[1.5]">
                    Tamper-evident verification logs certify exact realized ROI for finance leadership, auditors, and board decks.
                  </p>
                </div>
              </div>

              {/* General Telemetry Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#D6E4F5] text-[#475569] text-[11px] uppercase tracking-wider font-semibold">
                      <th className="pb-3 font-medium">Optimization Category</th>
                      <th className="pb-3 font-medium">Baseline Modeling</th>
                      <th className="pb-3 font-medium">Standard</th>
                      <th className="pb-3 font-medium text-right">Verification Output</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBF2FA] text-[#334155]">
                    <tr>
                      <td className="py-3.5 text-[#0A192F] font-medium">
                        Multi-Cloud Compute &amp; DB Rightsizing
                      </td>
                      <td className="py-3.5 text-[#64748B]">Historical 90-Day p95</td>
                      <td className="py-3.5 font-mono text-[#0062E0]">FOCUS 1.0</td>
                      <td className="py-3.5 text-right font-medium text-[#0D824D]">
                        Realized Spend Delta
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-[#0A192F] font-medium">
                        Foundation Model &amp; Token Routing
                      </td>
                      <td className="py-3.5 text-[#64748B]">Semantic Tier Baseline</td>
                      <td className="py-3.5 font-mono text-[#0062E0]">Open Cost Standard</td>
                      <td className="py-3.5 text-right font-medium text-[#0D824D]">
                        Net Margin Efficiency
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-[#0A192F] font-medium">
                        Sentinel Automated Circuit Breakers
                      </td>
                      <td className="py-3.5 text-[#64748B]">Pre-Incident Burn Velocity</td>
                      <td className="py-3.5 font-mono text-[#0062E0]">Time-Series EWMA</td>
                      <td className="py-3.5 text-right font-medium text-[#0D824D]">
                        Avoided Blast Radius
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* General Compliance Footer */}
              <div className="pt-3 border-t border-[#D6E4F5] flex flex-wrap items-center justify-between text-[11px] text-[#64748B] font-mono">
                <span>Cryptographic proof architecture: SHA-256 verifiable audit records</span>
                <span className="text-[#0062E0]">Board-certified accounting compliance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
