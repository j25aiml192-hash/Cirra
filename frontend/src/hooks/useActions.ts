"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export interface DryRunResult {
  simulated_effect?: string;
  estimated_monthly_savings_usd?: number;
  action_executable?: boolean;
  pr_title?: string;
  pr_url?: string;
  target_resource?: string;
  details?: Record<string, any>;
}

export interface ActionItem {
  id: string;
  tenant_id: string;
  anomaly_id?: string;
  type: "kill_switch" | "github_pr" | "spend_cap" | "scheduled_shutdown" | string;
  status: "proposed" | "dry_run" | "approved" | "executed" | "rolled_back" | "failed" | string;
  provider?: string;
  target_key_id?: string;
  dry_run_result_json?: DryRunResult | string;
  approved_by?: string;
  created_at?: string;
  updated_at?: string;
  audit_log?: any[];
}

export function useActions(statusFilter?: string) {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((s) => s.user?.tenantId);

  const query = useQuery<ActionItem[]>({
    queryKey: ["actions", statusFilter, tenantId],
    queryFn: async () => {
      try {
        const url = tenantId ? `/api/v1/actions?tenant_id=${tenantId}` : "/api/v1/actions";
        const res = await apiFetch<any>(url);
        const items: ActionItem[] = Array.isArray(res) ? res : res?.actions || res?.data || [];
        if (statusFilter && statusFilter !== "all") {
          return items.filter((a) => a.status?.toLowerCase() === statusFilter.toLowerCase());
        }
        return items;
      } catch {
        return [];
      }
    },
    refetchInterval: 15000,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ actionId, userId }: { actionId: string; userId?: string }) => {
      return apiFetch<any>(`/api/v1/actions/${actionId}/approve`, {
        method: "POST",
        body: JSON.stringify({ approved_by_user_id: userId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
      queryClient.invalidateQueries({ queryKey: ["savings"] });
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: async ({ actionId, reason }: { actionId: string; reason?: string }) => {
      return apiFetch<any>(`/api/v1/actions/${actionId}/rollback`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || "Manual rollback requested by operator" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
    },
  });

  const rawActions = query.data || [];
  const filteredActions = statusFilter && statusFilter !== "all"
    ? rawActions.filter((a) => a.status?.toLowerCase() === statusFilter.toLowerCase())
    : rawActions;

  return {
    actions: filteredActions,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    approveAction: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    rollbackAction: rollbackMutation.mutateAsync,
    isRollingBack: rollbackMutation.isPending,
  };
}
