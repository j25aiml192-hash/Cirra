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

export const DEMO_ACTIONS: ActionItem[] = [
  {
    id: "act-01",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    anomaly_id: "anom-groq-01",
    type: "kill_switch",
    status: "proposed",
    provider: "Groq",
    target_key_id: "key-groq-prod-evals",
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    dry_run_result_json: {
      simulated_effect: "Instantly revokes Groq API key and throttles rate limit to 0 RPM to stop recursive retry loop",
      estimated_monthly_savings_usd: 8640,
      action_executable: true,
      target_resource: "key-groq-prod-evals (QA Automated Pipeline)",
      details: {
        current_rpm: 750,
        normal_rpm: 12,
        action_type: "emergency_api_key_revoke",
      },
    },
  },
  {
    id: "act-02",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    anomaly_id: "anom-openai-03",
    type: "github_pr",
    status: "approved",
    provider: "OpenAI",
    target_key_id: "prod-gpt4o-cluster",
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    approved_by: "Hiten Kumar",
    dry_run_result_json: {
      simulated_effect: "Injects static prefix prompt cache tags and removes dynamic timestamps in copilot request handler",
      estimated_monthly_savings_usd: 4800,
      action_executable: true,
      pr_title: "fix(ai): stabilize system prompt prefix to restore 70%+ prompt cache hit rate",
      pr_url: "https://github.com/cirra-cloud/copilot-service/pull/142",
      target_resource: "copilot-service/src/prompts/system.ts",
      details: {
        cache_hit_improvement: "+53%",
        tokens_saved_daily: "14.2M",
      },
    },
  },
  {
    id: "act-03",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    anomaly_id: "anom-ec2-02",
    type: "scheduled_shutdown",
    status: "executed",
    provider: "AWS",
    target_key_id: "asg-staging-cluster",
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    approved_by: "Alex Vance",
    dry_run_result_json: {
      simulated_effect: "Scheduled downscale of 8 staging EC2 instances every weekday at 8:00 PM UTC",
      estimated_monthly_savings_usd: 3200,
      action_executable: true,
      target_resource: "aws:autoscaling:us-east-1:staging-cluster",
      details: {
        instances_stopped: 8,
        monthly_uptime_reduction: "65%",
      },
    },
  },
  {
    id: "act-04",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    anomaly_id: "anom-bq-04",
    type: "spend_cap",
    status: "executed",
    provider: "GCP",
    target_key_id: "bq-analytics-slots",
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    approved_by: "Sarah Chen",
    dry_run_result_json: {
      simulated_effect: "Enforces 100 max slot reservation cap on unpartitioned BigQuery analytics queries",
      estimated_monthly_savings_usd: 4200,
      action_executable: true,
      target_resource: "gcp:bigquery:bi-analytics-project",
      details: {
        cap_limit: "100 slots",
        cost_savings_pct: "42%",
      },
    },
  },
];

export function useActions(statusFilter?: string) {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((s) => s.user?.tenantId);

  const query = useQuery<ActionItem[]>({
    queryKey: ["actions", statusFilter, tenantId],
    queryFn: async () => {
      try {
        const url = tenantId ? `/api/v1/actions?tenant_id=${tenantId}` : "/api/v1/actions";
        const res = await apiFetch<any>(url);
        let items: ActionItem[] = Array.isArray(res) ? res : res?.actions || res?.data || [];
        if (!items || items.length === 0) {
          items = DEMO_ACTIONS;
        }
        if (statusFilter && statusFilter !== "all") {
          return items.filter((a) => a.status?.toLowerCase() === statusFilter.toLowerCase());
        }
        return items;
      } catch {
        if (statusFilter && statusFilter !== "all") {
          return DEMO_ACTIONS.filter((a) => a.status?.toLowerCase() === statusFilter.toLowerCase());
        }
        return DEMO_ACTIONS;
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
        body: JSON.stringify({ rollback_reason: reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
    },
  });

  return {
    actions: query.data ?? DEMO_ACTIONS,
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
