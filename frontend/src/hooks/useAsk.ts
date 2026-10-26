"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AskResponse } from "@/types";

export function useAsk() {
  const [isLoading, setIsLoading] = useState(false);

  const ask = async (question: string): Promise<AskResponse> => {
    setIsLoading(true);

    try {
      const res = await apiFetch<AskResponse>("/ask", {
        method: "POST",
        body: JSON.stringify({ question }),
      });
      if (res && res.answer) {
        return res;
      }
    } catch {
      // Backend not yet responding or no provider data configured
    } finally {
      setIsLoading(false);
    }

    return {
      answer:
        "No live provider telemetry found. Please connect your cloud or AI accounts in Settings > Connections to run deterministic queries against your real FOCUS billing data.",
      sql: "SELECT * FROM focus_billing WHERE tenant_id = 'current_tenant';",
      rows: [],
      confidence: 1.0,
    };
  };

  return {
    ask,
    isLoading,
  };
}
