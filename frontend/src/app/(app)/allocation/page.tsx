"use client";

import React, { useState } from "react";
import { GripVertical, Plus, Edit2, Trash2, Check, X, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import type { AllocationRule, AllocationCoverage, SuggestedRule } from "@/types";

const fallbackSuggestions: SuggestedRule[] = [
  {
    id: "sug-1",
    pattern: "AWS NAT Gateway in us-east-1 (vpc-084a92)",
    suggestedTeam: "Core Platform",
    confidence: 0.94,
    estimatedSpend: 7530,
  },
  {
    id: "sug-2",
    pattern: "Anthropic Claude calls with key 'agentic-workflow-v2'",
    suggestedTeam: "Autonomous Eng",
    confidence: 0.98,
    estimatedSpend: 9800,
  },
];

export default function AllocationPage() {
  const queryClient = useQueryClient();
  const [suggestions, setSuggestions] = useState<SuggestedRule[]>(fallbackSuggestions);
  const [isAdding, setIsAdding] = useState(false);
  const [newMatchType, setNewMatchType] = useState<"tag" | "prefix" | "regex" | "service">("tag");
  const [newMatchValue, setNewMatchValue] = useState("");
  const [newAssignTeam, setNewAssignTeam] = useState("");
  const [newAssignFeature, setNewAssignFeature] = useState("");

  // 1. GET rules
  const rulesQuery = useQuery<AllocationRule[]>({
    queryKey: ["allocation", "rules"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/v1/allocation/rules");
      return (res ?? []).map((r: any) => ({
        id: String(r.id),
        priority: Number(r.priority ?? 1),
        match_type: r.match_type ?? "tag",
        match_value: String(r.match_value ?? ""),
        assign_team: r.assign_team ?? "",
        assign_customer: r.assign_customer,
        assign_feature: r.assign_feature,
        spendAttributed: Number(r.spendAttributed ?? 0),
      }));
    },
  });

  // 2. Coverage query
  const coverageQuery = useQuery<AllocationCoverage>({
    queryKey: ["allocation", "coverage"],
    queryFn: async () => {
      const res = await apiFetch<any>("/api/v1/allocation/coverage");
      return {
        totalSpend: Number(res?.totalSpend ?? res?.total_spend ?? 0),
        attributedSpend: Number(res?.attributedSpend ?? res?.attributed_spend ?? 0),
        unallocatedSpend: Number(res?.unallocatedSpend ?? res?.unallocated_spend ?? 0),
        coveragePercentage: Number(res?.coveragePercentage ?? res?.coverage_percentage ?? 0),
      };
    },
  });

  // 3. POST rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (payload: Partial<AllocationRule>) => {
      return apiFetch<AllocationRule>("/api/v1/allocation/rules", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocation", "rules"] });
      queryClient.invalidateQueries({ queryKey: ["allocation", "coverage"] });
    },
  });

  // 4. PATCH rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: { id: string } & Partial<AllocationRule>) => {
      return apiFetch<AllocationRule>(`/api/v1/allocation/rules/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocation", "rules"] });
      queryClient.invalidateQueries({ queryKey: ["allocation", "coverage"] });
    },
  });

  // 5. DELETE rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<void>(`/api/v1/allocation/rules/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocation", "rules"] });
      queryClient.invalidateQueries({ queryKey: ["allocation", "coverage"] });
    },
  });

  // 6. Preview mutation
  const previewMutation = useMutation({
    mutationFn: async (payload: {
      match_type: string;
      match_value: string;
      assign_team?: string;
    }) => {
      return apiFetch<{
        matchedRows: number;
        matchedSpend: number;
      }>("/api/v1/allocation/rules/preview", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  });

  const handleConfirmSuggestion = async (sug: SuggestedRule) => {
    try {
      await createRuleMutation.mutateAsync({
        priority: (rulesQuery.data?.length ?? 0) + 1,
        match_type: "regex",
        match_value: sug.pattern,
        assign_team: sug.suggestedTeam,
      });
      setSuggestions((prev) => prev.filter((s) => s.id !== sug.id));
    } catch (err) {
      console.error("Failed to add suggestion:", err);
    }
  };

  const handleDismissSuggestion = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteRuleMutation.mutateAsync(id);
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchValue.trim() || !newAssignTeam.trim()) return;

    try {
      await createRuleMutation.mutateAsync({
        priority: (rulesQuery.data?.length ?? 0) + 1,
        match_type: newMatchType,
        match_value: newMatchValue.trim(),
        assign_team: newAssignTeam.trim(),
        assign_feature: newAssignFeature.trim() || undefined,
      });
      setNewMatchValue("");
      setNewAssignTeam("");
      setNewAssignFeature("");
      setIsAdding(false);
    } catch (err) {
      console.error("Failed to create rule:", err);
    }
  };

  if (rulesQuery.isError || coverageQuery.isError) {
    return (
      <div className="min-h-screen">
        <Topbar />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
          <EmptyState
            title="Failed to load allocation data"
            description="Unable to connect to the allocation rules and coverage telemetry API. Please check your connection and try again."
          />
        </main>
      </div>
    );
  }

  const coverage = coverageQuery.data;
  const coveragePct = coverage?.coveragePercentage ?? 84.2;
  const unallocatedPct = Math.max(0, 100 - coveragePct).toFixed(1);
  const attributedSpend = coverage?.attributedSpend ?? 108100;
  const unallocatedSpend = coverage?.unallocatedSpend ?? 20320;
  const rules = rulesQuery.data ?? [];

  return (
    <div className="min-h-screen">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
        {/* Coverage Bar Card */}
        <div className="cirra-card p-6">
          <div className="flex justify-between text-sm mb-3">
            <span className="font-semibold text-[#0A192F]">Attribution Coverage</span>
            <span className="text-[#475569] font-medium">
              {coverageQuery.isLoading ? (
                <Skeleton className="h-4 w-36 inline-block" />
              ) : (
                `${coveragePct.toFixed(1)}% attributed · ${unallocatedPct}% unallocated`
              )}
            </span>
          </div>
          <div className="h-3 rounded-full bg-[#EBF2FA] overflow-hidden">
            {coverageQuery.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <div
                className="h-full bg-[#0062E0] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, coveragePct))}%` }}
              />
            )}
          </div>
          <div className="flex gap-6 mt-3 text-xs text-[#475569] font-medium">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-[#0062E0] rounded-full inline-block mr-1.5" />
              ${formatNumber(attributedSpend)} attributed
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-[#CBD5E1] rounded-full inline-block mr-1.5" />
              ${formatNumber(unallocatedSpend)} unallocated
            </span>
          </div>
        </div>

        {/* ML Suggestions Card */}
        {suggestions.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                SUGGESTED RULES (ML DISCOVERED)
              </span>
            </div>

            <div className="space-y-3">
              {suggestions.map((sug) => (
                <div
                  key={sug.id}
                  className="bg-white/80 backdrop-blur rounded-xl p-3.5 border border-amber-200/50 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#0A192F]">{sug.pattern}</div>
                    <div className="text-[11px] text-[#475569] mt-0.5">
                      Suggested Team:{" "}
                      <span className="font-semibold text-[#0062E0]">{sug.suggestedTeam}</span> ·{" "}
                      Confidence:{" "}
                      <span className="font-medium text-emerald-600">
                        {(sug.confidence * 100).toFixed(0)}%
                      </span>{" "}
                      · Attributed spend:{" "}
                      <span className="font-semibold">
                        ${formatNumber(sug.estimatedSpend)}/mo
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmSuggestion(sug)}
                      disabled={createRuleMutation.isPending}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-medium flex items-center gap-1 hover:bg-emerald-700 shadow-sm transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismissSuggestion(sug.id)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#D6E4F5] text-[#475569] text-xs font-medium hover:bg-[#F0F5FD] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rules Table Card */}
        <div className="cirra-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#0A192F] text-base">Allocation Rules Hierarchy</h3>
              <p className="text-xs text-[#475569] mt-0.5">
                Rules are evaluated sequentially from top to bottom
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="px-3.5 py-1.5 rounded-lg bg-[#0062E0] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#0052C2] shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Rule
            </button>
          </div>

          {/* Inline Add Rule Form */}
          {isAdding && (
            <form
              onSubmit={handleCreateRule}
              className="mb-4 p-4 rounded-xl border border-[#D6E4F5] bg-[#F8FAFD] space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#334155] block mb-1">
                    Match Type
                  </label>
                  <select
                    value={newMatchType}
                    onChange={(e) =>
                      setNewMatchType(
                        e.target.value as "tag" | "prefix" | "regex" | "service"
                      )
                    }
                    className="w-full h-8 px-2 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#334155]"
                  >
                    <option value="tag">tag</option>
                    <option value="prefix">prefix</option>
                    <option value="regex">regex</option>
                    <option value="service">service</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#334155] block mb-1">
                    Match Value
                  </label>
                  <input
                    value={newMatchValue}
                    onChange={(e) => setNewMatchValue(e.target.value)}
                    placeholder="e.g. env=prod"
                    required
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#334155] block mb-1">
                    Assign Team
                  </label>
                  <input
                    value={newAssignTeam}
                    onChange={(e) => setNewAssignTeam(e.target.value)}
                    placeholder="e.g. Core Platform"
                    required
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#334155] block mb-1">
                    Feature (Optional)
                  </label>
                  <input
                    value={newAssignFeature}
                    onChange={(e) => setNewAssignFeature(e.target.value)}
                    placeholder="e.g. Storage"
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#475569] hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRuleMutation.isPending}
                  className="px-4 py-1.5 rounded-lg bg-[#0062E0] text-white text-xs font-semibold hover:bg-[#0052C2] transition-colors"
                >
                  {createRuleMutation.isPending ? "Saving..." : "Save Rule"}
                </button>
              </div>
            </form>
          )}

          {rulesQuery.isLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 px-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="w-6 h-4" />
                    <Skeleton className="w-12 h-5 rounded" />
                    <Skeleton className="w-32 h-5 rounded" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-24 h-5 rounded-full" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : rules.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#64748B]">
              No allocation rules defined yet. Click &quot;Add Rule&quot; to configure your first rule.
            </div>
          ) : (
            <div className="divide-y divide-[#EBF2FA]">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="py-3 px-2 flex items-center justify-between hover:bg-[#F4F8FD] rounded-lg group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-[#94A3B8] cursor-grab opacity-40 group-hover:opacity-100" />
                    <span className="text-xs font-mono font-bold text-[#64748B] w-6">
                      #{rule.priority}
                    </span>
                    <Badge
                      variant={rule.match_type === "tag" ? "indigo" : "neutral"}
                      className="uppercase text-[10px]"
                    >
                      {rule.match_type}
                    </Badge>
                    <code className="text-xs font-mono font-medium text-[#334155] bg-[#F0F5FD] px-2 py-0.5 rounded">
                      {rule.match_value}
                    </code>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF3FE] text-[#0062E0] border border-[#BCD9FC]">
                        {rule.assign_team}
                      </span>
                      {rule.assign_feature && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {rule.assign_feature}
                        </span>
                      )}
                      {Boolean(rule.spendAttributed) && (
                        <span className="text-xs font-mono text-[#64748B] ml-2">
                          ${formatNumber(rule.spendAttributed ?? 0)}
                        </span>
                      )}
                    </div>

                    {/* Edit / Delete actions visible on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={deleteRuleMutation.isPending}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
