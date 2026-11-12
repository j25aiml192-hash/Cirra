"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { CloudSpendResponse, AiSpendResponse, SpendFilters } from "@/types";

function buildQueryString(filters?: Record<string, any>): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(filters)) {
    if (val !== undefined && val !== null && val !== "" && val !== "all" && val !== "All") {
      params.set(key, String(val));
    }
  }
  const str = params.toString();
  return str ? `?${str}` : "";
}

export function useCloudSpend(filters?: SpendFilters) {
  const query = useQuery<CloudSpendResponse>({
    queryKey: ["spend", "cloud", filters],
    queryFn: async () => {
      const res = await apiFetch<any>(`/api/v1/spend/cloud${buildQueryString(filters)}`);

      return {
        totalCost: Number(res?.totalCost ?? res?.total_cost ?? 0),
        items: Array.isArray(res?.items)
          ? res.items.map((i: any) => ({
              service: String(i.service ?? ""),
              provider: i.provider ?? "AWS",
              region: String(i.region ?? ""),
              attributed: Boolean(i.attributed),
              spend: Number(i.spend ?? 0),
              priorPeriodSpend: Number(i.priorPeriodSpend ?? 0),
              change: String(i.change ?? "+0.0%"),
              changePositive: Boolean(i.changePositive ?? true),
              impactPercent: Number(i.impactPercent ?? 0),
              team: i.team ?? "Unallocated",
              billedCost: i.billedCost != null ? Number(i.billedCost) : undefined,
              effectiveCost: i.effectiveCost != null ? Number(i.effectiveCost) : undefined,
            }))
          : [],
        dailyVelocity: Array.isArray(res?.dailyVelocity)
          ? res.dailyVelocity.map((v: any) => ({
              date: String(v.date ?? ""),
              amount: Number(v.amount ?? 0),
            }))
          : [],
      };
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useAiSpend(filters?: SpendFilters) {
  const query = useQuery<AiSpendResponse>({
    queryKey: ["spend", "ai", filters],
    queryFn: async () => {
      const res = await apiFetch<any>(`/api/v1/spend/ai${buildQueryString(filters)}`);

      return {
        totalCostUsd: Number(res?.totalCostUsd ?? res?.total_cost_usd ?? 0),
        totalTokens: Number(res?.totalTokens ?? 0),
        cachedTokensPercent: Number(res?.cachedTokensPercent ?? 0),
        items: Array.isArray(res?.items)
          ? res.items.map((i: any) => ({
              model: String(i.model ?? ""),
              provider: i.provider ?? "OpenAI",
              apiKeyId: String(i.apiKeyId ?? ""),
              team: String(i.team ?? "Unallocated"),
              customer: i.customer ?? "Standard",
              inputTokens: Number(i.inputTokens ?? 0),
              outputTokens: Number(i.outputTokens ?? 0),
              costUsd: Number(i.costUsd ?? 0),
              cacheRate: String(i.cacheRate ?? "0%"),
            }))
          : [],
        modelCosts: Array.isArray(res?.modelCosts)
          ? res.modelCosts.map((mc: any) => ({
              model: String(mc.model ?? ""),
              cost: Number(mc.cost ?? 0),
              provider: String(mc.provider ?? ""),
            }))
          : [],
      };
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSpend(filters?: SpendFilters) {
  const cloud = useCloudSpend(filters);
  const ai = useAiSpend(filters);

  return {
    data: {
      cloud: cloud.data,
      ai: ai.data,
    },
    isLoading: cloud.isLoading || ai.isLoading,
    isError: cloud.isError || ai.isError,
    error: cloud.error || ai.error,
  };
}
