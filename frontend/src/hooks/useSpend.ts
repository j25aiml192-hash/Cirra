import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { CloudSpendResponse, AiSpendResponse } from "@/types/api";

export function useCloudSpend() {
  return useQuery<CloudSpendResponse>({
    queryKey: ["spend", "cloud"],
    queryFn: () => apiFetch<CloudSpendResponse>("/spend/cloud"),
  });
}

export function useAiSpend() {
  return useQuery<AiSpendResponse>({
    queryKey: ["spend", "ai"],
    queryFn: () => apiFetch<AiSpendResponse>("/spend/ai"),
  });
}
