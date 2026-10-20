"use client";

import { useQuery } from "@tanstack/react-query";
import type { CloudSpendResponse, AiSpendResponse, SpendFilters } from "@/types";

const mockCloudSpend: CloudSpendResponse = {
  totalCost: 85530.0,
  dailyVelocity: [
    { date: "Oct 01", amount: 2840 },
    { date: "Oct 04", amount: 2910 },
    { date: "Oct 07", amount: 2780 },
    { date: "Oct 10", amount: 3050 },
    { date: "Oct 13", amount: 3120 },
    { date: "Oct 16", amount: 2980 },
    { date: "Oct 19", amount: 3040 },
    { date: "Oct 20", amount: 2890 },
  ],
  items: [
    {
      service: "Amazon Elastic Compute Cloud (EC2)",
      provider: "AWS",
      region: "us-east-1",
      attributed: true,
      spend: 34200.0,
      priorPeriodSpend: 33140.0,
      change: "+3.2%",
      changePositive: false,
      impactPercent: 40.0,
      team: "Core Platform",
    },
    {
      service: "Google Kubernetes Engine (GKE)",
      provider: "GCP",
      region: "us-central1",
      attributed: true,
      spend: 21400.0,
      priorPeriodSpend: 21800.0,
      change: "-1.8%",
      changePositive: true,
      impactPercent: 25.0,
      team: "Infrastructure",
    },
    {
      service: "Amazon Simple Storage Service (S3)",
      provider: "AWS",
      region: "us-west-2",
      attributed: true,
      spend: 12800.0,
      priorPeriodSpend: 12750.0,
      change: "+0.4%",
      changePositive: false,
      impactPercent: 15.0,
      team: "Data Lake",
    },
    {
      service: "Cloud SQL for PostgreSQL",
      provider: "GCP",
      region: "us-central1",
      attributed: true,
      spend: 9600.0,
      priorPeriodSpend: 9200.0,
      change: "+4.3%",
      changePositive: false,
      impactPercent: 11.2,
      team: "Core Platform",
    },
    {
      service: "AWS NAT Gateway Egress",
      provider: "AWS",
      region: "us-east-1",
      attributed: false,
      spend: 7530.0,
      priorPeriodSpend: 4900.0,
      change: "+53.6%",
      changePositive: false,
      impactPercent: 8.8,
      team: "Unallocated",
    },
  ],
};

const mockAiSpend: AiSpendResponse = {
  totalCostUsd: 42890.0,
  totalTokens: 2100000000,
  cachedTokensPercent: 46.2,
  modelCosts: [
    { model: "gpt-4o", cost: 18500, provider: "OpenAI" },
    { model: "claude-3-5-sonnet", cost: 14200, provider: "Anthropic" },
    { model: "text-embedding-3-small", cost: 4890, provider: "OpenAI" },
    { model: "claude-3-haiku", cost: 3500, provider: "Anthropic" },
    { model: "gpt-4o-mini", cost: 1800, provider: "OpenAI" },
  ],
  items: [
    {
      model: "gpt-4o",
      provider: "OpenAI",
      apiKeyId: "sk-proj-...8a91",
      team: "Copilot Eng",
      customer: "Enterprise Tier",
      inputTokens: 680000000,
      outputTokens: 145000000,
      costUsd: 18500.0,
      cacheRate: "52%",
    },
    {
      model: "claude-3-5-sonnet",
      provider: "Anthropic",
      apiKeyId: "sk-ant-...42c0",
      team: "Agent Systems",
      customer: "Growth Tier",
      inputTokens: 520000000,
      outputTokens: 110000000,
      costUsd: 14200.0,
      cacheRate: "44%",
    },
    {
      model: "text-embedding-3-small",
      provider: "OpenAI",
      apiKeyId: "sk-proj-...11b7",
      team: "Search Team",
      customer: "Internal",
      inputTokens: 410000000,
      outputTokens: 0,
      costUsd: 4890.0,
      cacheRate: "78%",
    },
    {
      model: "claude-3-haiku",
      provider: "Anthropic",
      apiKeyId: "sk-ant-...99aa",
      team: "Triage Bot",
      customer: "Free Tier",
      inputTokens: 280000000,
      outputTokens: 55000000,
      costUsd: 3500.0,
      cacheRate: "35%",
    },
  ],
};

export function useSpend(filters?: SpendFilters) {
  const query = useQuery({
    queryKey: ["spend", filters],
    queryFn: async () => ({
      cloud: mockCloudSpend,
      ai: mockAiSpend,
    }),
    initialData: {
      cloud: mockCloudSpend,
      ai: mockAiSpend,
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
  };
}

export function useCloudSpend() {
  const query = useQuery<CloudSpendResponse>({
    queryKey: ["spend", "cloud"],
    queryFn: async () => mockCloudSpend,
    initialData: mockCloudSpend,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
  };
}

export function useAiSpend() {
  const query = useQuery<AiSpendResponse>({
    queryKey: ["spend", "ai"],
    queryFn: async () => mockAiSpend,
    initialData: mockAiSpend,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
  };
}
