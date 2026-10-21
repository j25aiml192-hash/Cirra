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
                <span className="w-2.5 h-2.5 rounded-full bg-[#e0e0e0]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#e0e0e0]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#e0e0e0]" />
                <span className="ml-2 font-mono text-[11px] text-[#64748B]">
                  ask-cirra://query/openai-weekly-summary
                </span>
              </div>
              <span className="text-[11px] text-[#0062E0] font-medium bg-[#EBF3FE] px-2 py-0.5 rounded-full">
                RLS Verified Deterministic Query
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              {/* Natural language question */}
              <div className="p-3.5 bg-[#F8FAFD] rounded-[11px] border border-[#D6E4F5] text-[15px] font-medium text-[#0A192F]">
                &quot;Which OpenAI key spent the most last week?&quot;
              </div>

              {/* Result table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#D6E4F5] text-[#475569] text-[11px] uppercase tracking-wider font-semibold">
                      <th className="pb-3 font-medium">Key Identifier</th>
                      <th className="pb-3 font-medium">Team</th>
                      <th className="pb-3 font-medium">Token Volume</th>
                      <th className="pb-3 font-medium text-right">Billed Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBF2FA] text-[#0F1E36]">
                    <tr>
                      <td className="py-3 font-mono font-medium">prod-copilot-service</td>
                      <td className="py-3 text-[#64748B]">Core Platform</td>
                      <td className="py-3 font-mono">1.12B tokens</td>
                      <td className="py-3 text-right font-semibold font-mono">$14,250</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono font-medium">rag-embedding-pipeline</td>
                      <td className="py-3 text-[#64748B]">Search &amp; Retrieval</td>
                      <td className="py-3 font-mono">420M tokens</td>
                      <td className="py-3 text-right font-semibold font-mono">$4,850</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono font-medium">eval-testing-runner</td>
                      <td className="py-3 text-[#64748B]">Autonomous Eng</td>
                      <td className="py-3 font-mono">210M tokens</td>
                      <td className="py-3 text-right font-semibold font-mono">$3,120</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Expandable SQL */}
              <div className="rounded-[11px] bg-[#F8FAFD] border border-[#D6E4F5] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSql(!showSql)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-[12px] font-mono text-[#475569] hover:text-[#0A192F] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#0062E0]" />
                    {showSql ? "Hide Generated ClickHouse SQL" : "View Generated ClickHouse SQL"}
                  </span>
                  {showSql ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showSql && (
                  <div className="px-4 pb-3 pt-1 text-[11px] font-mono text-[#334155] border-t border-[#D6E4F5] bg-white overflow-x-auto">
                    <pre className="leading-relaxed">
                      <code>{`SELECT key_name, team_tag, sum(total_tokens) AS token_volume, sum(billed_cost_usd) AS total_spend
FROM focus_ai_telemetry
WHERE provider = 'openai' AND event_timestamp >= now() - INTERVAL 7 DAY
GROUP BY key_name, team_tag ORDER BY total_spend DESC;`}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
