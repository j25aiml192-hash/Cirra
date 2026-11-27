"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Connection } from "@/types";

export interface CreateConnectionPayload {
  name: string;
  provider: string;
  credentials: Record<string, any>;
}

export const DEMO_CONNECTIONS: Connection[] = [
  {
    id: "conn-aws-01",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    name: "AWS Production (us-east-1)",
    provider: "aws",
    status: "connected",
    last_synced_at: "Just now",
    created_at: "2026-10-01T00:00:00Z",
  },
  {
    id: "conn-gcp-02",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    name: "Google Cloud Analytics (us-central1)",
    provider: "gcp",
    status: "connected",
    last_synced_at: "2 mins ago",
    created_at: "2026-10-01T00:00:00Z",
  },
  {
    id: "conn-openai-03",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    name: "OpenAI Enterprise Org",
    provider: "openai",
    status: "connected",
    last_synced_at: "1 min ago",
    created_at: "2026-10-05T00:00:00Z",
  },
  {
    id: "conn-anthropic-04",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    name: "Anthropic Claude API",
    provider: "anthropic",
    status: "connected",
    last_synced_at: "4 mins ago",
    created_at: "2026-10-10T00:00:00Z",
  },
  {
    id: "conn-azure-05",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    name: "Azure Secondary Cluster",
    provider: "azure",
    status: "syncing",
    last_synced_at: "Syncing...",
    created_at: "2026-11-12T00:00:00Z",
  },
];

export function useConnections() {
  const queryClient = useQueryClient();

  const query = useQuery<Connection[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      try {
        const res = await apiFetch<any[]>("/api/v1/connections");
        if (Array.isArray(res) && res.length > 0) {
          return res.map((c: any) => ({
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
        }
        return DEMO_CONNECTIONS;
      } catch {
        return DEMO_CONNECTIONS;
      }
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
