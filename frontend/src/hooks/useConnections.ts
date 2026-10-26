"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Connection } from "@/types";

export function useConnections() {
  const queryClient = useQueryClient();

  const query = useQuery<Connection[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      try {
        const res = await apiFetch<Connection[]>("/connections");
        if (Array.isArray(res)) {
          return res;
        }
      } catch {
        // Fallback to locally stored connections or empty array
      }

      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("cirra_connections");
          if (stored) {
            return JSON.parse(stored) as Connection[];
          }
        } catch {
          // ignore
        }
      }

      return [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newConnection: { name: string; provider: Connection["provider"] }) => {
      const created: Connection = {
        id: `conn-${Date.now()}`,
        tenant_id: "tenant-acme",
        name: newConnection.name,
        provider: newConnection.provider,
        status: "connected",
        last_synced_at: "Just now",
        created_at: new Date().toISOString(),
      };

      try {
        await apiFetch("/connections", {
          method: "POST",
          body: JSON.stringify(created),
        });
      } catch {
        // Persist locally if backend is unavailable
        if (typeof window !== "undefined") {
          try {
            const existing = queryClient.getQueryData<Connection[]>(["connections"]) ?? [];
            localStorage.setItem("cirra_connections", JSON.stringify([created, ...existing]));
          } catch {
            // ignore
          }
        }
      }

      return created;
    },
    onSuccess: (created) => {
      queryClient.setQueryData<Connection[]>(["connections"], (old = []) => [created, ...old]);
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    createConnection: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
