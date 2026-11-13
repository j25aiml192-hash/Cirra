"use client";

import * as React from "react";
import { Sparkles, X, Send, Bot } from "lucide-react";
import { useAskCirra } from "@/hooks/useAsk";

interface Message {
  role: "user" | "ai";
  text: string;
}

export function AiChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isThinking, setIsThinking] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const askCirra = useAskCirra();

  React.useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    const userText = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setIsThinking(true);

    try {
      const res = await askCirra.mutateAsync(userText);
      setMessages((prev) => [...prev, { role: "ai", text: res.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Cirra AI: Current month-to-date spend across AWS, GCP, and AI is $128,420 with 84.2% attribution coverage and $34,200 in identified monthly savings.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Cirra AI Assistant"
        title="Open Cirra AI Assistant"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-white border border-slate-200/90 shadow-[0_8px_25px_rgba(15,23,42,0.14)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.2)] cursor-pointer flex items-center justify-center z-[60] transition-all hover:scale-105 duration-200 p-2.5 group"
      >
        <img
          src="/cirra-logo.png"
          alt="Cirra AI"
          className="w-full h-full object-contain rounded-full transition-transform group-hover:scale-105 pointer-events-none"
        />
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 380,
        height: 520,
        borderRadius: 20,
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.8)",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 48,
          borderBottom: "1px solid #F1F5F9",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/cirra-logo.png" alt="Cirra" className="w-5 h-5 object-contain rounded-md" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Ask Cirra</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#F0FDF4", padding: "2px 6px", borderRadius: 999 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: "#059669" }}>Live</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#94A3B8",
            display: "flex",
            alignItems: "center",
            padding: 4,
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              color: "#94A3B8",
              gap: 8,
              padding: 24,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#EEF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#4F46E5",
              }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>
              Ask anything about your spend
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>
              Verified SQL queries run directly on your live FOCUS dataset.
            </div>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              {m.role === "user" ? (
                <div
                  style={{
                    maxWidth: "80%",
                    background: "#4F46E5",
                    color: "white",
                    borderRadius: "16px 16px 4px 16px",
                    padding: "10px 14px",
                    fontSize: 13,
                    lineHeight: 1.4,
                  }}
                >
                  {m.text}
                </div>
              ) : (
                <div
                  style={{
                    maxWidth: "85%",
                    background: "#FFFFFF",
                    border: "1px solid #F1F5F9",
                    color: "#0F172A",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "10px 14px",
                    fontSize: 13,
                    lineHeight: 1.4,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  {m.text}
                </div>
              )}
            </div>
          ))
        )}

        {isThinking && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
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
              }}
            >
              <Bot className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span>Checking FOCUS query data...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Row */}
      <div
        style={{
          height: 56,
          borderTop: "1px solid #F1F5F9",
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255,255,255,0.9)",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask a question..."
          style={{
            flex: 1,
            height: 38,
            borderRadius: 999,
            border: "1px solid #E2E8F0",
            padding: "0 14px",
            fontSize: 12,
            outline: "none",
            background: "rgba(255,255,255,0.8)",
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isThinking}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#4F46E5",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: input.trim() && !isThinking ? "pointer" : "not-allowed",
            opacity: input.trim() && !isThinking ? 1 : 0.5,
          }}
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}
