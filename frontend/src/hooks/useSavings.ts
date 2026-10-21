"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SavingsEntry, SavingsOverview } from "@/types";
import { apiFetch } from "@/lib/api";

const initialSavingsData: SavingsOverview = {
  total_realized_savings: 12600,
  total_pipeline_savings: 21600,
  entries: [
    {
      id: "sav-1",
      action_type: "EC2 Instance Downsizing (m6i.4xlarge → m6i.2xlarge)",
      method: "Right-sizing idle compute",
      baseline_cost: 8400,
      realized_cost: 4200,
      savings_amount: 4200,
      confidence_badge: "99% Confidence",
      status: "realized",
      date: "Oct 12, 2026",
    },
    {
      id: "sav-2",
      action_type: "OpenAI Prompt Cache Integration (Copilot v2)",
      method: "Prefix Caching Optimization",
      baseline_cost: 16500,
      realized_cost: 8100,
      savings_amount: 8400,
      confidence_badge: "95% Confidence",
      status: "realized",
      date: "Oct 15, 2026",
    },
    {
      id: "sav-3",
      action_type: "Idle RDS Multi-AZ Snapshot & Terminate",
      method: "Orphaned test database deletion",
      baseline_cost: 3800,
      realized_cost: 200,
      savings_amount: 3600,
      confidence_badge: "98% Confidence",
      status: "pending_approval",
      date: "Oct 19, 2026",
    },
    {
      id: "sav-4",
      action_type: "S3 Infrequent Access Lifecycle Policy",
      method: "Storage tiering automation",
      baseline_cost: 6500,
      realized_cost: 2300,
      savings_amount: 4200,
      confidence_badge: "92% Confidence",
      status: "approved",
      date: "Oct 20, 2026",
    },
    {
      id: "sav-5",
      action_type: "GKE Preemptible Node Pool Conversion",
      method: "Batch workload spot utilization",
      baseline_cost: 18000,
      realized_cost: 4200,
      savings_amount: 13800,
      confidence_badge: "90% Confidence",
      status: "identified",
      date: "Oct 20, 2026",
    },
  ],
};

export function useSavings() {
  const queryClient = useQueryClient();

  const query = useQuery<SavingsOverview>({
    queryKey: ["savings"],
    queryFn: async () => {
      try {
        const res = await apiFetch<SavingsOverview>("/savings");
        return res;
      } catch {
        return initialSavingsData;
      }
    },
    initialData: initialSavingsData,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiFetch(`/savings/${id}/approve`, { method: "POST" });
      } catch {
        // Fallback for local simulation
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<SavingsOverview>(["savings"], (old) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries.map((entry) =>
            entry.id === id ? { ...entry, status: "approved" as const } : entry
          ),
        };
      });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    approveAction: approveMutation.mutate,
    isApproving: approveMutation.isPending,
  };
}
