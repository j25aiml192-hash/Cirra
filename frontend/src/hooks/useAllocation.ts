"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { AllocationRule, AllocationCoverage } from "@/types";

export function useAllocationRules() {
  return useQuery<AllocationRule[]>({
    queryKey: ["allocation", "rules"],
    queryFn: async () => {
      const res = await apiFetch<AllocationRule[]>("/api/allocation/rules");
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name?: string;
      condition?: Record<string, unknown> | string;
      team?: string;
      priority?: number;
      match_type?: string;
      match_value?: string;
      assign_team?: string;
    }) =>
      apiFetch<AllocationRule>("/api/allocation/rules", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocation", "rules"] });
    },
  });
}

export const useAddAllocationRule = useCreateRule;

export function useUpdateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiFetch<AllocationRule>(`/api/allocation/rules/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocation", "rules"] });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/allocation/rules/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocation", "rules"] });
    },
  });
}

export function useAllocationCoverage() {
  return useQuery<AllocationCoverage>({
    queryKey: ["allocation", "coverage"],
    queryFn: async () => {
      const res = await apiFetch<Record<string, unknown>>("/api/allocation/coverage");
      return {
        totalSpend: Number(res?.totalSpend ?? 0),
        attributedSpend: Number(res?.attributedSpend ?? 0),
        unallocatedSpend: Number(res?.unallocatedSpend ?? 0),
        coveragePercentage: Number(res?.allocatedPct ?? res?.coveragePercentage ?? 100),
      };
    },
    staleTime: 60 * 1000,
  });
}

