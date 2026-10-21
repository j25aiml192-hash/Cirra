"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, Terminal, CheckCircle2 } from "lucide-react";
import { useAsk } from "@/hooks/useAsk";

interface ChatEntry {
  question: string;
  answer: string;
  sql?: string;
  rows?: Array<Record<string, unknown>>;
  confidence?: number;
}

export default function AskPage() {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const { ask, isLoading } = useAsk();
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText ?? input).trim();
    if (!q || isLoading) return;

    setInput("");
    const res = await ask(q);
    setMessages((prev) => [
      ...prev,
      {
        question: q,
        answer: res.answer,
        sql: res.sql,
        rows: res.rows,
        confidence: res.confidence,
      },
    ]);
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
          {messages.map((entry, index) => (
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
                  className="space-y-3.5"
                >
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-[#EBF2FA]">
                    <div className="flex items-center gap-1.5 font-semibold text-[#334155]">
                      <Bot className="w-4 h-4 text-[#0062E0]" />
                      <span>Cirra Verified Response</span>
                    </div>
                    {entry.confidence && (
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {(entry.confidence * 100).toFixed(0)}% deterministic
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-[#0F1E36] leading-relaxed font-normal">
                    {entry.answer}
                  </p>

                  {entry.sql && (
                    <div className="rounded-xl bg-[#F8FAFD] border border-[#D6E4F5] p-3 text-xs text-[#334155] font-mono overflow-x-auto">
                      <div className="flex items-center gap-2 text-[#64748B] text-[11px] mb-1 font-sans">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Executed SQL against FOCUS ClickHouse</span>
                      </div>
                      <code>{entry.sql}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#D6E4F5] rounded-2xl px-4 py-3 text-xs text-[#475569] flex items-center gap-2 shadow-sm">
                <Sparkles className="w-4 h-4 text-[#0062E0] animate-spin" />
                <span>Synthesizing deterministic database query...</span>
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
            disabled={!input.trim() || isLoading}
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
