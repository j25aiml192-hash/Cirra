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
    <div className="max-w-3xl mx-auto px-4 pt-12 pb-24 flex flex-col min-h-[calc(100vh-80px)]">
      {messages.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center gap-4 text-center my-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#0062E0] flex items-center justify-center shadow-lg shadow-[#0062E0]/20">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#0A192F]">
            Ask anything about your spend
          </h2>
          <p className="text-[#475569] max-w-md text-sm">
            Cirra queries your live data — every number comes from the database, never guessed
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            {[
              "Why did OpenAI spend spike last week?",
              "Which team spent most on EC2 this month?",
              "What's our unallocated spend?",
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleAsk(q)}
                className="text-xs px-4 py-2 rounded-full border border-[#BCD9FC] bg-[#EBF3FE] text-[#0062E0] hover:bg-[#DCEBFC] transition-colors shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Response area */
        <div className="flex-1 space-y-6 overflow-y-auto pr-2 pb-6">
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
                {/* User question bubble */}
                <div className="flex justify-end">
                  <div
                    style={{
                      background: "#0062E0",
                      color: "white",
                      borderRadius: "16px 16px 4px 16px",
                      padding: "12px 18px",
                      fontSize: 14,
                      maxWidth: "80%",
                      boxShadow: "0 2px 10px rgba(0, 98, 224, 0.2)",
                    }}
                  >
                    {entry.question}
                  </div>
                </div>

                {/* AI answer bubble & query proof */}
                <div className="flex justify-start">
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #D6E4F5",
                      borderRadius: "16px 16px 16px 4px",
                      padding: "16px 20px",
                      maxWidth: "92%",
                      boxShadow: "0 4px 24px -4px rgba(12, 48, 96, 0.06)",
                    }}
                    className="space-y-3.5 w-full sm:w-auto"
                  >
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-[#EBF2FA] gap-4">
                      <div className="flex items-center gap-1.5 font-semibold text-[#334155]">
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

                    {/* Collapsible SQL code block */}
                    {sqlQuery && (
                      <details className="group rounded-xl bg-[#F8FAFD] border border-[#D6E4F5] p-3 text-xs text-[#334155] font-mono overflow-x-auto">
                        <summary className="flex items-center justify-between cursor-pointer list-none text-[#64748B] text-[11px] font-sans font-medium select-none">
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
                        <pre className="mt-2 text-xs font-mono text-[#334155] whitespace-pre-wrap break-all pt-2 border-t border-[#D6E4F5]/60">
                          <code>{sqlQuery}</code>
                        </pre>
                      </details>
                    )}

                    {/* Row results table if row_count > 0 */}
                    {rowCount > 0 && entry.rows && entry.rows.length > 0 && (
                      <div className="rounded-xl border border-[#D6E4F5] overflow-hidden mt-3">
                        <div className="overflow-x-auto max-h-60">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-[#F0F5FD] text-[#475569] border-b border-[#D6E4F5] sticky top-0">
                              <tr>
                                {columns.map((col, cIdx) => (
                                  <th
                                    key={cIdx}
                                    className="px-3 py-2 font-semibold whitespace-nowrap"
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
                          <div className="text-[11px] text-[#64748B] px-3 py-1.5 bg-[#F8FAFD] border-t border-[#D6E4F5] text-center">
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

          {/* Typing indicator (matching existing AiChatWidget loading state) */}
          {askCirra.isPending && (
            <div className="flex justify-start">
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #F1F5F9",
                  borderRadius: "16px 16px 16px 4px",
                  padding: "8px 14px",
                  fontSize: 12,
                  color: "#64748B",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <Bot className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                <span>Checking FOCUS query data...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>
      )}

      {/* Input bar */}
      <div className="w-full mt-auto relative pt-4">
        <div className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="Ask anything about your spend..."
            className="w-full h-14 pl-5 pr-16 rounded-full bg-white/90 backdrop-blur
                       border-2 border-[#D6E4F5] text-[#0A192F] text-sm sm:text-base shadow-sm
                       focus:outline-none focus:border-[#0062E0] focus:ring-4 focus:ring-[#0062E0]/10 transition-all"
          />
          <button
            type="button"
            onClick={() => handleAsk()}
            disabled={!input.trim() || askCirra.isPending}
            className="absolute right-2.5 w-10 h-10 rounded-full bg-[#0062E0] flex items-center justify-center hover:bg-[#0052C2] disabled:opacity-40 transition-colors shadow-md"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-center text-xs text-[#64748B] mt-2">
          Every number is sourced from your database — no hallucinated figures
        </p>
      </div>
    </div>
  );
}
