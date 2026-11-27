"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { SavingsOverview, SavingsEntry } from "@/types";

export const DEMO_SAVINGS_ENTRIES: SavingsEntry[] = [
  {
    id: "sav-01",
    action_type: "Rightsizing m6i.4xlarge → m6i.xlarge",
    method: "AI Rightsizing Engine",
    baseline_cost: 1140,
    realized_cost: 285,
    savings_amount: 855,
    confidence_badge: "High (99%)",
    status: "verified",
    date: "2026-11-12",
  },
  {
    id: "sav-02",
    action_type: "Prompt Caching Optimization (System Prefix)",
    method: "Prompt Cache Enforcer",
    baseline_cost: 4800,
    realized_cost: 1440,
    savings_amount: 3360,
    confidence_badge: "High (95%)",
    status: "realized",
    date: "2026-11-10",
  },
  {
    id: "sav-03",
    action_type: "Auto-Terminated 6 Idle Development Sandboxes",
    method: "Scheduled Shutdown",
    baseline_cost: 2400,
    realized_cost: 0,
    savings_amount: 2400,
    confidence_badge: "High (98%)",
    status: "verified",
    date: "2026-11-08",
  },
  {
    id: "sav-04",
    action_type: "BigQuery Unpartitioned Query Slot Cap",
    method: "Spend Cap Guardrail",
    baseline_cost: 5800,
    realized_cost: 1600,
    savings_amount: 4200,
    confidence_badge: "High (92%)",
    status: "approved",
    date: "2026-11-13",
  },
  {
    id: "sav-05",
    action_type: "Automated AWS Savings Plan 1-Yr Commitment",
    method: "Commitment Advisor",
    baseline_cost: 38400,
    realized_cost: 26880,
    savings_amount: 11520,
    confidence_badge: "High (99%)",
    status: "approved",
    date: "2026-11-14",
  },
  {
    id: "sav-06",
    action_type: "Orphan EBS Volume Clean-Up (18 unattached volumes)",
    method: "Storage Optimizer",
    baseline_cost: 1850,
    realized_cost: 0,
    savings_amount: 1850,
    confidence_badge: "Medium (88%)",
    status: "identified",
    date: "2026-11-14",
  },
  {
    id: "sav-07",
    action_type: "Model Cascade: Route Classification to Haiku",
    method: "Model Router",
    baseline_cost: 6200,
    realized_cost: 1800,
    savings_amount: 4400,
    confidence_badge: "High (94%)",
    status: "identified",
    date: "2026-11-14",
  },
  {
    id: "sav-08",
    action_type: "Downscale Staging Kubernetes Node Pool off-hours",
    method: "Cron Scaling",
    baseline_cost: 3200,
    realized_cost: 960,
    savings_amount: 2240,
    confidence_badge: "High (96%)",
    status: "identified",
    date: "2026-11-14",
  },
];

export const DEMO_SAVINGS_OVERVIEW: SavingsOverview = {
  total_realized_savings: 18450,
  total_pipeline_savings: 34200,
  entries: DEMO_SAVINGS_ENTRIES,
};

export function useSavings() {
  return useQuery<SavingsOverview>({
    queryKey: ["savings"],
    queryFn: async () => {
      try {
        const res = await apiFetch<any>("/api/v1/savings");
        if (!res) return DEMO_SAVINGS_OVERVIEW;
        if (Array.isArray(res) && res.length > 0) {
          return {
            total_realized_savings: res.filter((e) => e.status === "verified" || e.status === "realized").reduce((sum, e) => sum + (Number(e.savings_amount) || 0), 0),
            total_pipeline_savings: res.filter((e) => e.status !== "verified" && e.status !== "realized").reduce((sum, e) => sum + (Number(e.savings_amount) || 0), 0),
            entries: res,
          };
        }
        if (Array.isArray(res?.entries) && res.entries.length > 0) {
          return res;
        }
        return DEMO_SAVINGS_OVERVIEW;
      } catch {
        return DEMO_SAVINGS_OVERVIEW;
      }
    },
    staleTime: 60_000,
  });
}

export function useApproveAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (actionId: string) => {
      const user = useAuthStore.getState().user;
      const approvedBy = user?.id || "00000000-0000-0000-0000-000000000002";
      return apiFetch(`/api/v1/actions/${actionId}/approve`, {
        method: "POST",
        body: JSON.stringify({
          approved_by_user_id: approvedBy,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings"] });
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
    },
  });
}
