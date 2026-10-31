"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { AskResponse } from "@/types";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  sql?: string;
  rows?: Array<Record<string, unknown>>;
  confidence?: number;
}

export function useSendMessage() {
  return useMutation<AskResponse, Error, { question: string }>({
    mutationFn: (data) =>
      apiFetch<AskResponse>("/api/ask", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useAsk() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const sendMessageMutation = useSendMessage();

  const ask = async (question: string): Promise<AskResponse> => {
    setMessages((prev) => [...prev, { role: "user", content: question }]);

    try {
      const res = await sendMessageMutation.mutateAsync({ question });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer,
          sql: res.sql,
          rows: res.rows,
          confidence: res.confidence,
        },
      ]);
      return res;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to query telemetry";
      const fallback: AskResponse = {
        answer: errorMessage,
        sql: "",
        rows: [],
        confidence: 0,
      };
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage,
        },
      ]);
      return fallback;
    }
  };

  return {
    ask,
    messages,
    isLoading: sendMessageMutation.isPending,
    isError: sendMessageMutation.isError,
    error: sendMessageMutation.error,
  };
}
