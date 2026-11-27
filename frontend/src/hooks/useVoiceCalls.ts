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

export const DEMO_VOICE_CALLS: VoiceCallItem[] = [
  {
    id: "call-001",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    anomaly_id: "anom-groq-01",
    call_sid: "CA_DEMO_9182390123",
    provider: "Twilio",
    status: "completed",
    to_number: "+1 (555) 234-5678",
    from_number: "+1 (800) 555-CIRRA",
    duration_seconds: 48,
    turn_count: 4,
    outcome: "acknowledged",
    initiated_at: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
    answered_at: new Date(Date.now() - 37 * 60 * 1000 - 52 * 1000).toISOString(),
    ended_at: new Date(Date.now() - 37 * 60 * 1000).toISOString(),
    retry_count: 0,
    transcript: [
      {
        role: "assistant",
        text: "Urgent alert from Cirra Cloud Intelligence. A critical spend surge of +591% was detected on Groq Cloud LPU. Projected 24-hour cost is $2,400. Say 'Confirm' to execute emergency kill switch or 'Acknowledge' to investigate.",
        timestamp: "00:03",
      },
      {
        role: "user",
        text: "What service is causing the surge?",
        timestamp: "00:15",
      },
      {
        role: "assistant",
        text: "Recursive test retry loop on QA automated pipeline key: key-groq-prod-evals. Say 'Acknowledge' to isolate or 'Kill' to revoke key.",
        timestamp: "00:22",
      },
      {
        role: "user",
        text: "Acknowledge and isolate key immediately.",
        timestamp: "00:36",
      },
      {
        role: "assistant",
        text: "Understood. Alert acknowledged and isolated. Dispatched incident notice to Slack channel #cloud-incidents. Goodbye.",
        timestamp: "00:44",
      },
    ],
    anomaly_snapshot: {
      serviceName: "Groq Cloud LPU",
      surgePercent: "+591%",
      currentCost: 864,
      expectedCost: 125,
      severity: "critical",
    },
  },
  {
    id: "call-002",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    anomaly_id: "anom-openai-03",
    call_sid: "CA_DEMO_7718293411",
    provider: "Twilio",
    status: "completed",
    to_number: "+1 (555) 987-6543",
    from_number: "+1 (800) 555-CIRRA",
    duration_seconds: 35,
    turn_count: 3,
    outcome: "escalated",
    initiated_at: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    answered_at: new Date(Date.now() - 7 * 3600 * 1000 + 4 * 1000).toISOString(),
    ended_at: new Date(Date.now() - 7 * 3600 * 1000 + 39 * 1000).toISOString(),
    retry_count: 0,
    transcript: [
      {
        role: "assistant",
        text: "Cirra automated dispatch: High severity anomaly on OpenAI gpt-4o copilot service. Prompt cache failure detected.",
        timestamp: "00:02",
      },
      {
        role: "user",
        text: "Escalate to on-call platform engineer.",
        timestamp: "00:14",
      },
      {
        role: "assistant",
        text: "Escalating incident CIR-904 to Slack channel #cloud-incidents and PagerDuty schedule. Dispatched PR suggestion #142 to fix cache key.",
        timestamp: "00:28",
      },
    ],
    anomaly_snapshot: {
      serviceName: "OpenAI API Platform",
      surgePercent: "+119%",
      currentCost: 1490,
      expectedCost: 680,
      severity: "high",
    },
  },
  {
    id: "call-003",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    anomaly_id: "anom-ec2-02",
    call_sid: "CA_DEMO_4419280312",
    provider: "Twilio",
    status: "no-answer",
    to_number: "+1 (555) 345-6789",
    from_number: "+1 (800) 555-CIRRA",
    duration_seconds: 0,
    turn_count: 0,
    outcome: "no-response",
    initiated_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    retry_count: 2,
    error_message: "Subscriber line busy / no answer",
    transcript: [],
    anomaly_snapshot: {
      serviceName: "Amazon EC2",
      surgePercent: "+171%",
      currentCost: 1140,
      expectedCost: 420,
      severity: "high",
    },
  },
];

export function useVoiceCalls(limit: number = 50) {
  const queryClient = useQueryClient();

  const query = useQuery<VoiceCallItem[]>({
    queryKey: ["voice-calls", limit],
    queryFn: async () => {
      try {
        const res = await apiFetch<any>(`/api/v1/voice/calls?limit=${limit}`);
        const list = Array.isArray(res) ? res : res?.calls || res?.data || [];
        if (!list || list.length === 0) {
          return DEMO_VOICE_CALLS;
        }
        return list.map((item: any) => ({
          ...item,
          transcript: typeof item.transcript === "string" ? JSON.parse(item.transcript) : (item.transcript || []),
          anomaly_snapshot: typeof item.anomaly_snapshot === "string" ? JSON.parse(item.anomaly_snapshot) : item.anomaly_snapshot,
        }));
      } catch {
        return DEMO_VOICE_CALLS;
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
    calls: query.data || DEMO_VOICE_CALLS,
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
        if (res && res.id) {
          return {
            ...res,
            transcript: typeof res.transcript === "string" ? JSON.parse(res.transcript) : (res.transcript || []),
            anomaly_snapshot: typeof res.anomaly_snapshot === "string" ? JSON.parse(res.anomaly_snapshot) : res.anomaly_snapshot,
          };
        }
      } catch {
        // Fallback to match
      }
      const match = DEMO_VOICE_CALLS.find((c) => c.id === callId);
      if (match) return match;
      const base = DEMO_VOICE_CALLS[0]!;
      return {
        ...base,
        id: callId,
      };
    },
    enabled: !!callId,
  });
}
