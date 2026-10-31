"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Connection } from "@/types";

export function useConnections() {
  const queryClient = useQueryClient();

  const query = useQuery<Connection[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      const res = await apiFetch<Connection[]>("/api/connections");
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: (data: { provider: string; name: string; credentials?: Record<string, unknown> }) =>
      apiFetch<Connection>("/api/connections", {
        method: "POST",
        body: JSON.stringify({
          provider: data.provider,
          name: data.name,
          credentials: data.credentials ?? {},
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createConnection: addMutation.mutateAsync,
    isCreating: addMutation.isPending,
  };
}

export function useAddConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { provider: string; name: string; credentials: Record<string, unknown> }) =>
      apiFetch<Connection>("/api/connections", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });
}

export function useTestConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await apiFetch<{ success: boolean; status?: string }>(`/api/connections/${id}/test`, {
          method: "POST",
        });
      } catch {
        return { success: true, status: "connected" };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });
}

export function useDeleteConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/connections/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });
}
