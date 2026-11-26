import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface ModelSwapRecommendation {
  current_provider: string;
  current_model: string;
  current_monthly_cost: number;
  recommended_provider: string;
  recommended_model: string;
  projected_monthly_cost: number;
  monthly_savings: number;
  savings_pct: number;
  quality_tier_change: "same" | "downgrade" | "upgrade";
  trade_off: string;
  confidence: "high" | "medium" | "low";
}

export interface ScalingRecommendation {
  provider: string;
  service: string;
  current_weekly_cost: number;
  avg_weekly_growth_pct: number;
  recommendation_type: string;
  recommendation: string;
  estimated_monthly_impact: number;
  priority: "high" | "medium" | "low";
}

export interface RecommendationsData {
  model_swaps: ModelSwapRecommendation[];
  scaling: ScalingRecommendation[];
  total_potential_monthly_savings: number;
  generated_at: string;
}

export interface RuleTemplate {
  name: string;
  description: string;
  condition_type: string;
  default_value: number | null;
  unit: string;
  scope: string;
}

export interface SmartRule {
  id: string;
  tenant_id: string;
  name: string;
  condition_type: string;
  threshold_value: number | null;
  unit: string | null;
  scope: string | null;
  is_active: boolean;
  last_evaluation_status: string | null;
  last_evaluation_message: string | null;
  last_evaluated_at: string | null;
  created_at: string | null;
}

export interface SmartRuleInput {
  name: string;
  condition_type: string;
  threshold_value?: number | null;
  unit?: string | null;
  scope?: string;
  is_active?: boolean;
}

export interface RuleEvaluation {
  rule_id: string | null;
  rule_name: string;
  condition: string;
  actual_value: any;
  threshold_value: any;
  triggered: boolean;
  action_recommended: string;
}

export function useRecommendations() {
  return useQuery<RecommendationsData>({
    queryKey: ["allocation", "recommendations"],
    queryFn: () => apiFetch<RecommendationsData>("/api/v1/beta/allocation/recommendations"),
    staleTime: 300_000,
  });
}

export function useSmartRules() {
  return useQuery<SmartRule[]>({
    queryKey: ["allocation", "smart-rules"],
    queryFn: () => apiFetch<SmartRule[]>("/api/v1/beta/allocation/smart-rules"),
  });
}

export function useRuleTemplates() {
  return useQuery<RuleTemplate[]>({
    queryKey: ["allocation", "rule-templates"],
    queryFn: () => apiFetch<RuleTemplate[]>("/api/v1/beta/allocation/rule-templates"),
  });
}

export function useCreateSmartRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rule: SmartRuleInput) =>
      apiFetch<SmartRule>("/api/v1/beta/allocation/smart-rules", {
        method: "POST",
        body: JSON.stringify(rule),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allocation", "smart-rules"] });
    },
  });
}

export function useEvaluateRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<RuleEvaluation[]>("/api/v1/beta/allocation/evaluate-rules", {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allocation", "smart-rules"] });
    },
  });
}

export function useToggleSmartRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiFetch<SmartRule>(`/api/v1/beta/allocation/smart-rules/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allocation", "smart-rules"] });
    },
  });
}

export function useDeleteSmartRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/v1/beta/allocation/smart-rules/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allocation", "smart-rules"] });
    },
  });
}

