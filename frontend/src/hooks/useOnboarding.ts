"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface OnboardingState {
  id: string;
  tenant_id: string;
  current_step: number;
  completed_steps: number[];
  company_name?: string;
  company_size?: string;
  primary_use_case?: string;
  step1_completed: boolean;
  step2_completed: boolean;
  step3_completed: boolean;
  step4_completed: boolean;
  wizard_completed: boolean;
}

export interface Step1Payload {
  company_name: string;
  company_size: "startup" | "smb" | "enterprise" | string;
  primary_use_case: "cost_control" | "security" | "both" | string;
}

export interface ConnectionInput {
  provider: string;
  api_key: string;
  label?: string;
}

export interface Step2Payload {
  connections: ConnectionInput[];
}

export interface Step3Payload {
  alert_phone: string;
  slack_webhook?: string;
  ntfy_topic?: string;
  spend_cap_usd?: number;
  quiet_hours_start?: number;
  quiet_hours_end?: number;
}

export interface Step4Check {
  target: string;
  provider?: string;
  status: "ok" | "failed" | "skipped" | string;
  message?: string;
  critical?: boolean;
}

export interface Step4VerifyResult {
  checks: Step4Check[];
  all_critical_passed: boolean;
  can_proceed: boolean;
}

export function useOnboarding() {
  const queryClient = useQueryClient();

  const statusQuery = useQuery<OnboardingState>({
    queryKey: ["onboarding-status"],
    queryFn: async () => {
      return apiFetch<OnboardingState>("/api/v1/onboarding/status");
    },
    retry: 1,
  });

  const step1Mutation = useMutation({
    mutationFn: async (payload: Step1Payload) => {
      return apiFetch<OnboardingState>("/api/v1/onboarding/step/1", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });

  const step2Mutation = useMutation({
    mutationFn: async (payload: Step2Payload) => {
      return apiFetch<{ onboarding_state: OnboardingState; connections_created: number }>(
        "/api/v1/onboarding/step/2",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  const step3Mutation = useMutation({
    mutationFn: async (payload: Step3Payload) => {
      return apiFetch<OnboardingState>("/api/v1/onboarding/step/3", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });

  const step4Mutation = useMutation({
    mutationFn: async () => {
      return apiFetch<Step4VerifyResult>("/api/v1/onboarding/step/4", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<{ success: boolean; dashboard_url: string; message: string }>(
        "/api/v1/onboarding/complete",
        {
          method: "POST",
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<{ success: boolean; message: string; onboarding_state: OnboardingState }>(
        "/api/v1/onboarding/reset",
        {
          method: "POST",
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });

  return {
    state: statusQuery.data,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    refetch: statusQuery.refetch,
    submitStep1: step1Mutation.mutateAsync,
    isSubmittingStep1: step1Mutation.isPending,
    submitStep2: step2Mutation.mutateAsync,
    isSubmittingStep2: step2Mutation.isPending,
    submitStep3: step3Mutation.mutateAsync,
    isSubmittingStep3: step3Mutation.isPending,
    verifyStep4: step4Mutation.mutateAsync,
    isVerifyingStep4: step4Mutation.isPending,
    completeWizard: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
    resetWizard: resetMutation.mutateAsync,
    isResetting: resetMutation.isPending,
  };
}

