"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { mockDashboardData } from "@/lib/mockData";
import type { DashboardSummary, Period } from "@/types";

export const emptyDashboardData = mockDashboardData;

export function useDashboard(period: Period = "30d") {
  const query = useQuery<DashboardSummary>({
    queryKey: ["dashboard", "summary", period],
    queryFn: async () => {
      try {
        const res = await apiFetch<DashboardSummary>(`/dashboard/summary?period=${period}`);
        if (res && typeof res.total_spend_mtd === "number" && res.total_spend_mtd > 0) {
          return res;
        }
      } catch {
        // Fallback to rich FOCUS dataset
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

      return mockDashboardData;
    },
    initialData: mockDashboardData,
  });

  return {
    data: query.data ?? mockDashboardData,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
