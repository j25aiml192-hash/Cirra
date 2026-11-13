"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Connection } from "@/types";

export interface CreateConnectionPayload {
  name: string;
  provider: string;
  credentials: Record<string, any>;
}

export function useConnections() {
  const queryClient = useQueryClient();

  const query = useQuery<Connection[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/v1/connections");
      return (res ?? []).map((c: any) => ({
        id: String(c.id),
        tenant_id: String(c.tenant_id ?? ""),
        name: String(c.name ?? ""),
        provider: c.provider,
        status: c.status ?? "pending",
        last_synced_at: c.last_synced_at
          ? new Date(c.last_synced_at).toLocaleString()
          : undefined,
        errorMessage: c.last_error ?? c.errorMessage,
        created_at: c.created_at,
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      provider: string;
      credentials?: Record<string, any>;
    }) => {
      return apiFetch<Connection>("/api/v1/connections", {
        method: "POST",
        body: JSON.stringify({
          name: payload.name,
          provider: payload.provider.toLowerCase(),
          credentials: payload.credentials || {},
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<void>(`/api/v1/connections/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<{ ok: boolean; error?: string }>(`/api/v1/connections/${id}/test`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      label,
      monthly_spend_cap,
      is_monitored,
    }: {
      id: string;
      label?: string;
      monthly_spend_cap?: number;
      is_monitored?: boolean;
    }) => {
      return apiFetch<any>(`/api/v1/connections/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ label, monthly_spend_cap, is_monitored }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createConnection: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createMutation,
    updateConnection: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateMutation,
    deleteConnection: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteMutation,
    testConnection: testMutation.mutateAsync,
    isTesting: testMutation.isPending,
    testMutation,
  };
}
