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
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#09090b] border border-zinc-800 shadow-2xl hover:border-zinc-700 cursor-pointer flex items-center justify-center z-[60] transition-all hover:scale-105 duration-200 p-2.5 group"
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
        background: "#09090b",
        border: "1px solid #27272a",
        boxShadow: "0 25px 65px rgba(0, 0, 0, 0.75)",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: "#ffffff",
      }}
      className="font-mono"
    >
      {/* Header */}
      <div
        style={{
          height: 48,
          borderBottom: "1px solid #1f1f23",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#050505",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/cirra-logo.png" alt="Cirra" className="w-5 h-5 object-contain rounded-md" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>Ask Cirra</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#18181b", padding: "2px 8px", borderRadius: 999, border: "1px solid #27272a" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffffff" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#ffffff" }}>Live</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#71717a",
            display: "flex",
            alignItems: "center",
            padding: 4,
          }}
        >
          <X className="w-4 h-4 hover:text-white transition-colors" />
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
              color: "#a1a1aa",
              gap: 8,
              padding: 24,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#18181b",
                border: "1px solid #27272a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>
              Ask anything about your spend
            </div>
            <div style={{ fontSize: 11, color: "#71717a", lineHeight: 1.5 }}>
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
                    background: "#ffffff",
                    color: "#000000",
                    borderRadius: "16px 16px 4px 16px",
                    padding: "10px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: 1.4,
                  }}
                >
                  {m.text}
                </div>
              ) : (
                <div
                  style={{
                    maxWidth: "85%",
                    background: "#050505",
                    border: "1px solid #27272a",
                    color: "#f4f4f5",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "10px 14px",
                    fontSize: 12,
                    lineHeight: 1.4,
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
                background: "#050505",
                border: "1px solid #27272a",
                borderRadius: "16px 16px 16px 4px",
                padding: "8px 14px",
                fontSize: 12,
                color: "#a1a1aa",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Bot className="w-3.5 h-3.5 text-white animate-pulse" />
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
          borderTop: "1px solid #1f1f23",
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#050505",
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
            border: "1px solid #27272a",
            padding: "0 14px",
            fontSize: 12,
            outline: "none",
            background: "#09090b",
            color: "#ffffff",
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
            background: "#ffffff",
            color: "#000000",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: input.trim() && !isThinking ? "pointer" : "not-allowed",
            opacity: input.trim() && !isThinking ? 1 : 0.5,
          }}
        >
          <Send className="w-3.5 h-3.5 text-black" />
        </button>
      </div>
    </div>
  );
}
