"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Database } from "lucide-react";

export function AppleAskCirraTile() {
  const [showSql, setShowSql] = React.useState(false);

  return (
    <section id="ask" className="w-full bg-[#F1F6FD] text-[#0A192F] py-24 px-4 sm:px-6">
      <div className="max-w-[1024px] mx-auto text-center">
        {/* Apple Headline Hierarchy */}
        <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-[#0A192F] leading-[1.10]">
          Ask Cirra.
        </h2>

        <p className="mt-2 text-[22px] sm:text-[28px] font-normal tracking-[0.007em] text-[#0A192F] leading-[1.14]">
          Deterministic FinOps intelligence.
        </p>

        <p className="mt-3 text-[17px] font-normal text-[#475569] tracking-[-0.015em] max-w-xl mx-auto leading-[1.47]">
          Ask natural questions about cloud bills, token surges, or customer gross margins.
          <br />
          <span className="text-[#475569]">Numbers come from your data, never from the LLM.</span>
        </p>

        {/* Product Render resting on surface with single system shadow */}
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
                  ask-cirra://architecture/deterministic-engine
                </span>
              </div>
              <span className="text-[11px] text-[#0062E0] font-medium bg-[#EBF3FE] border border-[#BCD9FC] px-2.5 py-0.5 rounded-full">
                Zero-Hallucination Query Engine
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Natural language question */}
              <div className="p-4 bg-[#F8FAFD] rounded-[11px] border border-[#D6E4F5] space-y-1">
                <div className="text-[11px] font-mono text-[#0062E0] uppercase tracking-wider font-semibold">
                  Example Natural Language Query
                </div>
                <div className="text-[16px] font-medium text-[#0A192F]">
                  &quot;Show total multi-cloud and AI foundation spend broken down by team and normalized unit cost.&quot;
                </div>
              </div>

              {/* General 3-Stage Process Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#D6E4F5] space-y-2">
                  <div className="text-[11px] font-mono text-[#0062E0] uppercase tracking-wider font-semibold">
                    Step 01
                  </div>
                  <div className="text-[14px] font-semibold text-[#0A192F]">
                    Semantic Parsing
                  </div>
                  <p className="text-[12px] text-[#475569] leading-[1.5]">
                    Translates natural questions into mathematically verified queries without passing sensitive tenant data to the LLM.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#D6E4F5] space-y-2">
                  <div className="text-[11px] font-mono text-[#0062E0] uppercase tracking-wider font-semibold">
                    Step 02
                  </div>
                  <div className="text-[14px] font-semibold text-[#0A192F]">
                    Row-Level Security
                  </div>
                  <p className="text-[12px] text-[#475569] leading-[1.5]">
                    Enforces strict PostgreSQL 15 RLS perimeters so queries only execute within verified tenant permission boundaries.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#D6E4F5] space-y-2">
                  <div className="text-[11px] font-mono text-[#0062E0] uppercase tracking-wider font-semibold">
                    Step 03
                  </div>
                  <div className="text-[14px] font-semibold text-[#0A192F]">
                    Deterministic Compute
                  </div>
                  <p className="text-[12px] text-[#475569] leading-[1.5]">
                    Executes directly on ClickHouse columnar data. Every number is calculated with 100% mathematical precision.
                  </p>
                </div>
              </div>

              {/* Expandable SQL Architecture */}
              <div className="rounded-[11px] bg-[#F8FAFD] border border-[#D6E4F5] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSql(!showSql)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-[12px] font-mono text-[#475569] hover:text-[#0A192F] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#0062E0]" />
                    {showSql ? "Hide Deterministic FOCUS 1.0 SQL" : "View Deterministic FOCUS 1.0 SQL"}
                  </span>
                  {showSql ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showSql && (
                  <div className="px-4 pb-3 pt-1 text-[11px] font-mono text-[#334155] border-t border-[#D6E4F5] bg-white overflow-x-auto">
                    <pre className="leading-relaxed">
                      <code>{`SELECT ProviderName, ServiceCategory, TeamTag, sum(EffectiveCost) AS TotalSpend
FROM focus_normalized_costs
WHERE ChargePeriodStart >= now() - INTERVAL 30 DAY
GROUP BY ProviderName, ServiceCategory, TeamTag
ORDER BY TotalSpend DESC;`}</code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Guarantees Footer */}
              <div className="grid grid-cols-3 gap-4 pt-1 text-[12px]">
                <div>
                  <span className="text-[#64748B] block">Hallucination Rate</span>
                  <span className="text-[16px] font-semibold text-[#0D824D] mt-0.5 block">
                    0.0% Deterministic
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Isolation Standard</span>
                  <span className="text-[16px] font-semibold text-[#0A192F] mt-0.5 block">
                    PostgreSQL 15 RLS
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Query Engine</span>
                  <span className="text-[16px] font-semibold text-[#0A192F] mt-0.5 block">
                    ClickHouse Columnar
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
