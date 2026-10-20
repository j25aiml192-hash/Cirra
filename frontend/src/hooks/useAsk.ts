import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { AskResponse } from "@/types/api";

export function useAsk() {
  return useMutation<AskResponse, Error, string>({
    mutationFn: (question: string) =>
      apiFetch<AskResponse>("/ask", {
        method: "POST",
        body: JSON.stringify({ question }),
      }),
  });
}
