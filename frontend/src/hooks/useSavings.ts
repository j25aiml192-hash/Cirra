"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { SavingsOverview, SavingsEntry } from "@/types";

export function useSavings() {
  return useQuery<SavingsOverview | SavingsEntry[]>({
    queryKey: ["savings"],
    queryFn: () => apiFetch("/api/v1/savings"),
    staleTime: 60_000,
  });
}

export function useApproveAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (actionId: string) => {
      const user = useAuthStore.getState().user;
      const approvedBy = user?.id || "00000000-0000-0000-0000-000000000001";
      return apiFetch(`/api/v1/actions/${actionId}/approve`, {
        method: "POST",
        body: JSON.stringify({
          approved_by_user_id: approvedBy,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings"] });
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
    },
  });
}
