"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { mockCloudSpend, mockAiSpend } from "@/lib/mockData";
import type { CloudSpendResponse, AiSpendResponse, SpendFilters } from "@/types";

export const emptyCloudSpend: CloudSpendResponse = mockCloudSpend;
export const emptyAiSpend: AiSpendResponse = mockAiSpend;

export function useSpend(filters?: SpendFilters) {
  const query = useQuery({
    queryKey: ["spend", filters],
    queryFn: async () => {
      try {
        const [cloud, ai] = await Promise.all([
          apiFetch<CloudSpendResponse>("/spend/cloud").catch(() => mockCloudSpend),
          apiFetch<AiSpendResponse>("/spend/ai").catch(() => mockAiSpend),
        ]);
        return {
          cloud: cloud && typeof cloud.totalCost === "number" && cloud.totalCost > 0 ? cloud : mockCloudSpend,
          ai: ai && typeof ai.totalCostUsd === "number" && ai.totalCostUsd > 0 ? ai : mockAiSpend,
        };
      } catch {
        return { cloud: mockCloudSpend, ai: mockAiSpend };
      }
    },
    initialData: { cloud: mockCloudSpend, ai: mockAiSpend },
  });

  return {
    data: query.data ?? { cloud: mockCloudSpend, ai: mockAiSpend },
    isLoading: query.isLoading,
  };
}

export function useCloudSpend() {
  const query = useQuery<CloudSpendResponse>({
    queryKey: ["spend", "cloud"],
    queryFn: async () => {
      try {
        const res = await apiFetch<CloudSpendResponse>("/spend/cloud");
        if (res && typeof res.totalCost === "number" && res.totalCost > 0) {
          return res;
        }
      } catch {
        // Fallback to rich FOCUS cloud dataset
      }
      return mockCloudSpend;
    },
    initialData: mockCloudSpend,
  });

  return {
    data: query.data ?? mockCloudSpend,
    isLoading: query.isLoading,
  };
}

export function useAiSpend() {
  const query = useQuery<AiSpendResponse>({
    queryKey: ["spend", "ai"],
    queryFn: async () => {
      try {
        const res = await apiFetch<AiSpendResponse>("/spend/ai");
        if (res && typeof res.totalCostUsd === "number" && res.totalCostUsd > 0) {
          return res;
        }
      } catch {
        // Fallback to rich AI models dataset
      }
      return mockAiSpend;
    },
    initialData: mockAiSpend,
  });

  return {
    data: query.data ?? mockAiSpend,
    isLoading: query.isLoading,
  };
}
