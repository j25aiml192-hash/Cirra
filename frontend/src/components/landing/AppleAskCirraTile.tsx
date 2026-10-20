"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Database } from "lucide-react";

export function AppleAskCirraTile() {
  const [showSql, setShowSql] = React.useState(false);

  return (
    <section id="ask" className="w-full bg-[#f5f5f7] text-[#1d1d1f] py-24 px-4 sm:px-6">
      <div className="max-w-[1024px] mx-auto text-center">
        {/* Apple Headline Hierarchy */}
        <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-[#1d1d1f] leading-[1.10]">
          Ask Cirra.
        </h2>

        <p className="mt-2 text-[22px] sm:text-[28px] font-normal tracking-[0.007em] text-[#1d1d1f] leading-[1.14]">
          Deterministic FinOps intelligence.
        </p>

        <p className="mt-3 text-[17px] font-normal text-[#1d1d1f] tracking-[-0.015em] max-w-xl mx-auto leading-[1.47]">
          Ask natural questions about cloud bills, token surges, or customer gross margins.
          <br />
          <span className="text-[#7a7a7a]">Numbers come from your data, never from the LLM.</span>
        </p>

        {/* Product Render resting on surface with single system shadow */}
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
                  ask-cirra://query/openai-weekly-summary
                </span>
              </div>
              <span className="text-[11px] text-[#0066cc] font-medium bg-[#f0f5ff] px-2 py-0.5 rounded-full">
                RLS Verified Deterministic Query
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              {/* Natural language question */}
              <div className="p-3.5 bg-[#fafafc] rounded-[11px] border border-[#e0e0e0] text-[15px] font-medium text-[#1d1d1f]">
                &quot;Which OpenAI key spent the most last week?&quot;
              </div>

              {/* Result table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#e0e0e0] text-[#7a7a7a] text-[11px] uppercase tracking-wider font-semibold">
                      <th className="pb-3 font-medium">Key Identifier</th>
                      <th className="pb-3 font-medium">Team</th>
                      <th className="pb-3 font-medium">Token Volume</th>
                      <th className="pb-3 font-medium text-right">Billed Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0] text-[#1d1d1f]">
                    <tr>
                      <td className="py-3 font-mono font-medium">prod-copilot-service</td>
                      <td className="py-3 text-[#7a7a7a]">Core Platform</td>
                      <td className="py-3 font-mono">1.12B tokens</td>
                      <td className="py-3 text-right font-semibold font-mono">$14,250</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono font-medium">rag-embedding-pipeline</td>
                      <td className="py-3 text-[#7a7a7a]">Search &amp; Retrieval</td>
                      <td className="py-3 font-mono">420M tokens</td>
                      <td className="py-3 text-right font-semibold font-mono">$4,850</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono font-medium">eval-testing-runner</td>
                      <td className="py-3 text-[#7a7a7a]">Autonomous Eng</td>
                      <td className="py-3 font-mono">210M tokens</td>
                      <td className="py-3 text-right font-semibold font-mono">$3,120</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Expandable SQL */}
              <div className="rounded-[11px] bg-[#fafafc] border border-[#e0e0e0] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSql(!showSql)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-[12px] font-mono text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#0066cc]" />
                    {showSql ? "Hide Generated ClickHouse SQL" : "View Generated ClickHouse SQL"}
                  </span>
                  {showSql ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showSql && (
                  <div className="px-4 pb-3 pt-1 text-[11px] font-mono text-[#1d1d1f] border-t border-[#e0e0e0] bg-[#ffffff] overflow-x-auto">
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
