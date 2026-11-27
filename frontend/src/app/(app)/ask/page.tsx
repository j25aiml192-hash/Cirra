"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Bot, Terminal, Paperclip, ChevronDown, ArrowUp, TrendingUp, Server, Layers } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { ParticleTitle } from "@/components/ui/ParticleTitle";
import { CirraOrbitLogo } from "@/components/ui/CirraOrbitLogo";
import { AskCirraBackground } from "@/components/ask-cirra/AskCirraBackground";
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
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-between overflow-hidden select-none bg-[#030817] text-[#EBF4FF]">
      <Topbar />

      {/* =========================================================================
          DEEP SPACE AURORA CANVAS (EXCLUSIVE TO ASK CIRRA)
         ========================================================================= */}
      <AskCirraBackground />

      {/* =========================================================================
          MAIN INTERACTIVE CHAT CONTENT
         ========================================================= */}
      <div className="relative z-10 max-w-3xl w-full mx-auto px-4 pt-6 pb-12 flex flex-col flex-1">
        {messages.length === 0 ? (
          /* Empty State: Cirra Logo, Heading, & 3 Query Pills in 2 Rows */
          <div className="flex flex-col items-center gap-4 text-center my-auto py-8">
            {/* CIRRA ROTATING ORBIT & LOGO COMPOSITION */}
            <CirraOrbitLogo />

            {/* Main Animated Particle Heading (Entrance: 0ms) */}
            <div className="w-full flex justify-center cirra-entrance-heading">
              <ParticleTitle
                text="Ask anything about your spend"
                className="h-[76px] sm:h-[88px] max-w-2xl w-full"
              />
            </div>

            {/* Suggestion Pills in 2 Rows */}
            <div className="flex flex-col items-center gap-2.5 w-full mt-4">
              {/* Row 1: Two Pills */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAsk("Why did OpenAI spend spike last week?")}
                  className="cirra-entrance-q1 px-5 sm:px-6 py-2.5 rounded-full bg-[#0A1931]/90 border border-[#1856A8]/40 hover:border-[#68B7FF]/70 hover:bg-[#123B78]/60 text-[#A4C2E8] hover:text-[#EBF4FF] font-mono font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-98 shadow-[0_2px_14px_rgba(3,8,23,0.7)]"
                >
                  Why did OpenAI spend spike last week?
                </button>
                <button
                  type="button"
                  onClick={() => handleAsk("Which team spent most on EC2 this month?")}
                  className="cirra-entrance-q2 px-5 sm:px-6 py-2.5 rounded-full bg-[#0A1931]/90 border border-[#1856A8]/40 hover:border-[#68B7FF]/70 hover:bg-[#123B78]/60 text-[#A4C2E8] hover:text-[#EBF4FF] font-mono font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-98 shadow-[0_2px_14px_rgba(3,8,23,0.7)]"
                >
                  Which team spent most on EC2 this month?
                </button>
              </div>

              {/* Row 2: One Centered Pill */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleAsk("What's our unallocated spend?")}
                  className="cirra-entrance-q3 px-5 sm:px-6 py-2.5 rounded-full bg-[#0A1931]/90 border border-[#1856A8]/40 hover:border-[#68B7FF]/70 hover:bg-[#123B78]/60 text-[#A4C2E8] hover:text-[#EBF4FF] font-mono font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-98 shadow-[0_2px_14px_rgba(3,8,23,0.7)]"
                >
                  What&apos;s our unallocated spend?
                </button>
              </div>
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
                    <div className="bg-gradient-to-r from-[#123B78] to-[#1856A8] text-[#EBF4FF] border border-[#287FE8]/40 font-semibold rounded-[18px_18px_4px_18px] px-5 py-3 text-sm max-w-[80%] font-mono shadow-[0_4px_18px_rgba(24,86,168,0.35)]">
                      {entry.question}
                    </div>
                  </div>

                  {/* AI Answer Bubble & Verified Proof */}
                  <div className="flex justify-start">
                    <div className="bg-[#0A1931]/95 border border-[#1856A8]/45 rounded-[18px_18px_18px_4px] p-5 max-w-[92%] space-y-3.5 w-full sm:w-auto text-[#EBF4FF] shadow-[0_4px_28px_rgba(3,8,23,0.85)]">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-[#1856A8]/30 gap-4">
                        <div className="flex items-center gap-2 font-bold text-[#EBF4FF] font-mono">
                          <img src="/cirra-logo.png" alt="Cirra" className="w-4 h-4 object-contain rounded" />
                          <span>Cirra Verified Response</span>
                        </div>
                        {entry.execution_time_ms !== undefined && (
                          <span className="text-[#A4C2E8] font-mono text-[11px] whitespace-nowrap">
                            Query ran in {Math.round(entry.execution_time_ms)}ms
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-[#EBF4FF]/90 leading-relaxed font-normal font-sans">
                        {entry.answer}
                      </p>

                      {/* Collapsible SQL Code Block */}
                      {citationEnabled && sqlQuery && (
                        <details open className="group rounded-xl bg-[#030817]/90 border border-[#1856A8]/40 p-3 text-xs text-[#EBF4FF] font-mono overflow-x-auto shadow-inner">
                          <summary className="flex items-center justify-between cursor-pointer list-none text-[#A4C2E8] text-[11px] font-mono font-semibold select-none">
                            <div className="flex items-center gap-2">
                              <Terminal className="w-3.5 h-3.5 text-[#68B7FF]" />
                              <span>ClickHouse FOCUS SQL Citation</span>
                            </div>
                            <span className="text-[10px] text-[#A4C2E8] group-open:hidden">
                              Show SQL
                            </span>
                            <span className="text-[10px] text-[#A4C2E8] hidden group-open:inline">
                              Hide SQL
                            </span>
                          </summary>
                          <pre className="mt-2 text-xs font-mono text-[#EBF4FF]/90 whitespace-pre-wrap break-all pt-2 border-t border-[#1856A8]/30">
                            <code>{sqlQuery}</code>
                          </pre>
                        </details>
                      )}

                      {/* Row Results Table if row_count > 0 */}
                      {rowCount > 0 && entry.rows && entry.rows.length > 0 && (
                        <div className="rounded-xl border border-[#1856A8]/40 overflow-hidden mt-3">
                          <div className="overflow-x-auto max-h-60">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead className="bg-[#030817] text-[#68B7FF] border-b border-[#1856A8]/40 sticky top-0 font-mono">
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
                              <tbody className="divide-y divide-[#1856A8]/20 bg-[#0A1931]/80">
                                {entry.rows.slice(0, 15).map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-[#123B78]/35 transition-colors">
                                    {columns.map((col, cIdx) => {
                                      const cellVal = Array.isArray(row)
                                        ? row[cIdx]
                                        : (row as Record<string, unknown>)[col];
                                      return (
                                        <td
                                          key={cIdx}
                                          className="px-3 py-2 font-mono text-[#EBF4FF] whitespace-nowrap"
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
                            <div className="text-[11px] text-[#A4C2E8] px-3 py-1.5 bg-[#030817] border-t border-[#1856A8]/40 text-center font-mono">
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
                <div className="bg-[#0A1931] border border-[#1856A8]/40 rounded-[16px_16px_16px_4px] px-3.5 py-2 text-xs text-[#A4C2E8] font-mono flex items-center gap-2 shadow-[0_2px_12px_rgba(3,8,23,0.6)]">
                  <Bot className="w-3.5 h-3.5 text-[#68B7FF] animate-pulse" />
                  <span>Checking FOCUS query data...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}

        {/* =========================================================================
            PROMPT INPUT CARD (SPACIOUS TWO-SECTION COMPOSER)
           ========================================================================= */}
        <div className="w-full mt-auto relative pt-4">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Prompt Composer Card */}
          <div className="w-full rounded-[24px] bg-[#0A1931]/95 border border-[#1856A8]/45 px-5 py-4 sm:px-6 sm:py-5 transition-all focus-within:border-[#68B7FF]/75 focus-within:ring-2 focus-within:ring-[#287FE8]/20 shadow-[0_8px_32px_rgba(3,8,23,0.9),0_0_24px_rgba(18,59,120,0.25)] flex flex-col justify-between">
            {/* Attached file tag if any */}
            {attachedFile && (
              <div className="mb-3 flex items-center gap-2 px-3 py-1.5 bg-[#030817] border border-[#1856A8]/40 text-[#A4C2E8] text-xs rounded-xl w-max font-mono">
                <Paperclip className="w-3.5 h-3.5 text-[#68B7FF]" />
                <span className="truncate max-w-[240px]">{attachedFile}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-[#A4C2E8] hover:text-[#EBF4FF] ml-1.5 font-bold"
                >
                  ×
                </button>
              </div>
            )}

            {/* TOP SECTION — Spacious Textarea without decorative icons */}
            <div className="w-full min-h-[64px] sm:min-h-[72px]">
              <textarea
                ref={textareaRef}
                rows={2}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI a question or make a request..."
                className="w-full bg-transparent text-[#EBF4FF] placeholder:text-[#A4C2E8]/60 text-sm sm:text-[15px] resize-none outline-none border-none p-0 focus:ring-0 leading-relaxed font-normal min-h-[56px] max-h-[220px] font-sans"
              />
            </div>

            {/* BOTTOM SECTION — Toolbar with clean separation */}
            <div className="flex items-center justify-between mt-3 pt-3.5 border-t border-[#1856A8]/30 flex-wrap gap-2.5">
              {/* Left Side: Attach Button & Writing Styles Dropdown */}
              <div className="flex items-center gap-2.5">
                {/* Attach Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 px-3 rounded-lg border border-[#1856A8]/40 bg-[#030817]/90 hover:bg-[#123B78]/55 hover:border-[#68B7FF]/60 text-[#A4C2E8] hover:text-[#EBF4FF] flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer font-mono shadow-sm"
                  title="Attach file or logs"
                >
                  <Paperclip className="w-3.5 h-3.5 text-[#68B7FF]" />
                  <span>Attach</span>
                </button>

                {/* Writing Styles Dropdown */}
                <div className="relative" ref={styleMenuRef}>
                  <button
                    type="button"
                    onClick={() => setStyleDropdownOpen((prev) => !prev)}
                    className="h-8 px-3 rounded-lg border border-[#1856A8]/40 bg-[#030817]/90 hover:bg-[#123B78]/55 hover:border-[#68B7FF]/60 text-[#A4C2E8] hover:text-[#EBF4FF] flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer font-mono shadow-sm"
                  >
                    <span>{writingStyle}</span>
                    <ChevronDown className="w-3 h-3 text-[#68B7FF]" />
                  </button>

                  {/* Dropdown Menu */}
                  {styleDropdownOpen && (
                    <div className="absolute left-0 bottom-10 w-52 bg-[#0A1931] border border-[#1856A8]/60 rounded-xl shadow-[0_10px_32px_rgba(3,8,23,0.95),0_0_24px_rgba(24,86,168,0.3)] py-1 z-30 font-mono">
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
                              ? "bg-gradient-to-r from-[#123B78] to-[#1856A8] text-[#EBF4FF] font-bold"
                              : "text-[#A4C2E8] hover:bg-[#123B78]/45 hover:text-[#EBF4FF]"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Citation Toggle Switch & Send Button */}
              <div className="flex items-center gap-3">
                {/* Citation Toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setCitationEnabled((p) => !p)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex items-center ${
                      citationEnabled
                        ? "bg-gradient-to-r from-[#1856A8] to-[#287FE8] shadow-[0_0_12px_rgba(40,127,232,0.45)]"
                        : "bg-[#030817] border border-[#1856A8]/40"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                        citationEnabled ? "translate-x-4 bg-[#EBF4FF]" : "translate-x-0 bg-[#A4C2E8]"
                      }`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#A4C2E8] font-mono">Citation</span>
                </label>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleAsk()}
                  disabled={!input.trim() || askCirra.isPending}
                  className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#1856A8] via-[#287FE8] to-[#68B7FF] hover:brightness-110 disabled:opacity-40 text-[#030817] flex items-center justify-center transition-all cursor-pointer shadow-[0_0_18px_rgba(40,127,232,0.5)]"
                  title="Send request"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5] text-[#030817]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sequential Entrance Animations (Heading + 3 Questions) */}
      <style>{`
        @keyframes cirraStaggerFadeUp {
          0% {
            opacity: 0;
            transform: translateY(16px);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0px);
          }
        }
        .cirra-entrance-heading {
          opacity: 0;
          animation: cirraStaggerFadeUp 600ms cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards;
        }
        .cirra-entrance-q1 {
          opacity: 0;
          animation: cirraStaggerFadeUp 600ms cubic-bezier(0.16, 1, 0.3, 1) 700ms forwards;
        }
        .cirra-entrance-q2 {
          opacity: 0;
          animation: cirraStaggerFadeUp 600ms cubic-bezier(0.16, 1, 0.3, 1) 1100ms forwards;
        }
        .cirra-entrance-q3 {
          opacity: 0;
          animation: cirraStaggerFadeUp 600ms cubic-bezier(0.16, 1, 0.3, 1) 1500ms forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .cirra-entrance-heading,
          .cirra-entrance-q1,
          .cirra-entrance-q2,
          .cirra-entrance-q3 {
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
