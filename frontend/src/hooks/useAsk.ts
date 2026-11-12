"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { AskResponse } from "@/types";

export function useAskCirra() {
  return useMutation<AskResponse, Error, string>({
    mutationFn: async (question: string) => {
      const { user } = useAuthStore.getState();
      return apiFetch<AskResponse>("/api/v1/ask", {
        method: "POST",
        body: JSON.stringify({
          question,
          tenant_id: user?.tenantId || "00000000-0000-0000-0000-000000000001",
          conversation_history: [],
        }),
      });
    },
  });
}
