"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Bot,
  Terminal,
  Paperclip,
  ChevronDown,
  ArrowUp,
  User,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { GlassFold } from "@/components/ui/glass-fold";
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

const SUGGESTED_QUERIES = [
  { label: "Why did OpenAI spend spike?", query: "Why did OpenAI spend spike last week?" },
  { label: "Top EC2 spend by team", query: "Which team spent most on EC2 this month?" },
  { label: "Unallocated cluster spend", query: "What is our unallocated spend across clusters?" },
];

export default function AskPage() {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [citationEnabled, setCitationEnabled] = useState(true);
  const [writingStyle, setWritingStyle] = useState("Writing Styles");
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [copiedSqlIdx, setCopiedSqlIdx] = useState<number | null>(null);

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

  const handleCopySql = (sql: string, idx: number) => {
    navigator.clipboard.writeText(sql);
    setCopiedSqlIdx(idx);
    setTimeout(() => setCopiedSqlIdx(null), 2000);
  };

  const renderComposer = (isCenter = false) => (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-black/50 backdrop-blur-2xl border border-white/20 p-4 sm:p-5 shadow-[0_16px_48px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col justify-between transition-all focus-within:border-[#96d7ff]/70 focus-within:shadow-[0_16px_48px_rgba(0,0,0,0.65),0_0_24px_rgba(30,60,200,0.35)] text-left">
      {/* Attached file tag if any */}
      {attachedFile && (
        <div className="mb-2.5 flex items-center gap-2 px-3 py-1.5 bg-white/[0.08] border border-white/15 text-zinc-300 text-xs rounded-xl w-max font-mono">
          <Paperclip className="w-3.5 h-3.5 text-[#96d7ff]" />
          <span className="truncate max-w-[240px]">{attachedFile}</span>
          <button
            type="button"
            onClick={() => setAttachedFile(null)}
            className="text-zinc-400 hover:text-white ml-1.5 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Input Textarea */}
      <div className="w-full min-h-[50px] sm:min-h-[58px]">
        <textarea
          ref={textareaRef}
          rows={2}
          value={input}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI a question or request cost analysis..."
          className="w-full bg-transparent text-white placeholder:text-zinc-400/70 text-xs sm:text-sm resize-none outline-none border-none p-0 focus:ring-0 leading-relaxed font-mono min-h-[46px] max-h-[180px]"
        />
      </div>

      {/* Bottom Toolbar */}
      <div className="flex items-center justify-between mt-2.5 pt-3 border-t border-white/10 flex-wrap gap-2.5">
        {/* Left Controls */}
        <div className="flex items-center gap-2">
          {/* Attach File */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 px-3 rounded-lg border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-mono font-medium transition-all cursor-pointer shadow-sm active:scale-95"
            title="Attach file or logs"
          >
            <Paperclip className="w-3.5 h-3.5 text-[#96d7ff]" />
            <span>Attach</span>
          </button>

          {/* Style Dropdown */}
          <div className="relative" ref={styleMenuRef}>
            <button
              type="button"
              onClick={() => setStyleDropdownOpen((prev) => !prev)}
              className="h-8 px-3 rounded-lg border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-mono font-medium transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <span>{writingStyle}</span>
              <ChevronDown className="w-3 h-3 text-[#96d7ff]" />
            </button>

            {styleDropdownOpen && (
              <div className="absolute left-0 bottom-10 w-52 bg-[#06081e]/95 backdrop-blur-2xl border border-white/20 rounded-xl shadow-2xl py-1 z-30 font-mono">
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
                        ? "bg-white/[0.15] text-white font-bold"
                        : "text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Citation Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setCitationEnabled((p) => !p)}
              className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex items-center ${
                citationEnabled
                  ? "bg-[#1e3cc8] shadow-[0_0_10px_rgba(30,60,200,0.5)]"
                  : "bg-white/10 border border-white/15"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                  citationEnabled ? "translate-x-3.5 bg-white" : "translate-x-0 bg-zinc-400"
                }`}
              />
            </div>
            <span className="text-xs font-mono font-medium text-zinc-300">Citation</span>
          </label>

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleAsk()}
            disabled={!input.trim() || askCirra.isPending}
            className="w-8 h-8 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-40 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
            title="Send query"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-between overflow-hidden select-none bg-black text-white">
      <Topbar />

      {/* ── 1. WEBGL GLASSFOLD SHADER BACKGROUND (EXTENDS BEHIND SIDEBAR & MORE AT LEFT, LESS AT RIGHT) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <GlassFold
          color1="#1e3cc8"
          color2="#06081e"
          color3="#96d7ff"
          speed={0.38}
          scale={1.3}
          noise={0.08}
          offsetX={-0.3}
          offsetY={0.2}
          className="w-full h-full object-cover"
        />
        {/* Horizontal gradient: dense & vibrant folds on the LEFT (behind sidebar), fading into velvet obsidian on the RIGHT */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/25 to-black/85 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ── 2. MAIN INTERACTIVE CHAT CONTENT (GOLDEN RATIO CENTERED IN EMPTY STATE) ── */}
      <div className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-4 pb-6 flex flex-col flex-1">
        {messages.length === 0 ? (
          /* Empty State: Golden Ratio Center Layout with Boxes, Pre-prompts first, then Typing section */
          <div className="flex flex-col items-center justify-center text-center my-auto w-full max-w-2xl mx-auto space-y-5 pt-4 pb-10">
            {/* Solid White Box behind Cirra Logo */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white shadow-[0_12px_32px_rgba(255,255,255,0.2),0_4px_16px_rgba(0,0,0,0.6)] flex items-center justify-center p-3 transition-transform hover:scale-105">
              <img
                src="/cirra-3d-logo.png"
                alt="Cirra"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Transparent White Box behind Ask Cirra & Written Portion */}
            <div className="rounded-2xl bg-white/[0.06] backdrop-blur-2xl border border-white/10 px-8 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] text-center space-y-1">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono drop-shadow-sm">
                Ask Cirra
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 font-mono">
                Deterministic SQL intelligence for cloud & AI cost control.
              </p>
            </div>

            {/* 3 Pre-Prompts in a Single Line BEFORE Typing Section (Clean Fit, No Ellipses) */}
            <div className="flex items-center justify-center gap-2.5 max-w-full w-full">
              {SUGGESTED_QUERIES.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAsk(item.query)}
                  className="flex-1 min-w-0 px-3.5 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl border border-white/15 hover:border-white/30 text-[11px] sm:text-xs font-mono text-zinc-200 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 text-center whitespace-nowrap overflow-hidden text-ellipsis"
                  title={item.query}
                >
                  <span className="block truncate">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Typing Section (Composer) Centered Below Pre-Prompts */}
            <div className="w-full pt-1">
              {renderComposer(true)}
            </div>
          </div>
        ) : (
          /* Active Chat Stream with Messages & Bottom Composer */
          <div className="flex flex-col flex-1 justify-between h-full">
            {/* Messages Scroll Area */}
            <div className="flex-1 space-y-6 overflow-y-auto pr-1 pb-6 max-h-[calc(100vh-240px)]">
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
                    {/* User Message Bubble */}
                    <div className="flex justify-end items-start gap-2.5">
                      <div className="bg-white/[0.14] backdrop-blur-2xl text-white border border-white/25 font-mono rounded-2xl rounded-tr-sm px-5 py-3 text-xs sm:text-sm max-w-[80%] shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)]">
                        {entry.question}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    {/* Cirra AI Response Card */}
                    <div className="flex justify-start items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1e3cc8]/70 backdrop-blur-md border border-[#96d7ff]/40 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <Bot className="w-4 h-4 text-[#96d7ff]" />
                      </div>

                      <div className="bg-black/50 backdrop-blur-2xl border border-white/15 rounded-2xl rounded-tl-sm p-5 max-w-[90%] space-y-4 w-full shadow-[0_12px_36px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] text-zinc-100">
                        {/* Response Header */}
                        <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10 gap-4">
                          <div className="flex items-center gap-2 font-bold text-white font-mono">
                            <CheckCircle2 className="w-4 h-4 text-[#96d7ff]" />
                            <span>Cirra Verified Response</span>
                          </div>
                          {entry.execution_time_ms !== undefined && (
                            <span className="text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                              Executed in {Math.round(entry.execution_time_ms)}ms
                            </span>
                          )}
                        </div>

                        {/* Answer Body */}
                        <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap">
                          {entry.answer}
                        </p>

                        {/* Collapsible SQL Citation */}
                        {citationEnabled && sqlQuery && (
                          <details open className="group rounded-xl bg-black/60 border border-white/10 p-3 text-xs font-mono overflow-x-auto shadow-inner">
                            <summary className="flex items-center justify-between cursor-pointer list-none text-zinc-300 text-[11px] font-mono font-semibold select-none">
                              <div className="flex items-center gap-2">
                                <Terminal className="w-3.5 h-3.5 text-[#96d7ff]" />
                                <span>ClickHouse FOCUS SQL Citation</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopySql(sqlQuery, index);
                                  }}
                                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                                >
                                  {copiedSqlIdx === index ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy SQL</span>
                                    </>
                                  )}
                                </button>
                                <span className="text-[10px] text-zinc-500 group-open:hidden">
                                  Show
                                </span>
                                <span className="text-[10px] text-zinc-500 hidden group-open:inline">
                                  Hide
                                </span>
                              </div>
                            </summary>
                            <pre className="mt-2.5 text-xs font-mono text-[#96d7ff] whitespace-pre-wrap break-all pt-2.5 border-t border-white/10">
                              <code>{sqlQuery}</code>
                            </pre>
                          </details>
                        )}

                        {/* Results Table if row_count > 0 */}
                        {rowCount > 0 && entry.rows && entry.rows.length > 0 && (
                          <div className="rounded-xl border border-white/10 overflow-hidden mt-3 bg-black/60">
                            <div className="overflow-x-auto max-h-60">
                              <table className="w-full text-xs text-left border-collapse font-mono">
                                <thead className="bg-white/[0.06] text-[#96d7ff] border-b border-white/10 sticky top-0">
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
                                <tbody className="divide-y divide-white/5">
                                  {entry.rows.slice(0, 15).map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-white/[0.04] transition-colors">
                                      {columns.map((col, cIdx) => {
                                        const cellVal = Array.isArray(row)
                                          ? row[cIdx]
                                          : (row as Record<string, unknown>)[col];
                                        return (
                                          <td
                                            key={cIdx}
                                            className="px-3 py-2 font-mono text-zinc-200 whitespace-nowrap"
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
                              <div className="text-[11px] text-zinc-400 px-3 py-1.5 bg-white/[0.03] border-t border-white/10 text-center font-mono">
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
                <div className="flex justify-start items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1e3cc8]/70 backdrop-blur-md border border-[#96d7ff]/40 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-[#96d7ff] animate-pulse" />
                  </div>
                  <div className="bg-black/50 backdrop-blur-xl border border-white/15 rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs text-zinc-300 font-mono flex items-center gap-2 shadow-lg">
                    <Loader2 className="w-3.5 h-3.5 text-[#96d7ff] animate-spin" />
                    <span>Querying ClickHouse FOCUS ledger...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Bottom Composer in Active Chat Mode (Spacious padding so it NEVER overlaps screen edge) */}
            <div className="w-full mt-auto relative pt-2 pb-6 sm:pb-8">
              {renderComposer(false)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}