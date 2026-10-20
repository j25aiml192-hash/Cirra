"use client";

import * as React from "react";
import { Sparkles, X, Send, Bot } from "lucide-react";

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

  React.useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, isThinking]);

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    const userText = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setIsThinking(true);

    setTimeout(() => {
      let aiReply = "Your current monthly spend velocity is within normal threshold at $128,420 across 5 active cloud/AI connections.";
      const lower = userText.toLowerCase();
      if (lower.includes("openai") || lower.includes("ai")) {
        aiReply = "OpenAI spend sits at $26,100 this month, dominated by GPT-4o on 'prod-copilot-svc' with a 52% cache hit rate.";
      } else if (lower.includes("saving") || lower.includes("cut")) {
        aiReply = "Cirra has identified $34,200 in monthly savings. The highest confidence action is downsizing 4 idle EC2 m6i instances.";
      } else if (lower.includes("ec2") || lower.includes("aws")) {
        aiReply = "AWS EC2 is currently $34,200/mo attributed to Core Platform, up +3.2% from the prior billing cycle.";
      }

      setMessages((prev) => [...prev, { role: "ai", text: aiReply }]);
      setIsThinking(false);
    }, 900);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI Assistant"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
          boxShadow: "0 4px 20px rgba(79, 70, 229, 0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          zIndex: 60,
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <Sparkles className="w-6 h-6 text-white" />
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
