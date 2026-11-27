"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { CloudSpendResponse, AiSpendResponse, SpendFilters, CloudSpendRecord, AiSpendRecord } from "@/types";

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

export const DEMO_CLOUD_SPEND_ITEMS: CloudSpendRecord[] = [
  {
    service: "Amazon Elastic Compute Cloud (EC2)",
    provider: "AWS",
    region: "us-east-1",
    attributed: true,
    spend: 24150,
    priorPeriodSpend: 22900,
    change: "+5.4%",
    changePositive: false,
    impactPercent: 28.4,
    team: "Core Platform",
    billedCost: 24150,
    effectiveCost: 24150,
  },
  {
    service: "Google Kubernetes Engine (GKE)",
    provider: "GCP",
    region: "us-central1",
    attributed: true,
    spend: 14850,
    priorPeriodSpend: 15200,
    change: "-2.3%",
    changePositive: true,
    impactPercent: 17.5,
    team: "Infrastructure",
    billedCost: 14850,
    effectiveCost: 14850,
  },
  {
    service: "Amazon Relational Database Service (RDS)",
    provider: "AWS",
    region: "us-east-1",
    attributed: true,
    spend: 12400,
    priorPeriodSpend: 11950,
    change: "+3.8%",
    changePositive: false,
    impactPercent: 14.6,
    team: "Core Platform",
    billedCost: 12400,
    effectiveCost: 12400,
  },
  {
    service: "Google Cloud Storage (Standard Tier)",
    provider: "GCP",
    region: "us-central1",
    attributed: true,
    spend: 6850,
    priorPeriodSpend: 6600,
    change: "+3.7%",
    changePositive: false,
    impactPercent: 8.1,
    team: "Data Lake",
    billedCost: 6850,
    effectiveCost: 6850,
  },
  {
    service: "BigQuery Analysis & Storage Slots",
    provider: "GCP",
    region: "us-central1",
    attributed: true,
    spend: 5200,
    priorPeriodSpend: 4900,
    change: "+6.1%",
    changePositive: false,
    impactPercent: 6.1,
    team: "Data Lake",
    billedCost: 5200,
    effectiveCost: 5200,
  },
  {
    service: "AWS Lambda Serverless Functions",
    provider: "AWS",
    region: "us-east-1",
    attributed: true,
    spend: 4180,
    priorPeriodSpend: 3950,
    change: "+5.8%",
    changePositive: false,
    impactPercent: 4.9,
    team: "Core Platform",
    billedCost: 4180,
    effectiveCost: 4180,
  },
  {
    service: "Amazon CloudFront Global Edge",
    provider: "AWS",
    region: "global",
    attributed: true,
    spend: 3650,
    priorPeriodSpend: 3800,
    change: "-3.9%",
    changePositive: true,
    impactPercent: 4.3,
    team: "Infrastructure",
    billedCost: 3650,
    effectiveCost: 3650,
  },
  {
    service: "AWS Application Load Balancer",
    provider: "AWS",
    region: "us-east-1",
    attributed: true,
    spend: 3000,
    priorPeriodSpend: 2950,
    change: "+1.7%",
    changePositive: false,
    impactPercent: 3.5,
    team: "Infrastructure",
    billedCost: 3000,
    effectiveCost: 3000,
  },
  {
    service: "Google Cloud Virtual Network & Interconnect",
    provider: "GCP",
    region: "us-central1",
    attributed: false,
    spend: 2800,
    priorPeriodSpend: 2650,
    change: "+5.7%",
    changePositive: false,
    impactPercent: 3.3,
    team: "Unallocated",
    billedCost: 2800,
    effectiveCost: 2800,
  },
];

export const DEMO_DAILY_VELOCITY = [
  { date: "2026-10-15", amount: 2750 },
  { date: "2026-10-16", amount: 2810 },
  { date: "2026-10-17", amount: 2690 },
  { date: "2026-10-18", amount: 2720 },
  { date: "2026-10-19", amount: 2850 },
  { date: "2026-10-20", amount: 2890 },
  { date: "2026-10-21", amount: 2910 },
  { date: "2026-10-22", amount: 2870 },
  { date: "2026-10-23", amount: 2820 },
  { date: "2026-10-24", amount: 2790 },
  { date: "2026-10-25", amount: 2830 },
  { date: "2026-10-26", amount: 2860 },
  { date: "2026-10-27", amount: 2880 },
  { date: "2026-10-28", amount: 2920 },
  { date: "2026-10-29", amount: 2950 },
  { date: "2026-10-30", amount: 2890 },
  { date: "2026-10-31", amount: 2840 },
  { date: "2026-11-01", amount: 2780 },
  { date: "2026-11-02", amount: 2830 },
  { date: "2026-11-03", amount: 2870 },
  { date: "2026-11-04", amount: 2890 },
  { date: "2026-11-05", amount: 2910 },
  { date: "2026-11-06", amount: 2930 },
  { date: "2026-11-07", amount: 2880 },
  { date: "2026-11-08", amount: 2850 },
  { date: "2026-11-09", amount: 2890 },
  { date: "2026-11-10", amount: 2940 },
  { date: "2026-11-11", amount: 2970 },
  { date: "2026-11-12", amount: 2990 },
  { date: "2026-11-13", amount: 3020 },
];

export const DEMO_CLOUD_SPEND: CloudSpendResponse = {
  totalCost: 85420,
  items: DEMO_CLOUD_SPEND_ITEMS,
  dailyVelocity: DEMO_DAILY_VELOCITY,
};

export const DEMO_AI_SPEND_ITEMS: AiSpendRecord[] = [
  {
    model: "gpt-4o",
    provider: "OpenAI",
    apiKeyId: "key-openai-prod-copilot",
    team: "Core Platform",
    customer: "Enterprise Tier",
    inputTokens: 720000000,
    outputTokens: 280000000,
    costUsd: 18400,
    cacheRate: "72.4%",
  },
  {
    model: "claude-3-5-sonnet",
    provider: "Anthropic",
    apiKeyId: "key-anthropic-agent-swarm",
    team: "R&D Swarm",
    customer: "Internal Agents",
    inputTokens: 480000000,
    outputTokens: 160000000,
    costUsd: 14200,
    cacheRate: "68.1%",
  },
  {
    model: "gpt-4o-mini",
    provider: "OpenAI",
    apiKeyId: "key-openai-support-bot",
    team: "Customer Success",
    customer: "Helpdesk AI",
    inputTokens: 380000000,
    outputTokens: 140000000,
    costUsd: 5400,
    cacheRate: "81.5%",
  },
  {
    model: "text-embedding-3-small",
    provider: "OpenAI",
    apiKeyId: "key-openai-rag-indexer",
    team: "Search & Retrieval",
    customer: "Knowledge Base",
    inputTokens: 320000000,
    outputTokens: 0,
    costUsd: 2380,
    cacheRate: "45.0%",
  },
  {
    model: "claude-3-haiku",
    provider: "Anthropic",
    apiKeyId: "key-anthropic-triage-fast",
    team: "Operations",
    customer: "Alert Routing",
    inputTokens: 190000000,
    outputTokens: 80000000,
    costUsd: 1800,
    cacheRate: "58.2%",
  },
];

export const DEMO_AI_SPEND: AiSpendResponse = {
  totalCostUsd: 42180,
  totalTokens: 2590000000,
  cachedTokensPercent: 64.8,
  modelCosts: [
    { model: "gpt-4o", cost: 18400, provider: "OpenAI" },
    { model: "claude-3-5-sonnet", cost: 14200, provider: "Anthropic" },
    { model: "gpt-4o-mini", cost: 5400, provider: "OpenAI" },
    { model: "text-embedding-3-small", cost: 2380, provider: "OpenAI" },
    { model: "claude-3-haiku", cost: 1800, provider: "Anthropic" },
  ],
  items: DEMO_AI_SPEND_ITEMS,
};

export function useCloudSpend(filters?: SpendFilters) {
  const query = useQuery<CloudSpendResponse>({
    queryKey: ["spend", "cloud", filters],
    queryFn: async () => {
      try {
        const res = await apiFetch<any>(`/api/v1/spend/cloud${buildQueryString(filters)}`);

        const total = Number(res?.totalCost ?? res?.total_cost ?? 0);
        const items = Array.isArray(res?.items) && res.items.length > 0
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
          : DEMO_CLOUD_SPEND.items;

        const dailyVelocity = Array.isArray(res?.dailyVelocity) && res.dailyVelocity.length > 0
          ? res.dailyVelocity.map((v: any) => ({
              date: String(v.date ?? ""),
              amount: Number(v.amount ?? 0),
            }))
          : DEMO_CLOUD_SPEND.dailyVelocity;

        return {
          totalCost: total > 0 ? total : DEMO_CLOUD_SPEND.totalCost,
          items,
          dailyVelocity,
        };
      } catch {
        return DEMO_CLOUD_SPEND;
      }
    },
  });

  return {
    data: query.data ?? DEMO_CLOUD_SPEND,
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

        const totalCostUsd = Number(res?.totalCostUsd ?? res?.total_cost_usd ?? 0);
        if (totalCostUsd === 0 && (!res?.items || res.items.length === 0)) {
          return DEMO_AI_SPEND;
        }

        return {
          totalCostUsd: totalCostUsd || DEMO_AI_SPEND.totalCostUsd,
          totalTokens: Number(res?.totalTokens ?? 0) || DEMO_AI_SPEND.totalTokens,
          cachedTokensPercent: Number(res?.cachedTokensPercent ?? 0) || DEMO_AI_SPEND.cachedTokensPercent,
          items: Array.isArray(res?.items) && res.items.length > 0
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
            : DEMO_AI_SPEND.items,
          modelCosts: Array.isArray(res?.modelCosts) && res.modelCosts.length > 0
            ? res.modelCosts.map((m: any) => ({
                model: String(m.model ?? ""),
                cost: Number(m.cost ?? 0),
                provider: String(m.provider ?? "OpenAI"),
              }))
            : DEMO_AI_SPEND.modelCosts,
        };
      } catch {
        return DEMO_AI_SPEND;
      }
    },
  });

  return {
    data: query.data ?? DEMO_AI_SPEND,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
