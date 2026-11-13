"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Bot, Terminal, Paperclip, ChevronDown, ArrowUp, TrendingUp, Server, Layers } from "lucide-react";
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
  const [citationEnabled, setCitationEnabled] = useState(true);
  const [writingStyle, setWritingStyle] = useState("Writing Styles");
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const styleMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const askCirra = useAskCirra();

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, askCirra.isPending]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (styleMenuRef.current && !styleMenuRef.current.contains(e.target as Node)) {
        setStyleDropdownOpen(false);
      }
    };
    if (styleDropdownOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [styleDropdownOpen]);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText ?? input).trim();
    if (!q || askCirra.isPending) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

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

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file.name);
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

        {/* Cloud 1: Top-Left Floating Cumulus */}
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

        {/* Cloud 2: Top-Right Billowing Cloud */}
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

        {/* Cloud 3: Mid-Left Soft Cumulus */}
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

        {/* Cloud 4: Mid-Right Drifting Fluffy Cloud */}
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

        {/* Ambient Soft Smoke / Cloud Wisps Layer */}
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
      <div className="relative z-10 max-w-3xl w-full mx-auto px-4 pt-6 pb-12 flex flex-col flex-1">
        {messages.length === 0 ? (
          /* Empty State: Cirra Logo in Frosted Squircle, Clear Heading, & Frosted Query Pills */
          <div className="flex flex-col items-center gap-4 text-center my-auto py-4">
            {/* CIRRA LOGO replacing the sparkle icon */}
            <div className="w-20 h-20 rounded-2xl bg-white/95 backdrop-blur-xl border border-white shadow-[0_12px_32px_rgba(2,106,162,0.16)] p-3 flex items-center justify-center transition-transform hover:scale-105 duration-200">
              <img
                src="/cirra-logo.png"
                alt="Cirra Logo"
                className="w-full h-full object-contain rounded-xl shadow-xs"
              />
            </div>

            {/* Main Heading with Crisp Stripe-Grade Contrast */}
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A2540] tracking-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
              Ask anything about your spend
            </h2>

            {/* Descriptive Subtitle */}
            <p className="text-[#335372] font-medium text-sm sm:text-base max-w-md drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] leading-relaxed">
              Cirra queries your live multi-cloud data — every number comes from ClickHouse FOCUS, never guessed
            </p>

            {/* Restructured Prompt Suggestion Cards (Balanced 3-Column Glass Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-4 text-left">
              {[
                {
                  category: "Anomaly Spike",
                  icon: TrendingUp,
                  query: "Why did OpenAI spend spike last week?",
                  desc: "Detect LLM token surge & drift",
                },
                {
                  category: "Attribution",
                  icon: Server,
                  query: "Which team spent most on EC2 this month?",
                  desc: "Multi-cloud compute by team",
                },
                {
                  category: "Governance",
                  icon: Layers,
                  query: "What's our unallocated spend?",
                  desc: "Inspect orphan & untagged spend",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.query}
                    type="button"
                    onClick={() => handleAsk(item.query)}
                    className="group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white/90 hover:bg-white border border-white shadow-[0_6px_20px_rgba(2,106,162,0.08)] hover:shadow-[0_12px_28px_rgba(2,106,162,0.16)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer text-left overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-[#0284C7] font-bold text-[11px] uppercase tracking-wider mb-2">
                        <span className="w-5 h-5 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center flex-shrink-0 group-hover:bg-[#0062E0] group-hover:text-white transition-colors">
                          <Icon className="w-3 h-3" />
                        </span>
                        <span className="truncate">{item.category}</span>
                      </div>
                      <p className="text-xs sm:text-[13px] font-semibold text-[#0A2540] group-hover:text-[#0062E0] transition-colors leading-snug">
                        {item.query}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100/80">
                      <span className="text-[10px] text-[#64748B] font-medium truncate">
                        {item.desc}
                      </span>
                      <span className="w-4 h-4 rounded-full bg-slate-100 group-hover:bg-[#0062E0] text-slate-400 group-hover:text-white flex items-center justify-center flex-shrink-0 transition-all text-[10px]">
                        →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Response Area: User & Assistant Bubble Stream */
          <div className="flex-1 space-y-6 overflow-y-auto pr-2 pb-6 max-h-[calc(100vh-250px)]">
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
                        <div className="flex items-center gap-2 font-bold text-[#0F1E36]">
                          <img src="/cirra-logo.png" alt="Cirra" className="w-4 h-4 object-contain rounded" />
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

                      {/* Collapsible SQL Code Block (respecting Citation toggle) */}
                      {citationEnabled && sqlQuery && (
                        <details open className="group rounded-xl bg-[#F4F9FE] border border-[#BAE6FD] p-3 text-xs text-[#0F1E36] font-mono overflow-x-auto">
                          <summary className="flex items-center justify-between cursor-pointer list-none text-[#026AA2] text-[11px] font-sans font-semibold select-none">
                            <div className="flex items-center gap-2">
                              <Terminal className="w-3.5 h-3.5" />
                              <span>ClickHouse FOCUS SQL Citation</span>
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

        {/* =========================================================================
            PROMPT INPUT CARD (MATCHING USER'S IMAGE SPECIFICATION)
           ========================================================================= */}
        <div className="w-full mt-auto relative pt-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Frosted Modern Prompt Card */}
          <div className="w-full rounded-[22px] bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_14px_45px_rgba(2,106,162,0.14)] p-3.5 sm:p-4 transition-all focus-within:ring-2 focus-within:ring-[#0062E0]/20 focus-within:border-[#0062E0]/40">
            {/* Attached file tag if any */}
            {attachedFile && (
              <div className="mb-2 flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg w-max">
                <Paperclip className="w-3 h-3" />
                <span className="truncate max-w-[200px] font-mono">{attachedFile}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-blue-500 hover:text-blue-900 ml-1 font-bold"
                >
                  ×
                </button>
              </div>
            )}

            {/* Top Text Input Row */}
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-slate-800 mt-1 flex-shrink-0" />
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI a question or make a request..."
                className="w-full bg-transparent text-[#0A192F] placeholder:text-slate-500 text-sm sm:text-[15px] resize-none outline-none border-none p-0 focus:ring-0 leading-relaxed font-normal min-h-[28px] max-h-[160px]"
              />
            </div>

            {/* Bottom Controls Toolbar */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 flex-wrap gap-2">
              {/* Left Buttons: Attach & Writing Styles */}
              <div className="flex items-center gap-2">
                {/* Attach Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                  title="Attach file or logs"
                >
                  <Paperclip className="w-3.5 h-3.5 text-slate-600" />
                  <span>Attach</span>
                </button>

                {/* Writing Styles Dropdown */}
                <div className="relative" ref={styleMenuRef}>
                  <button
                    type="button"
                    onClick={() => setStyleDropdownOpen((prev) => !prev)}
                    className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                  >
                    <span>{writingStyle}</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {styleDropdownOpen && (
                    <div className="absolute left-0 bottom-10 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                      {[
                        "Writing Styles",
                        "Deterministic FOCUS SQL",
                        "Executive Summary",
                        "Anomaly Root-Cause",
                      ].map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => {
                            setWritingStyle(style);
                            setStyleDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                            writingStyle === style
                              ? "bg-blue-50 text-[#0062E0] font-bold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Controls: Citation Toggle Switch & Send Button */}
              <div className="flex items-center gap-3">
                {/* Citation Toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  {/* Purple Pill Toggle Switch matching Image 2 */}
                  <div
                    onClick={() => setCitationEnabled((p) => !p)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex items-center ${
                      citationEnabled ? "bg-[#7C3AED]" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                        citationEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    >
                      {citationEnabled && <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Citation</span>
                </label>

                {/* Dark Send Button with Up Arrow matching Image 2 */}
                <button
                  type="button"
                  onClick={() => handleAsk()}
                  disabled={!input.trim() || askCirra.isPending}
                  className="w-8 h-8 rounded-lg bg-[#0F172A] hover:bg-black disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                  title="Send request"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs font-semibold text-[#335372] mt-2 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
            Every number is sourced from your database — no hallucinated figures
          </p>
        </div>
      </div>
    </div>
  );
}
