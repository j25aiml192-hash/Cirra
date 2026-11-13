"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, Terminal } from "lucide-react";
import { useAskCirra } from "@/hooks/useAsk";
import { formatNumber } from "@/lib/utils";

interface ChatEntry {
  question: string;
  answer: string;
  sql_used?: string;
  execution_time_ms?: number;
  row_count?: number;
  columns?: string[];
  rows?: any[];
}

export default function AskPage() {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const askCirra = useAskCirra();
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, askCirra.isPending]);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText ?? input).trim();
    if (!q || askCirra.isPending) return;

    setInput("");
    try {
      const res = await askCirra.mutateAsync(q);
      setMessages((prev) => [
        ...prev,
        {
          question: q,
          answer: res.answer,
          sql_used: res.sql_used || res.sql,
          execution_time_ms: res.execution_time_ms,
          row_count: res.row_count ?? (res.rows ? res.rows.length : 0),
          columns: res.columns,
          rows: res.rows,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          question: q,
          answer:
            err?.message ||
            "Unable to generate response at this time. Please try again.",
        },
      ]);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-2rem)] flex flex-col justify-between overflow-hidden select-none">
      {/* =========================================================================
          SKY BLUE CANVAS WITH BILLOWING WHITE SMOKE & VOLUMETRIC CLOUDS
         ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Sky Base Gradient: Vibrant summer daytime azure fading to soft horizon light */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0284C7] via-[#0EA5E9] via-30% via-[#38BDF8] via-60% via-[#7DD3FC] to-[#BAE6FD]" />

        {/* Ambient Sunlight Bloom (Upper Right Sky Glow) */}
        <div className="absolute -top-24 right-10 w-[600px] h-[600px] bg-gradient-to-br from-white/45 via-white/15 to-transparent rounded-full blur-[100px]" />

        {/* Floating White Smoke & Cumulus Cloud Formations */}
        {/* Cloud Puff 1: Drifting High Cumulus (Left) */}
        <div className="absolute top-10 -left-20 w-[680px] h-[340px] bg-white/60 rounded-full blur-[80px] animate-float-cloud-left-1" />

        {/* Cloud Puff 2: Billowing Soft White Smoke (Center-Top) */}
        <div className="absolute -top-10 left-1/3 -translate-x-1/2 w-[720px] h-[360px] bg-white/50 rounded-full blur-[90px] animate-float-cloud-left-2" />

        {/* Cloud Puff 3: Large Drifting Cloud Bank (Right) */}
        <div className="absolute top-20 -right-24 w-[760px] h-[380px] bg-white/65 rounded-full blur-[95px] animate-float-cloud-right-1" />

        {/* Cloud Puff 4: Mid-Sky Ambient White Smoke Wisps */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[440px] bg-gradient-to-t from-white/70 via-white/40 to-transparent rounded-full blur-[100px] animate-float-cloud-right-2" />

        {/* Cloud Puff 5: Bottom Horizon Bed of White Fluffy Clouds */}
        <div className="absolute -bottom-24 left-0 right-0 h-[340px] bg-gradient-to-t from-white via-white/85 via-40% via-white/50 to-transparent blur-3xl" />
        <div className="absolute -bottom-10 left-10 w-[550px] h-[260px] bg-white/80 rounded-full blur-[70px] animate-float-cloud-left-1" />
        <div className="absolute -bottom-12 right-20 w-[620px] h-[280px] bg-white/75 rounded-full blur-[75px] animate-float-cloud-right-1" />

        {/* Subtle Organic Sky Depth Texture */}
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* =========================================================================
          MAIN INTERACTIVE CHAT CONTENT
         ========================================================================= */}
      <div className="relative z-10 max-w-3xl w-full mx-auto px-4 pt-10 pb-20 flex flex-col flex-1">
        {messages.length === 0 ? (
          /* Empty State: Centered Sparkle, Clear Heading, & Frosted Query Pills */
          <div className="flex flex-col items-center gap-4 text-center my-auto py-8">
            {/* Sparkle Icon Squircle in Frosted Glass */}
            <div className="w-16 h-16 rounded-2xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_12px_36px_rgba(2,132,199,0.25)] flex items-center justify-center transition-transform hover:scale-105 duration-200">
              <Sparkles className="w-8 h-8 text-[#0284C7]" />
            </div>

            {/* Main Heading with Crisp Contrast */}
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#061A3A] tracking-tight drop-shadow-[0_1px_3px_rgba(255,255,255,0.7)]">
              Ask anything about your spend
            </h2>

            {/* Descriptive Subtitle */}
            <p className="text-[#0C3260] font-medium text-sm sm:text-base max-w-md drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)] leading-relaxed">
              Cirra queries your live multi-cloud data — every number comes from ClickHouse FOCUS, never guessed
            </p>

            {/* Quick Prompt Pills in Frosted Cloud Glass */}
            <div className="flex flex-wrap gap-2.5 justify-center mt-3 max-w-xl">
              {[
                "Why did OpenAI spend spike last week?",
                "Which team spent most on EC2 this month?",
                "What's our unallocated spend?",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleAsk(q)}
                  className="text-xs sm:text-[13px] font-semibold px-4.5 py-2.5 rounded-full border border-white bg-white/85 text-[#0369A1] hover:text-[#0062E0] hover:bg-white transition-all shadow-[0_4px_18px_rgba(2,132,199,0.14)] backdrop-blur-md hover:scale-[1.03] hover:shadow-[0_8px_25px_rgba(2,132,199,0.22)] cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Response Area: User & Assistant Bubble Stream */
          <div className="flex-1 space-y-6 overflow-y-auto pr-2 pb-6 max-h-[calc(100vh-220px)]">
            {messages.map((entry, index) => {
              const sqlQuery = entry.sql_used;
              const rowCount = entry.row_count ?? (entry.rows ? entry.rows.length : 0);
              const columns =
                entry.columns && entry.columns.length > 0
                  ? entry.columns
                  : entry.rows && entry.rows.length > 0 && typeof entry.rows[0] === "object" && !Array.isArray(entry.rows[0])
                  ? Object.keys(entry.rows[0])
                  : [];

              return (
                <div key={index} className="space-y-4">
                  {/* User Question Bubble */}
                  <div className="flex justify-end">
                    <div className="bg-[#0062E0] text-white rounded-[18px_18px_4px_18px] px-5 py-3 text-sm max-w-[80%] shadow-[0_4px_16px_rgba(0,98,224,0.30)] font-medium">
                      {entry.question}
                    </div>
                  </div>

                  {/* AI Answer Bubble & Verified Proof in Frosted Glass Card */}
                  <div className="flex justify-start">
                    <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-[18px_18px_18px_4px] p-5 max-w-[92%] shadow-[0_12px_40px_rgba(2,132,199,0.18)] space-y-3.5 w-full sm:w-auto text-[#0A192F]">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E2E8F0] gap-4">
                        <div className="flex items-center gap-1.5 font-bold text-[#0F1E36]">
                          <Bot className="w-4 h-4 text-[#0062E0]" />
                          <span>Cirra Verified Response</span>
                        </div>
                        {entry.execution_time_ms !== undefined && (
                          <span className="text-[#64748B] font-mono text-[11px] whitespace-nowrap">
                            Query ran in {Math.round(entry.execution_time_ms)}ms
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-[#0F1E36] leading-relaxed font-normal">
                        {entry.answer}
                      </p>

                      {/* Collapsible SQL Code Block */}
                      {sqlQuery && (
                        <details className="group rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] p-3 text-xs text-[#0F1E36] font-mono overflow-x-auto">
                          <summary className="flex items-center justify-between cursor-pointer list-none text-[#0369A1] text-[11px] font-sans font-semibold select-none">
                            <div className="flex items-center gap-2">
                              <Terminal className="w-3.5 h-3.5" />
                              <span>Executed SQL against FOCUS ClickHouse</span>
                            </div>
                            <span className="text-[10px] text-[#0062E0] group-open:hidden">
                              Show SQL
                            </span>
                            <span className="text-[10px] text-[#0062E0] hidden group-open:inline">
                              Hide SQL
                            </span>
                          </summary>
                          <pre className="mt-2 text-xs font-mono text-[#0A192F] whitespace-pre-wrap break-all pt-2 border-t border-[#BAE6FD]/60">
                            <code>{sqlQuery}</code>
                          </pre>
                        </details>
                      )}

                      {/* Row Results Table if row_count > 0 */}
                      {rowCount > 0 && entry.rows && entry.rows.length > 0 && (
                        <div className="rounded-xl border border-[#D6E4F5] overflow-hidden mt-3 shadow-xs">
                          <div className="overflow-x-auto max-h-60">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead className="bg-[#EBF4FE] text-[#334155] border-b border-[#D6E4F5] sticky top-0">
                                <tr>
                                  {columns.map((col, cIdx) => (
                                    <th
                                      key={cIdx}
                                      className="px-3 py-2 font-bold whitespace-nowrap"
                                    >
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#EBF2FA] bg-white">
                                {entry.rows.slice(0, 15).map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-[#F8FAFD]">
                                    {columns.map((col, cIdx) => {
                                      const cellVal = Array.isArray(row)
                                        ? row[cIdx]
                                        : (row as Record<string, unknown>)[col];
                                      return (
                                        <td
                                          key={cIdx}
                                          className="px-3 py-2 font-mono text-[#334155] whitespace-nowrap"
                                        >
                                          {typeof cellVal === "number"
                                            ? formatNumber(cellVal)
                                            : String(cellVal ?? "")}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {entry.rows.length > 15 && (
                            <div className="text-[11px] text-[#64748B] px-3 py-1.5 bg-[#F8FAFD] border-t border-[#D6E4F5] text-center font-medium">
                              Showing first 15 of {rowCount} rows
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {askCirra.isPending && (
              <div className="flex justify-start">
                <div className="bg-white/95 backdrop-blur-md border border-white rounded-[16px_16px_16px_4px] px-3.5 py-2 text-xs text-[#0369A1] font-semibold flex items-center gap-2 shadow-[0_4px_16px_rgba(2,132,199,0.14)]">
                  <Bot className="w-3.5 h-3.5 text-[#0062E0] animate-pulse" />
                  <span>Checking FOCUS query data...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}

        {/* Input Bar: Pristine Frosted Glass Pill */}
        <div className="w-full mt-auto relative pt-4">
          <div className="relative flex items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask anything about your spend..."
              className="w-full h-14 pl-6 pr-16 rounded-full bg-white/95 backdrop-blur-2xl
                         border-2 border-white text-[#0A192F] placeholder:text-[#64748B] text-sm sm:text-base
                         shadow-[0_14px_45px_rgba(2,132,199,0.22)]
                         focus:outline-none focus:border-[#0062E0] focus:ring-4 focus:ring-[#38BDF8]/40 transition-all font-medium"
            />
            <button
              type="button"
              onClick={() => handleAsk()}
              disabled={!input.trim() || askCirra.isPending}
              className="absolute right-2.5 w-10 h-10 rounded-full bg-gradient-to-tr from-[#0062E0] to-[#0284C7] hover:from-[#0052C2] hover:to-[#0369A1] flex items-center justify-center disabled:opacity-40 transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-center text-xs font-semibold text-[#0B3A6E] mt-2.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
            Every number is sourced from your database — no hallucinated figures
          </p>
        </div>
      </div>
    </div>
  );
}
