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
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Ask anything about your spend
          </h2>
          <p className="text-slate-500 max-w-md text-sm">
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
                className="text-xs px-4 py-2 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-sm"
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
                    background: "#4F46E5",
                    color: "white",
                    borderRadius: "16px 16px 4px 16px",
                    padding: "12px 18px",
                    fontSize: 14,
                    maxWidth: "80%",
                    boxShadow: "0 2px 10px rgba(79, 70, 229, 0.2)",
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
                    border: "1px solid #F1F5F9",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "16px 20px",
                    maxWidth: "92%",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                  }}
                  className="space-y-3.5"
                >
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Bot className="w-4 h-4 text-indigo-600" />
                      <span>Cirra Verified Response</span>
                    </div>
                    {entry.confidence && (
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {(entry.confidence * 100).toFixed(0)}% deterministic
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-800 leading-relaxed font-normal">
                    {entry.answer}
                  </p>

                  {entry.sql && (
                    <div className="rounded-xl bg-slate-900 p-3 text-xs text-indigo-200 font-mono overflow-x-auto shadow-inner">
                      <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-1 font-sans">
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
              <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 text-xs text-slate-500 flex items-center gap-2 shadow-sm">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
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
                       border-2 border-indigo-200 text-slate-900 text-sm sm:text-base shadow-sm
                       focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
          <button
            type="button"
            onClick={() => handleAsk()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-md"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          Every number is sourced from your database — no hallucinated figures
        </p>
      </div>
    </div>
  );
}
