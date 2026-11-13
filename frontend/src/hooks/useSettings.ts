"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface TenantSettings {
  id?: string;
  tenant_id: string;
  alert_phone?: string;
  slack_webhook_url?: string;
  ntfy_topic_url?: string;
  spend_cap_usd?: number;
  quiet_hours_start?: number;
  quiet_hours_end?: number;
  quiet_hours_tz: string;
  voice_calls_enabled: boolean;
  slack_enabled: boolean;
  ntfy_enabled: boolean;
  email_enabled: boolean;
  alert_email?: string;
  min_severity_voice: "low" | "medium" | "high" | "critical" | string;
  min_severity_slack: "low" | "medium" | "high" | "critical" | string;
  anomaly_cooldown_minutes: number;
}

export function useSettings() {
  const queryClient = useQueryClient();

  const query = useQuery<TenantSettings>({
    queryKey: ["tenant-settings"],
    queryFn: async () => {
      return apiFetch<TenantSettings>("/api/v1/settings");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<TenantSettings>) => {
      return apiFetch<TenantSettings>("/api/v1/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-settings"] });
    },
  });

  const testSlackMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<{ success: boolean; http_code?: number; error?: string }>(
        "/api/v1/settings/test/slack",
        { method: "POST" }
      );
    },
  });

  const testNtfyMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<{ success: boolean; http_code?: number; error?: string }>(
        "/api/v1/settings/test/ntfy",
        { method: "POST" }
      );
    },
  });

  const testCallMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<{ voice_call_id: string; call_sid?: string; status: string }>(
        "/api/v1/settings/test/call",
        { method: "POST" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-calls"] });
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    testSlack: testSlackMutation.mutateAsync,
    isTestingSlack: testSlackMutation.isPending,
    testNtfy: testNtfyMutation.mutateAsync,
    isTestingNtfy: testNtfyMutation.isPending,
    testCall: testCallMutation.mutateAsync,
    isTestingCall: testCallMutation.isPending,
  };
}

