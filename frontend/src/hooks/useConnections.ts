"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Connection } from "@/types";

const mockConnections: Connection[] = [
  {
    id: "conn-aws-prod",
    tenant_id: "tenant-acme",
    name: "AWS Production (CUR 2.0)",
    provider: "aws",
    status: "connected",
    last_synced_at: "2 hours ago",
    created_at: "2024-08-10T00:00:00Z",
  },
  {
    id: "conn-openai-org",
    tenant_id: "tenant-acme",
    name: "OpenAI Main Organization",
    provider: "openai",
    status: "connected",
    last_synced_at: "15 minutes ago",
    created_at: "2024-09-01T00:00:00Z",
  },
  {
    id: "conn-gcp-data",
    tenant_id: "tenant-acme",
    name: "GCP BigQuery Export (Analytics)",
    provider: "gcp",
    status: "connected",
    last_synced_at: "3 hours ago",
    created_at: "2024-09-15T00:00:00Z",
  },
  {
    id: "conn-anthropic-team",
    tenant_id: "tenant-acme",
    name: "Anthropic Claude Admin Key",
    provider: "anthropic",
    status: "error",
    errorMessage: "API token expired or insufficient organization permissions to query /v1/usage.",
    last_synced_at: "1 day ago",
    created_at: "2024-09-20T00:00:00Z",
  },
];

export function useConnections() {
  const queryClient = useQueryClient();

  const query = useQuery<Connection[]>({
    queryKey: ["connections"],
    queryFn: async () => mockConnections,
    initialData: mockConnections,
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
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    createConnection: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
