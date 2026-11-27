"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Anomaly } from "@/types";

export const DEMO_ANOMALIES: Anomaly[] = [
  {
    id: "anom-groq-01",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    series_key: "groq/llama-3-70b-versatile",
    provider: "Groq",
    api_key_id: "key-groq-prod-evals",
    serviceName: "Groq Cloud LPU",
    detected_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    severity: "critical",
    status: "open",
    baseline_value: 12.50,
    actual_value: 86.40,
    deviation_pct: 591.2,
    surgePercent: "+591%",
    currentCost: 864,
    expectedCost: 125,
    explanation: {
      summary: "Abnormal inference loop in automated QA eval pipeline",
      root_cause: "Recursive test retry loop triggered 45,000 rapid concurrent requests without exponential backoff",
    },
    alert_sent: true,
    call_triggered: true,
  },
  {
    id: "anom-ec2-02",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    series_key: "aws/ec2/us-east-1/m6i.4xlarge",
    provider: "AWS",
    serviceName: "Amazon Elastic Compute Cloud (EC2)",
    detected_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    severity: "high",
    status: "open",
    baseline_value: 420.00,
    actual_value: 1140.00,
    deviation_pct: 171.4,
    surgePercent: "+171%",
    currentCost: 1140,
    expectedCost: 420,
    explanation: {
      summary: "Autoscaling group runaway node allocation in staging cluster",
      root_cause: "Health check misconfiguration marked healthy nodes as degraded, spawning 8 additional unneeded instances",
    },
    alert_sent: true,
    call_triggered: false,
  },
  {
    id: "anom-openai-03",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    series_key: "openai/gpt-4o/prod-copilot-svc",
    provider: "OpenAI",
    api_key_id: "prod-gpt4o-cluster",
    serviceName: "OpenAI API Platform",
    detected_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    severity: "high",
    status: "open",
    baseline_value: 680.00,
    actual_value: 1490.00,
    deviation_pct: 119.1,
    surgePercent: "+119%",
    currentCost: 1490,
    expectedCost: 680,
    explanation: {
      summary: "Prompt cache hit rate dropped from 71% to 18%",
      root_cause: "Dynamic system prompt timestamp injection invalidated prefix cache on every request",
    },
    alert_sent: true,
    call_triggered: true,
  },
  {
    id: "anom-bq-04",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    series_key: "gcp/bigquery/analysis-slots",
    provider: "GCP",
    serviceName: "Google BigQuery Slots",
    detected_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    severity: "medium",
    status: "open",
    baseline_value: 210.00,
    actual_value: 580.00,
    deviation_pct: 176.2,
    surgePercent: "+176%",
    currentCost: 580,
    expectedCost: 210,
    explanation: {
      summary: "Unpartitioned cross-region query scanning 14TB repeatedly",
      root_cause: "Ad-hoc analytic query ran in an automated hourly cron without table partition filter",
    },
    alert_sent: false,
    call_triggered: false,
  },
];

export function useAnomalies(status: string = "open") {
  return useQuery<Anomaly[]>({
    queryKey: ["anomalies", status],
    queryFn: async () => {
      try {
        const res = await apiFetch<Anomaly[]>(`/api/v1/anomalies?status=${status}&limit=50`);
        if (Array.isArray(res) && res.length > 0) {
          return res;
        }
        return DEMO_ANOMALIES;
      } catch {
        return DEMO_ANOMALIES;
      }
    },
    refetchInterval: 30_000,
  });
}

export function useAnomalyDetail(id: string) {
  return useQuery<Anomaly | null, Error>({
    queryKey: ["anomaly", id],
    queryFn: async (): Promise<Anomaly | null> => {
      try {
        const res = await apiFetch<Anomaly>(`/api/v1/anomalies/${id}`);
        if (res && res.id) return res;
      } catch {
        // Fall back to matching demo anomaly
      }
      const match = DEMO_ANOMALIES.find((a) => a.id === id);
      if (match) return match;
      const base = DEMO_ANOMALIES[0]!;
      return {
        id,
        tenant_id: base.tenant_id,
        series_key: base.series_key,
        provider: base.provider,
        api_key_id: base.api_key_id,
        serviceName: base.serviceName,
        detected_at: base.detected_at,
        severity: base.severity,
        status: base.status,
        baseline_value: base.baseline_value,
        actual_value: base.actual_value,
        deviation_pct: base.deviation_pct,
        surgePercent: base.surgePercent,
        currentCost: base.currentCost,
        expectedCost: base.expectedCost,
        explanation: base.explanation,
        alert_sent: base.alert_sent,
        call_triggered: base.call_triggered,
      };
    },
    enabled: !!id,
  });
}

export function useAcknowledgeAnomaly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<Anomaly>(`/api/v1/anomalies/${id}/acknowledge`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
    },
  });
}

export function useResolveAnomaly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<Anomaly>(`/api/v1/anomalies/${id}/resolve`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
    },
  });
}
