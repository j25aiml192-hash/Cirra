"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { DashboardSummary, Period } from "@/types";

export function useDashboard(period: Period = "30d") {
  const query = useQuery<DashboardSummary>({
    queryKey: ["dashboard", period],
    queryFn: async () => {
      const res = await apiFetch<any>(`/api/v1/dashboard/summary?period=${period}`);

      const mapped: DashboardSummary = {
        total_spend_mtd: Number(res?.total_spend_mtd ?? 0),
        forecasted_spend: Number(res?.forecasted_spend ?? 0),
        cloud_spend_mtd: Number(res?.cloud_spend_mtd ?? 0),
        ai_spend_mtd: Number(res?.ai_spend_mtd ?? 0),
        anomalies_detected: Number(res?.anomalies_detected ?? 0),
        potential_savings_monthly: Number(res?.potential_savings_monthly ?? 0),
        active_connections: Number(res?.active_connections ?? 0),
        monthly: Array.isArray(res?.monthly)
          ? res.monthly.map((m: any) => ({
              month: String(m.month ?? ""),
              aws: Number(m.aws ?? 0),
              gcp: Number(m.gcp ?? 0),
              openai: Number(m.openai ?? 0),
              anthropic: Number(m.anthropic ?? 0),
            }))
          : [],
        topServices: Array.isArray(res?.topServices)
          ? res.topServices.map((s: any) => ({
              name: String(s.name ?? ""),
              provider: s.provider ?? "AWS",
              spend: Number(s.spend ?? 0),
              change: String(s.change ?? "+0.0%"),
              changePositive: Boolean(s.changePositive ?? true),
              share: Number(s.share ?? 0),
            }))
          : [],
        topAiKeys: Array.isArray(res?.topAiKeys)
          ? res.topAiKeys.map((k: any) => ({
              keyName: String(k.keyName ?? ""),
              provider: k.provider ?? "OpenAI",
              team: String(k.team ?? ""),
              spend: Number(k.spend ?? 0),
              tokens: String(k.tokens ?? "0 tokens"),
            }))
          : [],
        attributionCoverage: {
          percentage: Number(
            res?.attributionCoverage?.percentage ?? res?.coverage_score ?? 0
          ),
          attributed: Number(res?.attributionCoverage?.attributed ?? 0),
          unallocated: Number(res?.attributionCoverage?.unallocated ?? 0),
          resourcesCount: Number(res?.attributionCoverage?.resourcesCount ?? 0),
          totalResources: Number(res?.attributionCoverage?.totalResources ?? 0),
        },
      };

      return mapped;
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
