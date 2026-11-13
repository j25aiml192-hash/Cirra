"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface TranscriptTurn {
  role: "assistant" | "user" | "system" | string;
  text: string;
  timestamp?: string;
}

export interface VoiceCallItem {
  id: string;
  tenant_id: string;
  anomaly_id?: string;
  call_sid?: string;
  provider: string;
  status: "completed" | "no-answer" | "failed" | "in-progress" | "initiated" | "busy" | string;
  to_number: string;
  from_number: string;
  duration_seconds?: number;
  turn_count: number;
  transcript: TranscriptTurn[];
  anomaly_snapshot?: Record<string, any>;
  outcome?: "acknowledged" | "escalated" | "no-response" | string;
  initiated_at?: string;
  answered_at?: string;
  ended_at?: string;
  retry_count?: number;
  error_message?: string;
}

export function useVoiceCalls(limit: number = 50) {
  const queryClient = useQueryClient();

  const query = useQuery<VoiceCallItem[]>({
    queryKey: ["voice-calls", limit],
    queryFn: async () => {
      try {
        const res = await apiFetch<any>(`/api/v1/voice/calls?limit=${limit}`);
        const list = Array.isArray(res) ? res : res?.calls || res?.data || [];
        return list.map((item: any) => ({
          ...item,
          transcript: typeof item.transcript === "string" ? JSON.parse(item.transcript) : (item.transcript || []),
          anomaly_snapshot: typeof item.anomaly_snapshot === "string" ? JSON.parse(item.anomaly_snapshot) : item.anomaly_snapshot,
        }));
      } catch {
        return [];
      }
    },
    refetchInterval: 15000,
  });

  const retryMutation = useMutation({
    mutationFn: async (callId: string) => {
      return apiFetch<{ voice_call_id: string; status: string; call_sid?: string }>(
        `/api/v1/voice/calls/${callId}/retry`,
        { method: "POST" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-calls"] });
    },
  });

  return {
    calls: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    retryCall: retryMutation.mutateAsync,
    isRetrying: retryMutation.isPending,
  };
}

export function useVoiceCallDetail(callId: string | null) {
  return useQuery<VoiceCallItem | null>({
    queryKey: ["voice-call", callId],
    queryFn: async () => {
      if (!callId) return null;
      try {
        const res = await apiFetch<any>(`/api/v1/voice/calls/${callId}`);
        if (!res) return null;
        return {
          ...res,
          transcript: typeof res.transcript === "string" ? JSON.parse(res.transcript) : (res.transcript || []),
          anomaly_snapshot: typeof res.anomaly_snapshot === "string" ? JSON.parse(res.anomaly_snapshot) : res.anomaly_snapshot,
        };
      } catch {
        return null;
      }
    },
    enabled: !!callId,
  });
}
