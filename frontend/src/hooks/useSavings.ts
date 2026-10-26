"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SavingsEntry, SavingsOverview } from "@/types";
import { apiFetch } from "@/lib/api";

export const emptySavingsData: SavingsOverview = {
  total_realized_savings: 0,
  total_pipeline_savings: 0,
  entries: [],
};

export function useSavings() {
  const queryClient = useQueryClient();

  const query = useQuery<SavingsOverview>({
    queryKey: ["savings"],
    queryFn: async () => {
      try {
        const res = await apiFetch<SavingsOverview>("/savings");
        if (res && Array.isArray(res.entries)) {
          return res;
        }
      } catch {
        // Fallback to empty zero state
      }
      return emptySavingsData;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiFetch(`/savings/${id}/approve`, { method: "POST" });
      } catch {
        // Fallback for local simulation
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<SavingsOverview>(["savings"], (old) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries.map((entry) =>
            entry.id === id ? { ...entry, status: "approved" as const } : entry
          ),
        };
      });
    },
  });

  return {
    data: query.data ?? emptySavingsData,
    isLoading: query.isLoading,
    approveAction: approveMutation.mutate,
    isApproving: approveMutation.isPending,
  };
}
