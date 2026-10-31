"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { DashboardSummary, Period } from "@/types";

export function getDefaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

function useSafeSearchParams(): URLSearchParams {
  const [params, setParams] = useState<URLSearchParams>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setParams(new URLSearchParams(window.location.search));

      const handlePopState = () => {
        setParams(new URLSearchParams(window.location.search));
      };
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, []);

  return params;
}

function periodToDates(period: Period = "30d"): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  if (period === "90d") {
    start.setDate(start.getDate() - 90);
  } else if (period === "6m") {
    start.setMonth(start.getMonth() - 6);
  } else if (period === "12m") {
    start.setFullYear(start.getFullYear() - 1);
  } else {
    start.setDate(start.getDate() - 30);
  }
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

function mapDashboardSummary(res: Record<string, unknown> | null | undefined): DashboardSummary {
  const totalSpend = Number(res?.totalSpend ?? res?.total_spend_mtd ?? 0);
  const coverageScore = Number(res?.coverageScore ?? 100);
  const unallocatedPct = Number(res?.unallocatedPct ?? (100 - coverageScore));
  const attributedSpend = totalSpend * (coverageScore / 100);
  const unallocatedSpend = totalSpend * (unallocatedPct / 100);

  const topServicesRaw = Array.isArray(res?.topServices) ? res.topServices : [];
  const topAiKeysRaw = Array.isArray(res?.topAiKeys) ? res.topAiKeys : [];
  const monthlyRaw = Array.isArray(res?.monthly) ? res.monthly : [];

  return {
    total_spend_mtd: totalSpend,
    mom_change: Number(res?.momChange ?? res?.mom_change ?? 0),
    forecasted_spend: Number(res?.forecasted_spend ?? totalSpend * 1.1),
    cloud_spend_mtd: Number(res?.cloud_spend_mtd ?? totalSpend),
    ai_spend_mtd: Number(res?.ai_spend_mtd ?? 0),
    total_tokens: Number(res?.total_tokens ?? 0),
    anomalies_detected: Number(res?.anomalies_detected ?? 0),
    potential_savings_monthly: Number(res?.potential_savings_monthly ?? 0),
    active_connections: Number(res?.active_connections ?? 0),
    monthly: monthlyRaw as DashboardSummary["monthly"],
    topServices: topServicesRaw.map((s: Record<string, unknown>) => ({
      name: String(s.service_name || s.name || ""),
      provider: (String(s.provider || "AWS").toUpperCase() || "AWS") as any,
      spend: Number(s.spend ?? 0),
      change: String(s.change || "0%"),
      changePositive: Boolean(s.changePositive ?? true),
      share: Number(s.share ?? 0),
    })),
    topAiKeys: topAiKeysRaw.map((k: Record<string, unknown>) => ({
      keyName: String(k.api_key_id || k.keyName || ""),
      provider: (String(k.provider || "OpenAI") || "OpenAI") as any,
      team: String(k.team || "Unallocated"),
      spend: Number(k.spend ?? 0),
      tokens: String(k.tokens ?? "0"),
    })),
    attributionCoverage: {
      percentage: coverageScore,
      attributed: attributedSpend,
      unallocated: unallocatedSpend,
      resourcesCount: Number((res?.attributionCoverage as Record<string, unknown>)?.resourcesCount ?? 0),
      totalResources: Number((res?.attributionCoverage as Record<string, unknown>)?.totalResources ?? 0),
    },
  };
}

export function useDashboardSummary() {
  const searchParams = useSafeSearchParams();
  const startDate = searchParams.get("startDate") ?? getDefaultStartDate();
  const endDate = searchParams.get("endDate") ?? new Date().toISOString();

  return useQuery({
    queryKey: ["dashboard", "summary", startDate, endDate],
    queryFn: async () => {
      const res = await apiFetch<Record<string, unknown>>(
        `/api/dashboard/summary?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      );
      return mapDashboardSummary(res);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboard(period: Period = "30d") {
  const { startDate, endDate } = periodToDates(period);

  const query = useQuery<DashboardSummary>({
    queryKey: ["dashboard", "summary", period, startDate, endDate],
    queryFn: async () => {
      const res = await apiFetch<Record<string, unknown>>(
        `/api/dashboard/summary?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      );
      return mapDashboardSummary(res);
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
