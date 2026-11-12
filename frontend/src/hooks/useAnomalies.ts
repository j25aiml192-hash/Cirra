"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Anomaly } from "@/types";

export function useAnomalies(status: string = "open") {
  return useQuery<Anomaly[]>({
    queryKey: ["anomalies", status],
    queryFn: () => apiFetch<Anomaly[]>(`/api/v1/anomalies?status=${status}&limit=50`),
    refetchInterval: 30_000,
  });
}

export function useAnomalyDetail(id: string) {
  return useQuery<Anomaly>({
    queryKey: ["anomaly", id],
    queryFn: () => apiFetch<Anomaly>(`/api/v1/anomalies/${id}`),
    enabled: !!id,
  });
}

export function useAcknowledgeAnomaly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Anomaly>(`/api/v1/anomalies/${id}/acknowledge`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
    },
  });
}

export function useResolveAnomaly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Anomaly>(`/api/v1/anomalies/${id}/resolve`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
    },
  });
}
