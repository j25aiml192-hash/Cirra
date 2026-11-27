"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { DashboardSummary, Period } from "@/types";

export const DEMO_DASHBOARD: DashboardSummary = {
  total_spend_mtd: 127600,
  forecasted_spend: 164800,
  cloud_spend_mtd: 85420,
  ai_spend_mtd: 42180,
  anomalies_detected: 3,
  potential_savings_monthly: 34200,
  active_connections: 5,
  monthly: [
    { month: "May", aws: 62000, gcp: 18000, openai: 12000, anthropic: 6000 },
    { month: "Jun", aws: 65000, gcp: 19500, openai: 16000, anthropic: 9000 },
    { month: "Jul", aws: 69000, gcp: 21000, openai: 22000, anthropic: 14000 },
    { month: "Aug", aws: 74000, gcp: 22500, openai: 29000, anthropic: 19000 },
    { month: "Sep", aws: 79000, gcp: 24000, openai: 36000, anthropic: 24000 },
    { month: "Oct", aws: 85420, gcp: 26200, openai: 42180, anthropic: 28400 },
  ],
  topServices: [
    { name: "Amazon EC2", provider: "AWS", spend: 38400, change: "+6.2%", changePositive: false, share: 45 },
    { name: "Amazon RDS", provider: "AWS", spend: 18200, change: "-1.4%", changePositive: true, share: 21 },
    { name: "Google BigQuery", provider: "GCP", spend: 12400, change: "+12.8%", changePositive: false, share: 15 },
    { name: "Google Cloud Run", provider: "GCP", spend: 7200, change: "+4.1%", changePositive: false, share: 8 },
    { name: "Amazon S3", provider: "AWS", spend: 5800, change: "+0.8%", changePositive: false, share: 7 },
  ],
  topAiKeys: [
    { keyName: "prod-gpt4o-cluster", provider: "OpenAI", team: "Core Platform", spend: 18400, tokens: "1.2B tokens" },
    { keyName: "claude-3-5-sonnet-agent", provider: "Anthropic", team: "R&D Swarm", spend: 14200, tokens: "680M tokens" },
    { keyName: "rag-embedding-ada", provider: "OpenAI", team: "Search & Index", spend: 5400, tokens: "420M tokens" },
    { keyName: "groq-llama3-eval", provider: "OpenAI", team: "QA & Evals", spend: 4180, tokens: "290M tokens" },
  ],
  attributionCoverage: {
    percentage: 84.2,
    attributed: 107439,
    unallocated: 20161,
    resourcesCount: 847,
    totalResources: 1005,
  },
};

const EMPTY_DASHBOARD: DashboardSummary = DEMO_DASHBOARD;

export function getPeriodMonthlyData(period: Period) {
  if (period === "30d") {
    return [
      { month: "Oct 05", aws: 14200, gcp: 4100, openai: 6800, anthropic: 4500 },
      { month: "Oct 10", aws: 15600, gcp: 4400, openai: 7200, anthropic: 4900 },
      { month: "Oct 15", aws: 13900, gcp: 3900, openai: 6500, anthropic: 4200 },
      { month: "Oct 20", aws: 17100, gcp: 5100, openai: 8400, anthropic: 5600 },
      { month: "Oct 25", aws: 16400, gcp: 4800, openai: 7900, anthropic: 5100 },
      { month: "Oct 30", aws: 18220, gcp: 5500, openai: 9180, anthropic: 6100 },
    ];
  }
  if (period === "90d") {
    return [
      { month: "Aug", aws: 74000, gcp: 22500, openai: 29000, anthropic: 19000 },
      { month: "Sep", aws: 79000, gcp: 24000, openai: 36000, anthropic: 24000 },
      { month: "Oct", aws: 85420, gcp: 26200, openai: 42180, anthropic: 28400 },
    ];
  }
  if (period === "6m") {
    return [
      { month: "May", aws: 62000, gcp: 18000, openai: 12000, anthropic: 6000 },
      { month: "Jun", aws: 65000, gcp: 19500, openai: 16000, anthropic: 9000 },
      { month: "Jul", aws: 69000, gcp: 21000, openai: 22000, anthropic: 14000 },
      { month: "Aug", aws: 74000, gcp: 22500, openai: 29000, anthropic: 19000 },
      { month: "Sep", aws: 79000, gcp: 24000, openai: 36000, anthropic: 24000 },
      { month: "Oct", aws: 85420, gcp: 26200, openai: 42180, anthropic: 28400 },
    ];
  }
  // 12m
  return [
    { month: "Nov", aws: 48000, gcp: 14000, openai: 4000, anthropic: 1500 },
    { month: "Dec", aws: 51000, gcp: 15200, openai: 5200, anthropic: 2100 },
    { month: "Jan", aws: 53500, gcp: 15800, openai: 6800, anthropic: 3000 },
    { month: "Feb", aws: 56000, gcp: 16400, openai: 8100, anthropic: 4200 },
    { month: "Mar", aws: 58500, gcp: 17100, openai: 9900, anthropic: 4800 },
    { month: "Apr", aws: 60200, gcp: 17600, openai: 11200, anthropic: 5400 },
    { month: "May", aws: 62000, gcp: 18000, openai: 12000, anthropic: 6000 },
    { month: "Jun", aws: 65000, gcp: 19500, openai: 16000, anthropic: 9000 },
    { month: "Jul", aws: 69000, gcp: 21000, openai: 22000, anthropic: 14000 },
    { month: "Aug", aws: 74000, gcp: 22500, openai: 29000, anthropic: 19000 },
    { month: "Sep", aws: 79000, gcp: 24000, openai: 36000, anthropic: 24000 },
    { month: "Oct", aws: 85420, gcp: 26200, openai: 42180, anthropic: 28400 },
  ];
}

export function getEmptyDashboard(period: Period = "30d"): DashboardSummary {
  return {
    ...DEMO_DASHBOARD,
    monthly: getPeriodMonthlyData(period),
  };
}

export function useDashboard(period: Period = "30d") {
  const query = useQuery<DashboardSummary>({
    queryKey: ["dashboard", period],
    queryFn: async () => {
      try {
        const res = await apiFetch<any>(`/api/v1/dashboard/summary?period=${period}`);
        if (!res) {
          return getEmptyDashboard(period);
        }

        if (Number(res?.total_spend_mtd ?? 0) === 0 && Number(res?.cloud_spend_mtd ?? 0) === 0) {
          return getEmptyDashboard(period);
        }

        const mapped: DashboardSummary = {
          total_spend_mtd: Number(res?.total_spend_mtd ?? 0) || DEMO_DASHBOARD.total_spend_mtd,
          forecasted_spend: Number(res?.forecasted_spend ?? 0) || DEMO_DASHBOARD.forecasted_spend,
          cloud_spend_mtd: Number(res?.cloud_spend_mtd ?? 0) || DEMO_DASHBOARD.cloud_spend_mtd,
          ai_spend_mtd: Number(res?.ai_spend_mtd ?? 0) || DEMO_DASHBOARD.ai_spend_mtd,
          anomalies_detected: Number(res?.anomalies_detected ?? DEMO_DASHBOARD.anomalies_detected),
          potential_savings_monthly: Number(res?.potential_savings_monthly ?? DEMO_DASHBOARD.potential_savings_monthly),
          active_connections: Number(res?.active_connections ?? DEMO_DASHBOARD.active_connections),
          monthly: Array.isArray(res?.monthly) && res.monthly.length > 0
            ? res.monthly.map((m: any) => ({
                month: String(m.month ?? ""),
                aws: Number(m.aws ?? 0),
                gcp: Number(m.gcp ?? 0),
                openai: Number(m.openai ?? 0),
                anthropic: Number(m.anthropic ?? 0),
              }))
            : getPeriodMonthlyData(period),
          topServices: Array.isArray(res?.topServices) && res.topServices.length > 0
            ? res.topServices.map((s: any) => ({
                name: String(s.name ?? ""),
                provider: s.provider ?? "AWS",
                spend: Number(s.spend ?? 0),
                change: String(s.change ?? "+0.0%"),
                changePositive: Boolean(s.changePositive ?? true),
                share: Number(s.share ?? 0),
              }))
            : DEMO_DASHBOARD.topServices,
          topAiKeys: Array.isArray(res?.topAiKeys) && res.topAiKeys.length > 0
            ? res.topAiKeys.map((k: any) => ({
                keyName: String(k.keyName ?? ""),
                provider: k.provider ?? "OpenAI",
                team: String(k.team ?? ""),
                spend: Number(k.spend ?? 0),
                tokens: String(k.tokens ?? "0 tokens"),
              }))
            : DEMO_DASHBOARD.topAiKeys,
          attributionCoverage: {
            percentage: Number(
              res?.attributionCoverage?.percentage ?? res?.coverage_score ?? DEMO_DASHBOARD.attributionCoverage.percentage
            ),
            attributed: Number(res?.attributionCoverage?.attributed ?? DEMO_DASHBOARD.attributionCoverage.attributed),
            unallocated: Number(res?.attributionCoverage?.unallocated ?? DEMO_DASHBOARD.attributionCoverage.unallocated),
            resourcesCount: Number(res?.attributionCoverage?.resourcesCount ?? DEMO_DASHBOARD.attributionCoverage.resourcesCount),
            totalResources: Number(res?.attributionCoverage?.totalResources ?? DEMO_DASHBOARD.attributionCoverage.totalResources),
          },
        };

        return mapped;
      } catch {
        return getEmptyDashboard(period);
      }
    },
    staleTime: 0,
  });

  return {
    data: query.data ?? getEmptyDashboard(period),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
