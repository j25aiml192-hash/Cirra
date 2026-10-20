"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SavingsLedgerTile() {
  return (
    <section id="ledger" className="w-full bg-[#2a2a2c] text-[#ffffff] py-24 px-4 sm:px-6">
      <div className="max-w-[1024px] mx-auto text-center">
        {/* Apple Headline Hierarchy */}
        <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-[#ffffff] leading-[1.10]">
          Savings Ledger.
        </h2>

        <p className="mt-2 text-[22px] sm:text-[28px] font-normal tracking-[0.007em] text-[#ffffff] leading-[1.14]">
          Audited proof. Down to the cent.
        </p>

        <p className="mt-3 text-[17px] font-normal text-[#cccccc] tracking-[-0.015em] max-w-xl mx-auto leading-[1.47]">
          Every dollar saved is proven with counterfactual telemetry comparing realized spend against baseline models. Cryptographically verified and exportable for CFO board reporting.
        </p>

        {/* Action Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center text-[15px] sm:text-[17px] font-normal text-[#ffffff] bg-[#0066cc] hover:bg-[#0071e3] px-6 py-2.5 rounded-full apple-btn-active transition-all"
          >
            Inspect the Ledger
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-[15px] sm:text-[17px] font-normal text-[#2997ff] hover:underline"
          >
            <span>Read CFO Whitepaper</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Render resting on Near-Black Tile 2 with system shadow */}
        <div className="mt-14 max-w-[860px] mx-auto">
          <div
            className="rounded-[18px] bg-[#272729] border border-[#3a3a3c] apple-product-shadow overflow-hidden text-left"
            style={{ boxShadow: "rgba(0, 0, 0, 0.22) 3px 5px 30px 0" }}
          >
            {/* Header bar */}
            <div className="h-10 bg-[#252527] border-b border-[#3a3a3c] px-4 flex items-center justify-between text-[12px] text-[#cccccc]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3a3a3c]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#3a3a3c]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#3a3a3c]" />
                <span className="ml-2 font-mono text-[11px] text-[#8e8e93]">
                  ledger://audit/q4-savings-summary
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#30d158]">
                Quarter-To-Date: $102,600 Verified
              </span>
            </div>

            {/* Table Body */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#3a3a3c] text-[#8e8e93] text-[11px] uppercase tracking-wider font-semibold">
                      <th className="pb-3 font-medium">Remediation Action</th>
                      <th className="pb-3 font-medium">Pillar</th>
                      <th className="pb-3 font-medium">Counterfactual Baseline</th>
                      <th className="pb-3 font-medium">Realized Spend</th>
                      <th className="pb-3 font-medium text-right">Proven Savings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333333] text-[#cccccc]">
                    <tr>
                      <td className="py-3.5 text-[#ffffff] font-medium">
                        Purged 14 Unattached EBS gp3 Volumes
                      </td>
                      <td className="py-3.5 text-[#8e8e93]">ACT / Cleanup</td>
                      <td className="py-3.5 font-mono">$3,420/mo</td>
                      <td className="py-3.5 font-mono">$0/mo</td>
                      <td className="py-3.5 text-right font-semibold text-[#30d158] font-mono">
                        +$3,420/mo
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-[#ffffff] font-medium">
                        GPT-4o Semantic Model Routing
                      </td>
                      <td className="py-3.5 text-[#8e8e93]">PROVE / AI Margin</td>
                      <td className="py-3.5 font-mono">$18,200/mo</td>
                      <td className="py-3.5 font-mono">$4,100/mo</td>
                      <td className="py-3.5 text-right font-semibold text-[#30d158] font-mono">
                        +$14,100/mo
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-[#ffffff] font-medium">
                        Sentinel Auto-Kill: Leaked API Key
                      </td>
                      <td className="py-3.5 text-[#8e8e93]">GUARD / Circuit Breaker</td>
                      <td className="py-3.5 font-mono">$12,000 risk</td>
                      <td className="py-3.5 font-mono">$42 blast</td>
                      <td className="py-3.5 text-right font-semibold text-[#30d158] font-mono">
                        +$11,958 avoided
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Immutable Hash Signature */}
              <div className="pt-3 border-t border-[#3a3a3c] flex flex-wrap items-center justify-between text-[11px] text-[#8e8e93] font-mono">
                <span>Cryptographic verification: sha256:4f81c9a01...88f2b</span>
                <span className="text-[#2997ff]">Export signed CFO packet (PDF)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
