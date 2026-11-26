"use client";

import React, { useState } from "react";
import {
  GripVertical,
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Play,
  Lock,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Sliders,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import type { AllocationRule, AllocationCoverage, SuggestedRule } from "@/types";
import {
  useRecommendations,
  useSmartRules,
  useRuleTemplates,
  useCreateSmartRule,
  useEvaluateRules,
  useToggleSmartRule,
  useDeleteSmartRule,
  type ModelSwapRecommendation,
  type RuleTemplate,
  type SmartRule,
} from "@/hooks/useAllocation";

const DEFAULT_COVERAGE: AllocationCoverage = {
  totalSpend: 0,
  attributedSpend: 0,
  unallocatedSpend: 0,
  coveragePercentage: 0,
};

export default function AllocationPage() {
  const queryClient = useQueryClient();
  const isSmartEnabled = process.env.NEXT_PUBLIC_ENABLE_SMART_ALLOCATION === "true";

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── Existing Allocation State ──────────────────────────────────
  const [suggestions, setSuggestions] = useState<SuggestedRule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newMatchType, setNewMatchType] = useState<"tag" | "prefix" | "regex" | "service">("tag");
  const [newMatchValue, setNewMatchValue] = useState("");
  const [newAssignTeam, setNewAssignTeam] = useState("");
  const [newAssignFeature, setNewAssignFeature] = useState("");

  // ── Smart Rules Modal State ────────────────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState<RuleTemplate | null>(null);
  const [modalRuleName, setModalRuleName] = useState("");
  const [modalThreshold, setModalThreshold] = useState<number | string>("");

  // ── Existing Queries & Mutations ──────────────────────────────
  const rulesQuery = useQuery<AllocationRule[]>({
    queryKey: ["allocation", "rules"],
    queryFn: async () => {
      try {
        const res = await apiFetch<any[]>("/api/v1/allocation/rules");
        if (!Array.isArray(res)) return [];
        return res.map((r: any) => ({
          id: String(r.id),
          priority: Number(r.priority ?? 1),
          match_type: r.match_type ?? "tag",
          match_value: String(r.match_value ?? ""),
          assign_team: r.assign_team ?? "",
          assign_customer: r.assign_customer,
          assign_feature: r.assign_feature,
          spendAttributed: Number(r.spendAttributed ?? 0),
        }));
      } catch {
        return [];
      }
    },
  });

  const coverageQuery = useQuery<AllocationCoverage>({
    queryKey: ["allocation", "coverage"],
    queryFn: async () => {
      try {
        const res = await apiFetch<any>("/api/v1/allocation/coverage");
        if (!res) return DEFAULT_COVERAGE;
        return {
          totalSpend: Number(res?.totalSpend ?? res?.total_spend ?? 0),
          attributedSpend: Number(res?.attributedSpend ?? res?.attributed_spend ?? 0),
          unallocatedSpend: Number(res?.unallocatedSpend ?? res?.unallocated_spend ?? 0),
          coveragePercentage: Number(res?.coveragePercentage ?? res?.coverage_percentage ?? 0),
        };
      } catch {
        return DEFAULT_COVERAGE;
      }
    },
  });

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

  // ── Smart Allocation Hooks ─────────────────────────────────────
  const recsQuery = useRecommendations();
  const smartRulesQuery = useSmartRules();
  const ruleTemplatesQuery = useRuleTemplates();
  const createSmartRuleMutation = useCreateSmartRule();
  const evaluateRulesMutation = useEvaluateRules();
  const toggleSmartRuleMutation = useToggleSmartRule();
  const deleteSmartRuleMutation = useDeleteSmartRule();

  // ── Handlers ───────────────────────────────────────────────────
  const handleConfirmSuggestion = async (sug: SuggestedRule) => {
    try {
      await createRuleMutation.mutateAsync({
        priority: (rulesQuery.data?.length ?? 0) + 1,
        match_type: "regex",
        match_value: sug.pattern,
        assign_team: sug.suggestedTeam,
      });
      setSuggestions((prev) => prev.filter((s) => s.id !== sug.id));
      showToast("Suggested rule approved");
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
      showToast("Allocation rule created");
    } catch (err) {
      console.error("Failed to create rule:", err);
    }
  };

  const handleApplyModelSwapRule = async (rec: ModelSwapRecommendation) => {
    try {
      await createRuleMutation.mutateAsync({
        priority: (rulesQuery.data?.length ?? 0) + 1,
        match_type: "tag",
        match_value: `model=${rec.current_model}`,
        assign_team: "AI Infrastructure",
        assign_feature: `Optimized: ${rec.recommended_model}`,
      });
      showToast("Recommendation saved as rule");
    } catch (err) {
      console.error("Failed to apply recommendation as rule:", err);
    }
  };

  const handleOpenAddSmartRuleModal = (tpl: RuleTemplate) => {
    setSelectedTemplate(tpl);
    setModalRuleName(tpl.name);
    setModalThreshold(tpl.default_value !== null ? tpl.default_value : "");
  };

  const handleSaveSmartRuleModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    const numVal = modalThreshold !== "" ? Number(modalThreshold) : null;
    try {
      await createSmartRuleMutation.mutateAsync({
        name: modalRuleName.trim() || selectedTemplate.name,
        condition_type: selectedTemplate.condition_type,
        threshold_value: numVal,
        unit: selectedTemplate.unit,
        scope: selectedTemplate.scope,
        is_active: true,
      });
      setSelectedTemplate(null);
      showToast("Smart rule guardrail activated");
    } catch (err) {
      console.error("Failed to create smart rule:", err);
    }
  };

  const handleRunEvaluation = async () => {
    try {
      await evaluateRulesMutation.mutateAsync();
      showToast("Rules evaluated against real-time metrics");
    } catch (err) {
      console.error("Evaluation failed:", err);
    }
  };

  const coverage = coverageQuery.data ?? DEFAULT_COVERAGE;
  const coveragePct = coverage?.coveragePercentage ?? 0;
  const unallocatedPct = Math.max(0, 100 - coveragePct).toFixed(1);
  const attributedSpend = coverage?.attributedSpend ?? 0;
  const unallocatedSpend = coverage?.unallocatedSpend ?? 0;
  const rules = rulesQuery.data ?? [];

  const recommendations = recsQuery.data;
  const modelSwaps = recommendations?.model_swaps ?? [];
  const scalingRecs = recommendations?.scaling ?? [];
  const totalSavings = recommendations?.total_potential_monthly_savings ?? 0;
  const smartRules = smartRulesQuery.data ?? [];
  const ruleTemplates = ruleTemplatesQuery.data ?? [];

  return (
    <div className="min-h-screen">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto select-none">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0B1527] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-medium">{toastMessage}</span>
          </div>
        )}

        {/* ── SECTION 0: Coverage Bar Card ────────────────────────────── */}
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

        {/* ── ML Suggestions Card ────────────────────────────────────── */}
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

        {/* ── Rules Table Card (Existing Allocation Rules CRUD) ──────── */}
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

        {/* ── SMART ALLOCATION GATE ───────────────────────────────────── */}
        {!isSmartEnabled ? (
          <div className="cirra-card p-8 border border-dashed border-slate-300 bg-slate-50 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 uppercase tracking-wider inline-block mb-2">
                Smart Allocation — Enable in settings
              </span>
              <h3 className="text-base font-semibold text-[#0A192F]">
                Automated Allocation & Optimization Intelligence
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Unlock model swap recommendations, growth scaling alerts, and automated budget guardrails by setting{" "}
                <code className="text-slate-700 bg-slate-200 px-1 py-0.5 rounded">ENABLE_SMART_ALLOCATION=true</code>.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── SECTION 1: Model Swap Recommendations ───────────────── */}
            <div className="cirra-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#EBF2FA]">
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-[#0A192F] text-base">
                      Model Optimization Opportunities
                    </h3>
                  </div>
                  <p className="text-xs text-[#475569] mt-0.5">
                    Switch to cheaper models without sacrificing quality
                  </p>
                </div>

                {totalSavings > 0 && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Potential Savings: ${formatNumber(totalSavings)}/mo</span>
                  </div>
                )}
              </div>

              {recsQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-200 space-y-3">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
              ) : modelSwaps.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  No model swap opportunities found. Your current model deployments are cost-optimal.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modelSwaps.map((rec, idx) => {
                    const qualityColor =
                      rec.quality_tier_change === "same"
                        ? "bg-slate-100 text-slate-700 border-slate-200"
                        : rec.quality_tier_change === "downgrade"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200";

                    const qualityLabel =
                      rec.quality_tier_change === "same"
                        ? "Same tier"
                        : rec.quality_tier_change === "downgrade"
                        ? "Slight downgrade"
                        : "Upgrade";

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-[#D6E4F5] bg-[#F8FAFD] hover:bg-[#F2F7FC] transition-colors flex flex-col justify-between space-y-3"
                      >
                        {/* Top: Current Model -> Recommended Model */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                {rec.current_provider}
                              </span>
                              <span className="text-xs font-bold text-[#0A192F] truncate">
                                {rec.current_model}
                              </span>
                            </div>
                            <div className="text-[11px] font-medium text-slate-500">
                              Costing ${formatNumber(rec.current_monthly_cost)}/month
                            </div>
                          </div>

                          <div className="flex items-center justify-center p-1.5 rounded-full bg-white shadow-sm border border-slate-200 flex-shrink-0">
                            <ArrowRight className="w-4 h-4 text-[#0062E0]" />
                          </div>

                          <div className="min-w-0 text-right">
                            <div className="flex items-center justify-end gap-1.5 mb-1">
                              <span className="text-xs font-bold text-[#0A192F] truncate">
                                {rec.recommended_model}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                {rec.recommended_provider}
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-emerald-700">
                              Projected ${formatNumber(rec.projected_monthly_cost)}/month
                            </div>
                          </div>
                        </div>

                        {/* Trade-off description */}
                        <div className="text-[11px] text-slate-500 italic border-l-2 border-slate-300 pl-2">
                          {rec.trade_off}
                        </div>

                        {/* Bottom Row: Savings Badge + Quality pill + Apply Rule Button */}
                        <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Save ${formatNumber(rec.monthly_savings)}/mo ({rec.savings_pct.toFixed(0)}%)
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${qualityColor}`}
                            >
                              {qualityLabel}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApplyModelSwapRule(rec)}
                            disabled={createRuleMutation.isPending}
                            className="px-3 py-1 rounded-lg bg-[#0062E0] text-white text-xs font-medium hover:bg-[#0052C2] transition-colors shadow-sm"
                          >
                            Apply Rule
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── SECTION 2: Scaling Recommendations ──────────────────── */}
            <div className="cirra-card p-6 space-y-4">
              <div className="pb-2 border-b border-[#EBF2FA]">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-[#0A192F] text-base">
                    Scaling & Growth Alerts
                  </h3>
                </div>
                <p className="text-xs text-[#475569] mt-0.5">
                  Workload services demonstrating high week-over-week spend acceleration
                </p>
              </div>

              {recsQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : scalingRecs.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#64748B]">
                  No scaling anomalies detected. Growth rates across all infrastructure and AI services are steady.
                </div>
              ) : (
                <div className="space-y-3">
                  {scalingRecs.map((s, idx) => {
                    const isSpike = s.avg_weekly_growth_pct > 20;
                    const growthBadge = isSpike
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : "bg-amber-100 text-amber-800 border-amber-200";

                    const priorityBadge =
                      s.priority === "high"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : s.priority === "medium"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-50 text-slate-700 border-slate-200";

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-[#D6E4F5] bg-white hover:bg-[#F8FAFD] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#0A192F]">
                              {s.provider.toUpperCase()} · {s.service}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${growthBadge}`}
                            >
                              Growing {s.avg_weekly_growth_pct.toFixed(1)}%/week
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityBadge}`}
                            >
                              {s.priority} Priority
                            </span>
                          </div>
                          <p className="text-xs text-[#475569]">{s.recommendation}</p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-bold text-[#0A192F]">
                            ${formatNumber(s.current_weekly_cost)}/week current
                          </div>
                          <div className="text-[11px] font-semibold text-emerald-600">
                            ${formatNumber(s.estimated_monthly_impact)}/month potential reduction
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── SECTION 3: Smart Spend Rules ────────────────────────── */}
            <div className="cirra-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EBF2FA]">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#0062E0]" />
                    <h3 className="font-semibold text-[#0A192F] text-base">Smart Spend Rules</h3>
                  </div>
                  <p className="text-xs text-[#475569] mt-0.5">
                    Automated guardrails — set it and forget it
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunEvaluation}
                  disabled={evaluateRulesMutation.isPending}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {evaluateRulesMutation.isPending ? "Evaluating..." : "Evaluate Now"}
                </button>
              </div>

              {/* Two Column Grid: Templates (Left) & Active Rules (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* Column 1: Rule Templates */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                      Rule Templates
                    </h4>
                    <span className="text-[11px] text-slate-400">Ready to deploy</span>
                  </div>

                  <div className="space-y-3">
                    {ruleTemplates.map((tpl) => (
                      <div
                        key={tpl.condition_type}
                        className="p-3.5 rounded-xl border border-[#D6E4F5] bg-[#F8FAFD] flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-[#0A192F]">{tpl.name}</div>
                          <div className="text-[11px] text-slate-500">{tpl.description}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Default: {tpl.default_value !== null ? `${tpl.default_value} ${tpl.unit}` : "Manual Approval"} · Scope: {tpl.scope}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenAddSmartRuleModal(tpl)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-[#BCD9FC] text-[#0062E0] text-xs font-medium hover:bg-[#EBF3FE] transition-colors flex-shrink-0"
                        >
                          Add Rule
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Active Rules */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                      Active Rules ({smartRules.length})
                    </h4>
                    <span className="text-[11px] text-slate-400">Continuous enforcement</span>
                  </div>

                  {smartRulesQuery.isLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : smartRules.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                      No active smart guardrails. Click &quot;Add Rule&quot; on any template on the left to configure automated limits.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {smartRules.map((rule) => {
                        const isTriggered = rule.last_evaluation_status === "triggered";

                        return (
                          <div
                            key={rule.id}
                            className={`p-3.5 rounded-xl border transition-colors space-y-2 ${
                              isTriggered
                                ? "border-rose-300 bg-rose-50/50"
                                : rule.is_active
                                ? "border-[#D6E4F5] bg-white"
                                : "border-slate-200 bg-slate-50 opacity-60"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className="text-xs font-semibold text-[#0A192F]">
                                  {rule.name}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  Threshold:{" "}
                                  <span className="font-mono font-medium text-slate-700">
                                    {rule.threshold_value !== null ? `${rule.threshold_value} ${rule.unit || ""}` : "Approval required"}
                                  </span>{" "}
                                  · Scope: {rule.scope}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  title={rule.is_active ? "Pause Rule" : "Activate Rule"}
                                  onClick={() =>
                                    toggleSmartRuleMutation.mutate({
                                      id: rule.id,
                                      is_active: !rule.is_active,
                                    })
                                  }
                                  className="p-1 text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                  {rule.is_active ? (
                                    <ToggleRight className="w-5 h-5 text-emerald-600" />
                                  ) : (
                                    <ToggleLeft className="w-5 h-5 text-slate-400" />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  title="Delete Guardrail"
                                  onClick={() => deleteSmartRuleMutation.mutate(rule.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Evaluation Status Badge */}
                            <div className="flex items-start gap-1.5 pt-1 text-[11px]">
                              {isTriggered ? (
                                <div className="text-rose-700 flex items-start gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-rose-600" />
                                  <span>
                                    <strong className="font-semibold">Triggered:</strong>{" "}
                                    {rule.last_evaluation_message || "Threshold exceeded."}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-emerald-700 flex items-start gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-600" />
                                  <span>
                                    <strong className="font-semibold">Not triggered:</strong>{" "}
                                    {rule.last_evaluation_message || "Spend within normal bounds."}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── MODAL: Customize & Create Smart Rule ────────────────────── */}
        {selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#0062E0]" />
                  <h3 className="font-semibold text-sm text-[#0A192F]">Configure Guardrail</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSmartRuleModal} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Guardrail Name
                  </label>
                  <input
                    value={modalRuleName}
                    onChange={(e) => setModalRuleName(e.target.value)}
                    required
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white text-[#0A192F] focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Threshold Value ({selectedTemplate.unit || "unit"})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={modalThreshold}
                    onChange={(e) => setModalThreshold(e.target.value)}
                    placeholder={selectedTemplate.default_value?.toString() ?? "Optional"}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white text-[#0A192F] focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">{selectedTemplate.description}</p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createSmartRuleMutation.isPending}
                    className="px-4 py-1.5 rounded-lg bg-[#0062E0] text-white text-xs font-semibold hover:bg-[#0052C2] shadow-sm transition-colors"
                  >
                    {createSmartRuleMutation.isPending ? "Activating..." : "Activate Guardrail"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
