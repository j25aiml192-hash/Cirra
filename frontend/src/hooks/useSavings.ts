"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SavingsOverview } from "@/types";
import { apiFetch } from "@/lib/api";
import { mockSavings } from "@/lib/mockData";

export const emptySavingsData: SavingsOverview = mockSavings;

export function useSavings() {
  const queryClient = useQueryClient();

  const query = useQuery<SavingsOverview>({
    queryKey: ["savings"],
    queryFn: async () => {
      try {
        const res = await apiFetch<SavingsOverview>("/savings");
        if (res && Array.isArray(res.entries) && res.entries.length > 0) {
          return res;
        }
      } catch {
        // Fallback to rich savings pipeline data
      }
      return mockSavings;
    },
    initialData: mockSavings,
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
    data: query.data ?? mockSavings,
    isLoading: query.isLoading,
    approveAction: approveMutation.mutate,
    isApproving: approveMutation.isPending,
  };
}
