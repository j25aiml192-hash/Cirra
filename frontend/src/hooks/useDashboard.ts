"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardSummary } from "@/types";

const mockDashboardData: DashboardSummary = {
  total_spend_mtd: 128420.0,
  forecasted_spend: 156000.0,
  cloud_spend_mtd: 85530.0,
  ai_spend_mtd: 42890.0,
  anomalies_detected: 0,
  potential_savings_monthly: 34200.0,
  active_connections: 5,
  monthly: [
    { month: "May", aws: 48000, gcp: 24000, openai: 12000, anthropic: 6000 },
    { month: "Jun", aws: 51000, gcp: 25000, openai: 16500, anthropic: 8500 },
    { month: "Jul", aws: 49500, gcp: 27000, openai: 21000, anthropic: 11000 },
    { month: "Aug", aws: 53000, gcp: 29000, openai: 24500, anthropic: 14000 },
    { month: "Sep", aws: 52000, gcp: 28500, openai: 28000, anthropic: 16200 },
    { month: "Oct", aws: 54000, gcp: 31530, openai: 26100, anthropic: 16790 },
  ],
  topServices: [
    {
      name: "Amazon Elastic Compute Cloud (EC2)",
      provider: "AWS",
      spend: 34200,
      change: "+3.2%",
      changePositive: false,
      share: 26.6,
    },
    {
      name: "Google Kubernetes Engine (GKE)",
      provider: "GCP",
      spend: 21400,
      change: "-1.8%",
      changePositive: true,
      share: 16.7,
    },
    {
      name: "OpenAI GPT-4o API",
      provider: "OpenAI",
      spend: 18500,
      change: "+14.5%",
      changePositive: false,
      share: 14.4,
    },
    {
      name: "Amazon Simple Storage Service (S3)",
      provider: "AWS",
      spend: 12800,
      change: "+0.4%",
      changePositive: false,
      share: 9.9,
    },
    {
      name: "Anthropic Claude 3.5 Sonnet",
      provider: "Anthropic",
      spend: 11200,
      change: "+22.1%",
      changePositive: false,
      share: 8.7,
    },
  ],
  topAiKeys: [
    {
      keyName: "prod-copilot-svc",
      provider: "OpenAI",
      team: "Core Platform",
      spend: 14250,
      tokens: "1.12B tokens",
    },
    {
      keyName: "agentic-workflow-v2",
      provider: "Anthropic",
      team: "Autonomous Eng",
      spend: 9800,
      tokens: "640M tokens",
    },
    {
      keyName: "rag-embedding-pipeline",
      provider: "OpenAI",
      team: "Search & Retrieval",
      spend: 4250,
      tokens: "340M tokens",
    },
  ],
  attributionCoverage: {
    percentage: 84.2,
    attributed: 108100,
    unallocated: 20320,
    resourcesCount: 168,
    totalResources: 199,
  },
};

export function useDashboard() {
  const query = useQuery<DashboardSummary>({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      // In production calls apiFetch, returns mock data for local immediate rendering
      return mockDashboardData;
    },
    initialData: mockDashboardData,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
  };
}
