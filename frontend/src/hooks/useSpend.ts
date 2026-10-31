"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  CloudSpendResponse,
  AiSpendResponse,
  SpendFilters,
  CloudSpendRecord,
  AiSpendRecord,
} from "@/types";
import { getDefaultStartDate } from "./useDashboard";

function useSafeSearchParams(): URLSearchParams {
  const [params, setParams] = useState<URLSearchParams>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setParams(new URLSearchParams(window.location.search));

      const handlePopState = () => {
        setParams(new URLSearchParams(window.location.search));
      };
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, []);

  return params;
}

function mapCloudSpend(res: Record<string, unknown> | null | undefined): CloudSpendResponse {
  const rowsRaw = Array.isArray(res?.rows)
    ? res.rows
    : Array.isArray(res?.items)
    ? res.items
    : [];

  const items: CloudSpendRecord[] = rowsRaw.map((r: Record<string, unknown>) => {
    const billedCost = Number(r.billed_cost ?? r.billedCost ?? 0);
    const effectiveCost = Number(r.effective_cost ?? r.effectiveCost ?? billedCost);
    const spend = effectiveCost || billedCost || Number(r.spend ?? 0);

    return {
      service: String(r.service_name || r.service || "Unknown"),
      provider: (String(r.provider || "AWS").toUpperCase() || "AWS") as any,
      region: String(r.region || "global"),
      attributed: r.allocation_method !== "unallocated" && Boolean(r.attributed ?? true),
      spend,
      priorPeriodSpend: Number(r.priorPeriodSpend ?? 0),
      change: String(r.change || "0%"),
      changePositive: Boolean(r.changePositive ?? true),
      impactPercent: Number(r.impactPercent ?? 0),
      team: r.team ? String(r.team) : undefined,
      billedCost,
      effectiveCost,
    };
  });

  const totalCost = Number(
    res?.totalCost ?? res?.total ?? items.reduce((acc, i) => acc + i.spend, 0)
  );

  const dailyVelocity = Array.isArray(res?.dailyVelocity)
    ? (res.dailyVelocity as Array<{ date: string; amount: number }>)
    : [];

  return {
    totalCost,
    items,
    dailyVelocity,
  };
}

function mapAiSpend(res: Record<string, unknown> | null | undefined): AiSpendResponse {
  const rowsRaw = Array.isArray(res?.rows)
    ? res.rows
    : Array.isArray(res?.items)
    ? res.items
    : [];

  const items: AiSpendRecord[] = rowsRaw.map((r: Record<string, unknown>) => ({
    model: String(r.model || "Unknown"),
    provider: (String(r.provider || "OpenAI") || "OpenAI") as any,
    apiKeyId: String(r.api_key_id || r.apiKeyId || ""),
    team: String(r.team || "Unallocated"),
    customer: r.customer ? String(r.customer) : undefined,
    inputTokens: Number(r.input_tokens ?? r.inputTokens ?? 0),
    outputTokens: Number(r.output_tokens ?? r.outputTokens ?? 0),
    costUsd: Number(r.cost_usd ?? r.costUsd ?? 0),
    cacheRate: String(r.cacheRate || "0%"),
  }));

  const totalCostUsd = Number(
    res?.totalCostUsd ?? res?.totalCost ?? items.reduce((acc, i) => acc + i.costUsd, 0)
  );

  const totalTokens = Number(
    res?.totalTokens ??
      Number(res?.totalInputTokens ?? 0) + Number(res?.totalOutputTokens ?? 0)
  );

  const cachedTokensPercent = Number(res?.cachedTokensPercent ?? 0);
  const modelCosts = Array.isArray(res?.modelCosts)
    ? (res.modelCosts as Array<{ model: string; cost: number; provider: string }>)
    : [];

  return {
    totalCostUsd,
    totalTokens,
    cachedTokensPercent,
    items,
    modelCosts,
  };
}

export function useCloudSpend(filters?: SpendFilters) {
  const searchParams = useSafeSearchParams();

  const provider = filters?.provider ?? searchParams.get("provider") ?? "";
  const service = searchParams.get("service") ?? "";
  const region = searchParams.get("region") ?? "";
  const team = filters?.team ?? searchParams.get("team") ?? "";
  const search = filters?.search ?? searchParams.get("search") ?? "";
  const startDate = searchParams.get("startDate") ?? getDefaultStartDate();
  const endDate = searchParams.get("endDate") ?? new Date().toISOString();
  const page = searchParams.get("page") ?? "1";
  const pageSize = searchParams.get("pageSize") ?? "50";

  const queryParams = new URLSearchParams();
  if (provider && provider !== "all") queryParams.set("provider", provider);
  if (service) queryParams.set("service", service);
  if (region) queryParams.set("region", region);
  if (team && team !== "all") queryParams.set("team", team);
  if (search) queryParams.set("search", search);
  queryParams.set("startDate", startDate);
  queryParams.set("endDate", endDate);
  queryParams.set("page", page);
  queryParams.set("pageSize", pageSize);

  const query = useQuery<CloudSpendResponse>({
    queryKey: [
      "spend",
      "cloud",
      provider,
      service,
      region,
      team,
      search,
      startDate,
      endDate,
      page,
      pageSize,
    ],
    queryFn: async () => {
      const res = await apiFetch<Record<string, unknown>>(
        `/api/spend/cloud?${queryParams.toString()}`
      );
      return mapCloudSpend(res);
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useAiSpend(filters?: SpendFilters) {
  const searchParams = useSafeSearchParams();

  const model = searchParams.get("model") ?? "";
  const apiKey = searchParams.get("apiKey") ?? "";
  const team = filters?.team ?? searchParams.get("team") ?? "";
  const startDate = searchParams.get("startDate") ?? getDefaultStartDate();
  const endDate = searchParams.get("endDate") ?? new Date().toISOString();

  const queryParams = new URLSearchParams();
  if (model) queryParams.set("model", model);
  if (apiKey) queryParams.set("apiKey", apiKey);
  if (team && team !== "all") queryParams.set("team", team);
  queryParams.set("startDate", startDate);
  queryParams.set("endDate", endDate);

  const query = useQuery<AiSpendResponse>({
    queryKey: ["spend", "ai", model, apiKey, team, startDate, endDate],
    queryFn: async () => {
      const res = await apiFetch<Record<string, unknown>>(
        `/api/spend/ai?${queryParams.toString()}`
      );
      return mapAiSpend(res);
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
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
  };
}
