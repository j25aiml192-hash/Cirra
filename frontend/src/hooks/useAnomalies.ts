

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Anomaly } from "@/types";

export function useAnomalies(status: string = "open") {
  return useQuery<Anomaly[]>({
    queryKey: ["anomalies", status],
    queryFn: async () => {
      try {
        const res = await apiFetch<Anomaly[]>(`/api/v1/anomalies?status=${status}&limit=50`);
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
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
        return res || null;
      } catch {
        return null;
      }
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
