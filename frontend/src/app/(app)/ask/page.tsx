"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Bot, Terminal, Paperclip, ChevronDown, ArrowUp, TrendingUp, Server, Layers } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
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
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-between overflow-hidden select-none bg-black text-white">
      <Topbar />

      {/* =========================================================================
          DARK RUNWAY EDITORIAL CANVAS
         ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(#1f1f23_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      {/* =========================================================================
          MAIN INTERACTIVE CHAT CONTENT
         ========================================================= */}
      <div className="relative z-10 max-w-3xl w-full mx-auto px-4 pt-6 pb-12 flex flex-col flex-1">
        {messages.length === 0 ? (
          /* Empty State: Cirra Logo, Heading, & 3 Query Pills in 2 Rows */
          <div className="flex flex-col items-center gap-4 text-center my-auto py-8">
            {/* CIRRA LOGO in squircle */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#09090b] border border-zinc-800 p-3 sm:p-3.5 flex items-center justify-center transition-transform hover:scale-105 duration-200">
              <img
                src="/cirra-logo.png"
                alt="Cirra Logo"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            {/* Main Heading */}
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
              Ask anything about your spend
            </h2>

            {/* Descriptive Subtitle */}
            <p className="text-zinc-400 font-medium text-sm sm:text-base max-w-md leading-relaxed font-sans">
              Cirra queries your live data — every number comes from the database, never guessed
            </p>

            {/* Suggestion Pills in 2 Rows */}
            <div className="flex flex-col items-center gap-2.5 w-full mt-4">
              {/* Row 1: Two Pills */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAsk("Why did OpenAI spend spike last week?")}
                  className="px-5 sm:px-6 py-2.5 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-mono font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-98"
                >
                  Why did OpenAI spend spike last week?
                </button>
                <button
                  type="button"
                  onClick={() => handleAsk("Which team spent most on EC2 this month?")}
                  className="px-5 sm:px-6 py-2.5 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-mono font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-98"
                >
                  Which team spent most on EC2 this month?
                </button>
              </div>

              {/* Row 2: One Centered Pill */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleAsk("What's our unallocated spend?")}
                  className="px-5 sm:px-6 py-2.5 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-mono font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-98"
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
                    <div className="bg-white text-black font-semibold rounded-[18px_18px_4px_18px] px-5 py-3 text-sm max-w-[80%] font-mono">
                      {entry.question}
                    </div>
                  </div>

                  {/* AI Answer Bubble & Verified Proof */}
                  <div className="flex justify-start">
                    <div className="bg-[#09090b] border border-zinc-800/80 rounded-[18px_18px_18px_4px] p-5 max-w-[92%] space-y-3.5 w-full sm:w-auto text-white">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/80 gap-4">
                        <div className="flex items-center gap-2 font-bold text-white font-mono">
                          <img src="/cirra-logo.png" alt="Cirra" className="w-4 h-4 object-contain rounded" />
                          <span>Cirra Verified Response</span>
                        </div>
                        {entry.execution_time_ms !== undefined && (
                          <span className="text-zinc-500 font-mono text-[11px] whitespace-nowrap">
                            Query ran in {Math.round(entry.execution_time_ms)}ms
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-zinc-200 leading-relaxed font-normal font-sans">
                        {entry.answer}
                      </p>

                      {/* Collapsible SQL Code Block */}
                      {citationEnabled && sqlQuery && (
                        <details open className="group rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-xs text-white font-mono overflow-x-auto">
                          <summary className="flex items-center justify-between cursor-pointer list-none text-zinc-400 text-[11px] font-mono font-semibold select-none">
                            <div className="flex items-center gap-2">
                              <Terminal className="w-3.5 h-3.5 text-white" />
                              <span>ClickHouse FOCUS SQL Citation</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 group-open:hidden">
                              Show SQL
                            </span>
                            <span className="text-[10px] text-zinc-400 hidden group-open:inline">
                              Hide SQL
                            </span>
                          </summary>
                          <pre className="mt-2 text-xs font-mono text-zinc-300 whitespace-pre-wrap break-all pt-2 border-t border-zinc-850">
                            <code>{sqlQuery}</code>
                          </pre>
                        </details>
                      )}

                      {/* Row Results Table if row_count > 0 */}
                      {rowCount > 0 && entry.rows && entry.rows.length > 0 && (
                        <div className="rounded-xl border border-zinc-800 overflow-hidden mt-3">
                          <div className="overflow-x-auto max-h-60">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 sticky top-0 font-mono">
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
                              <tbody className="divide-y divide-zinc-850 bg-[#09090b]">
                                {entry.rows.slice(0, 15).map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-zinc-900/50">
                                    {columns.map((col, cIdx) => {
                                      const cellVal = Array.isArray(row)
                                        ? row[cIdx]
                                        : (row as Record<string, unknown>)[col];
                                      return (
                                        <td
                                          key={cIdx}
                                          className="px-3 py-2 font-mono text-zinc-300 whitespace-nowrap"
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
                            <div className="text-[11px] text-zinc-500 px-3 py-1.5 bg-zinc-950 border-t border-zinc-800 text-center font-mono">
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
                <div className="bg-[#09090b] border border-zinc-800 rounded-[16px_16px_16px_4px] px-3.5 py-2 text-xs text-zinc-300 font-mono flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span>Checking FOCUS query data...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}

        {/* =========================================================================
            PROMPT INPUT CARD
           ========================================================================= */}
        <div className="w-full mt-auto relative pt-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Prompt Card */}
          <div className="w-full rounded-[22px] bg-[#09090b] border border-zinc-800/80 p-3.5 sm:p-4 transition-all focus-within:border-zinc-600">
            {/* Attached file tag if any */}
            {attachedFile && (
              <div className="mb-2 flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg w-max font-mono">
                <Paperclip className="w-3 h-3 text-zinc-400" />
                <span className="truncate max-w-[200px]">{attachedFile}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-zinc-500 hover:text-white ml-1 font-bold"
                >
                  ×
                </button>
              </div>
            )}

            {/* Top Text Input Row */}
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-zinc-400 mt-1 flex-shrink-0" />
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI a question or make a request..."
                className="w-full bg-transparent text-white placeholder:text-zinc-500 text-sm sm:text-[15px] resize-none outline-none border-none p-0 focus:ring-0 leading-relaxed font-normal min-h-[28px] max-h-[160px] font-sans"
              />
            </div>

            {/* Bottom Controls Toolbar */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-800/80 flex-wrap gap-2">
              {/* Left Buttons: Attach & Writing Styles */}
              <div className="flex items-center gap-2">
                {/* Attach Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer font-mono"
                  title="Attach file or logs"
                >
                  <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Attach</span>
                </button>

                {/* Writing Styles Dropdown */}
                <div className="relative" ref={styleMenuRef}>
                  <button
                    type="button"
                    onClick={() => setStyleDropdownOpen((prev) => !prev)}
                    className="h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer font-mono"
                  >
                    <span>{writingStyle}</span>
                    <ChevronDown className="w-3 h-3 text-zinc-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {styleDropdownOpen && (
                    <div className="absolute left-0 bottom-10 w-52 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl py-1 z-30 font-mono">
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
                              ? "bg-zinc-850 text-white font-bold"
                              : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
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
                  <div
                    onClick={() => setCitationEnabled((p) => !p)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex items-center ${
                      citationEnabled ? "bg-amber-400" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                        citationEnabled ? "translate-x-4 bg-black" : "translate-x-0 bg-zinc-400"
                      }`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-zinc-400 font-mono">Citation</span>
                </label>

                {/* Golden Send Button */}
                <button
                  type="button"
                  onClick={() => handleAsk()}
                  disabled={!input.trim() || askCirra.isPending}
                  className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 text-black flex items-center justify-center transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  title="Send request"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5] text-black" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs font-medium text-zinc-500 mt-2 font-mono">
            Every number is sourced from your database — no hallucinated figures
          </p>
        </div>
      </div>
    </div>
  );
}
