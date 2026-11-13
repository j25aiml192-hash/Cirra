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

const EMPTY_CLOUD_SPEND: CloudSpendResponse = {
  totalCost: 0,
  items: [],
  dailyVelocity: [],
};

const EMPTY_AI_SPEND: AiSpendResponse = {
  totalCostUsd: 0,
  totalTokens: 0,
  cachedTokensPercent: 0,
  items: [],
  modelCosts: [],
};

export function useCloudSpend(filters?: SpendFilters) {
  const query = useQuery<CloudSpendResponse>({
    queryKey: ["spend", "cloud", filters],
    queryFn: async () => {
      try {
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
      } catch {
        return EMPTY_CLOUD_SPEND;
      }
    },
  });

  return {
    data: query.data ?? EMPTY_CLOUD_SPEND,
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
      try {
        const res = await apiFetch<any>(`/api/v1/spend/ai${buildQueryString(filters)}`);

        return {
          totalCostUsd: Number(res?.totalCostUsd ?? res?.total_cost_usd ?? 0),
          totalTokens: Number(res?.totalTokens ?? 0),
          cachedTokensPercent: Number(res?.cachedTokensPercent ?? 0),
          items: Array.isArray(res?.items)
            ? res.items.map((i: any) => ({
                model: String(i.model ?? ""),
                provider: i.provider ?? "OpenAI",
                apiKeyId: String(i.apiKeyId ?? i.api_key_id ?? ""),
                team: String(i.team ?? "Engineering"),
                customer: i.customer,
                inputTokens: Number(i.inputTokens ?? i.input_tokens ?? 0),
                outputTokens: Number(i.outputTokens ?? i.output_tokens ?? 0),
                costUsd: Number(i.costUsd ?? i.cost_usd ?? 0),
                cacheRate: String(i.cacheRate ?? i.cache_rate ?? "0%"),
              }))
            : [],
          modelCosts: Array.isArray(res?.modelCosts)
            ? res.modelCosts.map((m: any) => ({
                model: String(m.model ?? ""),
                cost: Number(m.cost ?? 0),
                provider: String(m.provider ?? "OpenAI"),
              }))
            : [],
        };
      } catch {
        return EMPTY_AI_SPEND;
      }
    },
  });

  return {
    data: query.data ?? EMPTY_AI_SPEND,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
