import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Connection } from "@/types/api";

export function useConnections() {
  const queryClient = useQueryClient();

  const query = useQuery<Connection[]>({
    queryKey: ["connections"],
    queryFn: () => apiFetch<Connection[]>("/connections"),
  });

  const createMutation = useMutation({
    mutationFn: (newConnection: { name: string; provider: string; credentials: Record<string, unknown> }) =>
      apiFetch<Connection>("/connections", {
        method: "POST",
        body: JSON.stringify(newConnection),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  return {
    ...query,
    createConnection: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
