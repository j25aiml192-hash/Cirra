"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { CloudSpendResponse, AiSpendResponse, SpendFilters } from "@/types";

export const emptyCloudSpend: CloudSpendResponse = {
  totalCost: 0,
  dailyVelocity: [],
  items: [],
};

export const emptyAiSpend: AiSpendResponse = {
  totalCostUsd: 0,
  totalTokens: 0,
  cachedTokensPercent: 0,
  modelCosts: [],
  items: [],
};

export function useSpend(filters?: SpendFilters) {
  const query = useQuery({
    queryKey: ["spend", filters],
    queryFn: async () => {
      try {
        const [cloud, ai] = await Promise.all([
          apiFetch<CloudSpendResponse>("/spend/cloud").catch(() => emptyCloudSpend),
          apiFetch<AiSpendResponse>("/spend/ai").catch(() => emptyAiSpend),
        ]);
        return {
          cloud: cloud && typeof cloud.totalCost === "number" ? cloud : emptyCloudSpend,
          ai: ai && typeof ai.totalCostUsd === "number" ? ai : emptyAiSpend,
        };
      } catch {
        return { cloud: emptyCloudSpend, ai: emptyAiSpend };
      }
    },
  });

  return {
    data: query.data ?? { cloud: emptyCloudSpend, ai: emptyAiSpend },
    isLoading: query.isLoading,
  };
}

export function useCloudSpend() {
  const query = useQuery<CloudSpendResponse>({
    queryKey: ["spend", "cloud"],
    queryFn: async () => {
      try {
        const res = await apiFetch<CloudSpendResponse>("/spend/cloud");
        if (res && typeof res.totalCost === "number") {
          return res;
        }
      } catch {
        // Fallback to empty zero state
      }
      return emptyCloudSpend;
    },
  });

  return {
    data: query.data ?? emptyCloudSpend,
    isLoading: query.isLoading,
  };
}

export function useAiSpend() {
  const query = useQuery<AiSpendResponse>({
    queryKey: ["spend", "ai"],
    queryFn: async () => {
      try {
        const res = await apiFetch<AiSpendResponse>("/spend/ai");
        if (res && typeof res.totalCostUsd === "number") {
          return res;
        }
      } catch {
        // Fallback to empty zero state
      }
      return emptyAiSpend;
    },
  });

  return {
    data: query.data ?? emptyAiSpend,
    isLoading: query.isLoading,
  };
}
