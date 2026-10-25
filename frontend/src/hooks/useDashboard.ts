"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { DashboardSummary, Period } from "@/types";

export const emptyDashboardData: DashboardSummary = {
  total_spend_mtd: 0,
  forecasted_spend: 0,
  cloud_spend_mtd: 0,
  ai_spend_mtd: 0,
  anomalies_detected: 0,
  potential_savings_monthly: 0,
  active_connections: 0,
  monthly: [],
  topServices: [],
  topAiKeys: [],
  attributionCoverage: {
    percentage: 0,
    attributed: 0,
    unallocated: 0,
    resourcesCount: 0,
    totalResources: 0,
  },
};

export function useDashboard(period: Period = "30d") {
  const query = useQuery<DashboardSummary>({
    queryKey: ["dashboard", "summary", period],
    queryFn: async () => {
      try {
        const res = await apiFetch<DashboardSummary>(`/dashboard/summary?period=${period}`);
        if (res && typeof res.total_spend_mtd === "number") {
          return res;
        }
      } catch {
        // If backend API is not responding, fallback to authentic zero state
      }

      // Check if user has active connections saved locally
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("cirra_custom_dashboard_data");
          if (raw) {
            return JSON.parse(raw) as DashboardSummary;
          }
        } catch {
          // ignore
        }
      }

      return emptyDashboardData;
    },
    // No mock data initialData!
  });

  return {
    data: query.data ?? emptyDashboardData,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
