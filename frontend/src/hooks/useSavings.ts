"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SavingsOverview } from "@/types";
import { apiFetch } from "@/lib/api";

const initialSavingsOverview: SavingsOverview = {
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
        const res = await apiFetch<SavingsOverview>("/api/savings");
        return res ?? initialSavingsOverview;
      } catch {
        return initialSavingsOverview;
      }
    },
    staleTime: 60 * 1000,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<{ success: boolean }>(`/api/savings/${id}/approve`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings"] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    approveAction: approveMutation.mutate,
    isApproving: approveMutation.isPending,
  };
}
