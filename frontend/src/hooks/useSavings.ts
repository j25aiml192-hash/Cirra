"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { SavingsOverview } from "@/types";

const EMPTY_SAVINGS: SavingsOverview = {
  total_realized_savings: 0,
  total_pipeline_savings: 0,
  entries: [],
};

export function useSavings() {
  return useQuery<SavingsOverview>({
    queryKey: ["savings"],
    queryFn: async () => {
      try {
        const res = await apiFetch<any>("/api/v1/savings");
        if (!res) return EMPTY_SAVINGS;
        if (Array.isArray(res)) {
          return {
            total_realized_savings: res.filter((e) => e.status === "verified" || e.status === "realized").reduce((sum, e) => sum + (Number(e.savings_amount) || 0), 0),
            total_pipeline_savings: res.filter((e) => e.status !== "verified" && e.status !== "realized").reduce((sum, e) => sum + (Number(e.savings_amount) || 0), 0),
            entries: res,
          };
        }
        if (Array.isArray(res?.entries)) {
          return res;
        }
        return EMPTY_SAVINGS;
      } catch {
        return EMPTY_SAVINGS;
      }
    },
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
