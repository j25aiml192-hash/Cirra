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
          LIGHT SKY BLUE CANVAS WITH REAL FLUFFY CUMULUS CLOUDS & WHITE MIST
         ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft, light morning sky blue gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#BEE0FD] via-[#D5ECFE] via-30% via-[#E5F3FE] via-65% via-[#F0F8FF] to-[#FAFDFE]" />

        {/* Ambient Warm Sunbeam / Horizon Light Glow */}
        <div className="absolute -top-32 right-12 w-[650px] h-[650px] bg-gradient-to-br from-white/70 via-white/30 to-transparent rounded-full blur-[110px]" />

        {/* ==================== FLUFFY CUMULUS CLOUDS ==================== */}

        {/* Cloud 1: Top-Left Floating Cumulus (Shape A) */}
        <div className="absolute top-6 -left-12 w-[340px] sm:w-[420px] h-[160px] animate-float-cloud-left-1 opacity-95">
          <svg viewBox="0 0 320 120" className="w-full h-full drop-shadow-[0_16px_30px_rgba(10,50,90,0.08)] drop-shadow-[0_4px_10px_rgba(2,132,199,0.06)]">
            <defs>
              <linearGradient id="cloudGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="70%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F1F7FD" />
              </linearGradient>
            </defs>
            <path
              d="M 50 100 C 25 100 8 85 8 65 C 8 48 20 34 38 32 C 50 16 74 6 102 6 C 124 6 142 14 154 28 C 166 14 190 4 218 4 C 252 4 280 22 286 48 C 300 52 312 66 312 80 C 312 95 296 100 274 100 Z"
              fill="url(#cloudGrad1)"
              stroke="#E0EEFA"
              strokeWidth="1.2"
            />
          </svg>
        </div>

        {/* Cloud 2: Top-Right Billowing Cloud (Shape B) */}
        <div className="absolute top-12 -right-16 w-[360px] sm:w-[460px] h-[180px] animate-float-cloud-right-1 opacity-90">
          <svg viewBox="0 0 280 130" className="w-full h-full drop-shadow-[0_18px_34px_rgba(10,50,90,0.09)] drop-shadow-[0_6px_12px_rgba(2,132,199,0.07)]">
            <defs>
              <linearGradient id="cloudGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="65%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#EFF6FD" />
              </linearGradient>
            </defs>
            <path
              d="M 40 110 C 18 110 5 95 5 78 C 5 62 16 50 32 46 C 36 28 55 12 78 12 C 92 12 105 18 114 28 C 126 10 150 2 176 2 C 206 2 230 18 238 42 C 254 45 268 58 268 74 C 268 92 252 110 230 110 Z"
              fill="url(#cloudGrad2)"
              stroke="#DEECF9"
              strokeWidth="1.2"
            />
          </svg>
        </div>

        {/* Cloud 3: Mid-Left Soft Cumulus (Shape C) */}
        <div className="absolute top-[42%] -left-20 w-[380px] sm:w-[480px] h-[170px] animate-float-cloud-left-2 opacity-85">
          <svg viewBox="0 0 360 110" className="w-full h-full drop-shadow-[0_14px_28px_rgba(10,50,90,0.07)]">
            <defs>
              <linearGradient id="cloudGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="75%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F2F8FE" />
              </linearGradient>
            </defs>
            <path
              d="M 45 95 C 20 95 5 82 5 65 C 5 50 16 38 32 35 C 42 18 64 8 90 8 C 108 8 124 15 135 26 C 148 12 172 4 198 4 C 228 4 252 18 260 40 C 272 42 284 52 288 64 C 298 65 315 72 315 84 C 315 95 300 95 285 95 Z"
              fill="url(#cloudGrad3)"
              stroke="#E2EFFB"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Cloud 4: Mid-Right Drifting Fluffy Cloud (Shape A reversed) */}
        <div className="absolute top-[38%] -right-14 w-[320px] sm:w-[400px] h-[150px] animate-float-cloud-right-2 opacity-80 scale-x-[-1]">
          <svg viewBox="0 0 320 120" className="w-full h-full drop-shadow-[0_12px_24px_rgba(10,50,90,0.06)]">
            <path
              d="M 50 100 C 25 100 8 85 8 65 C 8 48 20 34 38 32 C 50 16 74 6 102 6 C 124 6 142 14 154 28 C 166 14 190 4 218 4 C 252 4 280 22 286 48 C 300 52 312 66 312 80 C 312 95 296 100 274 100 Z"
              fill="url(#cloudGrad1)"
              stroke="#E0EEFA"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Ambient Soft Smoke / Cloud Wisps Layer (Connecting the scene) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-t from-white/70 via-white/40 to-transparent rounded-full blur-[90px]" />

        {/* Horizon Bed of White Fluffy Clouds across the Bottom */}
        <div className="absolute -bottom-24 left-0 right-0 h-[320px] bg-gradient-to-t from-white via-white/95 via-50% via-white/60 to-transparent blur-2xl" />

        {/* Fluffy Cloud Lobe Bank at Bottom Left & Right */}
        <div className="absolute -bottom-12 -left-10 w-[580px] h-[220px] opacity-95">
          <svg viewBox="0 0 360 110" className="w-full h-full drop-shadow-[0_-8px_20px_rgba(10,50,90,0.05)]">
            <path
              d="M 45 95 C 20 95 5 82 5 65 C 5 50 16 38 32 35 C 42 18 64 8 90 8 C 108 8 124 15 135 26 C 148 12 172 4 198 4 C 228 4 252 18 260 40 C 272 42 284 52 288 64 C 298 65 315 72 315 84 C 315 95 300 95 285 95 Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
        <div className="absolute -bottom-14 -right-12 w-[620px] h-[240px] opacity-95 scale-x-[-1]">
          <svg viewBox="0 0 360 110" className="w-full h-full drop-shadow-[0_-8px_20px_rgba(10,50,90,0.05)]">
            <path
              d="M 45 95 C 20 95 5 82 5 65 C 5 50 16 38 32 35 C 42 18 64 8 90 8 C 108 8 124 15 135 26 C 148 12 172 4 198 4 C 228 4 252 18 260 40 C 272 42 284 52 288 64 C 298 65 315 72 315 84 C 315 95 300 95 285 95 Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      </div>

      {/* =========================================================================
          MAIN INTERACTIVE CHAT CONTENT
         ========================================================================= */}
      <div className="relative z-10 max-w-3xl w-full mx-auto px-4 pt-8 pb-16 flex flex-col flex-1">
        {messages.length === 0 ? (
          /* Empty State: Centered Sparkle, Clear Heading, & Frosted Query Pills */
          <div className="flex flex-col items-center gap-4 text-center my-auto py-6">
            {/* Sparkle Icon Squircle in Frosted Glass */}
            <div className="w-16 h-16 rounded-2xl bg-white/90 backdrop-blur-xl border border-white shadow-[0_12px_32px_rgba(2,106,162,0.14)] flex items-center justify-center transition-transform hover:scale-105 duration-200">
              <Sparkles className="w-8 h-8 text-[#0284C7]" />
            </div>

            {/* Main Heading with Crisp Stripe-Grade Contrast */}
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A2540] tracking-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
              Ask anything about your spend
            </h2>

            {/* Descriptive Subtitle */}
            <p className="text-[#335372] font-medium text-sm sm:text-base max-w-md drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] leading-relaxed">
              Cirra queries your live multi-cloud data — every number comes from ClickHouse FOCUS, never guessed
            </p>

            {/* Quick Prompt Pills in Pristine Frosted Cloud Glass */}
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
                  className="text-xs sm:text-[13px] font-semibold px-4.5 py-2.5 rounded-full border border-white bg-white/90 text-[#026AA2] hover:text-[#0055D6] hover:bg-white transition-all shadow-[0_4px_16px_rgba(2,106,162,0.10)] backdrop-blur-md hover:scale-[1.03] hover:shadow-[0_8px_24px_rgba(2,106,162,0.18)] cursor-pointer"
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
                    <div className="bg-[#0062E0] text-white rounded-[18px_18px_4px_18px] px-5 py-3 text-sm max-w-[80%] shadow-[0_4px_16px_rgba(0,98,224,0.25)] font-medium">
                      {entry.question}
                    </div>
                  </div>

                  {/* AI Answer Bubble & Verified Proof in Frosted Glass Card */}
                  <div className="flex justify-start">
                    <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-[18px_18px_18px_4px] p-5 max-w-[92%] shadow-[0_12px_40px_rgba(2,106,162,0.12)] space-y-3.5 w-full sm:w-auto text-[#0A192F]">
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
                        <details className="group rounded-xl bg-[#F4F9FE] border border-[#BAE6FD] p-3 text-xs text-[#0F1E36] font-mono overflow-x-auto">
                          <summary className="flex items-center justify-between cursor-pointer list-none text-[#026AA2] text-[11px] font-sans font-semibold select-none">
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
                <div className="bg-white/95 backdrop-blur-md border border-white rounded-[16px_16px_16px_4px] px-3.5 py-2 text-xs text-[#026AA2] font-semibold flex items-center gap-2 shadow-[0_4px_16px_rgba(2,106,162,0.10)]">
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
                         shadow-[0_12px_40px_rgba(2,106,162,0.12)]
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
          <p className="text-center text-xs font-semibold text-[#335372] mt-2.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
            Every number is sourced from your database — no hallucinated figures
          </p>
        </div>
      </div>
    </div>
  );
}
