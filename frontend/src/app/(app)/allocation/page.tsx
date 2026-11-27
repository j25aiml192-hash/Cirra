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

const DEMO_COVERAGE: AllocationCoverage = {
  totalSpend: 127600,
  attributedSpend: 107439,
  unallocatedSpend: 20161,
  coveragePercentage: 84.2,
};

const DEFAULT_COVERAGE: AllocationCoverage = DEMO_COVERAGE;

const DEMO_ALLOCATION_RULES: AllocationRule[] = [
  {
    id: "rule-1",
    priority: 1,
    match_type: "tag",
    match_value: "team:core-platform",
    assign_team: "Core Platform",
    assign_feature: "API Gateway & Edge",
    spendAttributed: 42100,
  },
  {
    id: "rule-2",
    priority: 2,
    match_type: "tag",
    match_value: "workload:ai-agents",
    assign_team: "AI Research Swarm",
    assign_feature: "Autonomous Inference",
    spendAttributed: 31200,
  },
  {
    id: "rule-3",
    priority: 3,
    match_type: "prefix",
    match_value: "db-prod-",
    assign_team: "Data Lake",
    assign_feature: "Storage & Querying",
    spendAttributed: 18400,
  },
  {
    id: "rule-4",
    priority: 4,
    match_type: "service",
    match_value: "Google BigQuery",
    assign_team: "Analytics",
    assign_feature: "Business Intelligence",
    spendAttributed: 15739,
  },
];

const DEMO_SUGGESTIONS: SuggestedRule[] = [
  {
    id: "sug-1",
    pattern: "tag:env=staging",
    suggestedTeam: "QA & Staging",
    confidence: 0.96,
    estimatedSpend: 8200,
  },
  {
    id: "sug-2",
    pattern: "prefix:cloudrun-svc-",
    suggestedTeam: "Core Platform",
    confidence: 0.91,
    estimatedSpend: 5400,
  },
  {
    id: "sug-3",
    pattern: "service:Amazon S3",
    suggestedTeam: "Data Lake",
    confidence: 0.88,
    estimatedSpend: 4200,
  },
];

export default function AllocationPage() {
  const queryClient = useQueryClient();
  const isSmartEnabled = process.env.NEXT_PUBLIC_ENABLE_SMART_ALLOCATION === "true";

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const [suggestions, setSuggestions] = useState<SuggestedRule[]>(DEMO_SUGGESTIONS);
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
        if (!Array.isArray(res) || res.length === 0) return DEMO_ALLOCATION_RULES;
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
        return DEMO_ALLOCATION_RULES;
      }
    },
  });

  const coverageQuery = useQuery<AllocationCoverage>({
    queryKey: ["allocation", "coverage"],
    queryFn: async () => {
      try {
        const res = await apiFetch<any>("/api/v1/allocation/coverage");
        if (!res || Number(res?.coveragePercentage ?? res?.coverage_percentage ?? 0) === 0) return DEMO_COVERAGE;
        return {
          totalSpend: Number(res?.totalSpend ?? res?.total_spend ?? DEMO_COVERAGE.totalSpend),
          attributedSpend: Number(res?.attributedSpend ?? res?.attributed_spend ?? DEMO_COVERAGE.attributedSpend),
          unallocatedSpend: Number(res?.unallocatedSpend ?? res?.unallocated_spend ?? DEMO_COVERAGE.unallocatedSpend),
          coveragePercentage: Number(res?.coveragePercentage ?? res?.coverage_percentage ?? DEMO_COVERAGE.coveragePercentage),
        };
      } catch {
        return DEMO_COVERAGE;
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
    <div className="min-h-screen bg-black text-white">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto select-none">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#09090b] text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-zinc-800 animate-in fade-in slide-in-from-bottom-3 duration-300 font-mono">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span className="text-xs font-medium">{toastMessage}</span>
          </div>
        )}

        {/* ── SECTION 0: Segmented 90-Day Attribution SLA / Coverage Card ── */}
        <div className="bg-[#09090b] border border-zinc-800/80 hover:border-emerald-500/30 transition-colors rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white font-mono text-base tracking-tight">
                Attribution Coverage
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                SLA 99.8% TAGGED
              </span>
            </div>
            <div className="font-mono text-sm font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400">{coveragePct.toFixed(1)}%</span>
              <span className="text-zinc-500 text-xs font-normal">
                ({unallocatedPct}% unallocated)
              </span>
            </div>
          </div>

          {/* Segmented Ticks Container (exact match to 90-day status bar reference) */}
          <div className="py-2">
            <div className="flex items-center gap-[3px] sm:gap-[4px] w-full overflow-hidden">
              {Array.from({ length: 65 }).map((_, idx) => {
                // ~84% attributed emerald, ~14% dimmed unallocated on left, 1 minor anomaly spike (coral)
                const isAnomaly = idx === 18; // Historical unallocated spike
                const isUnallocated = idx < 9; // Unallocated older period
                const isAttributed = !isUnallocated && !isAnomaly;

                return (
                  <div
                    key={idx}
                    title={
                      isAnomaly
                        ? `Day -${65 - idx}: $1,240 untagged spike (anomaly)`
                        : isUnallocated
                        ? `Day -${65 - idx}: Unallocated spend telemetry`
                        : `Day -${65 - idx}: 99.4% spend attributed`
                    }
                    className={`h-7 sm:h-8 flex-1 rounded-[2px] transition-all duration-200 cursor-pointer ${
                      isAnomaly
                        ? "bg-[#ff4d6d] hover:bg-[#ff758f] hover:scale-110 shadow-[0_0_6px_rgba(255,77,109,0.5)]"
                        : isAttributed
                        ? "bg-[#059669] hover:bg-[#10b981] hover:scale-110 shadow-[0_0_4px_rgba(5,150,105,0.3)]"
                        : "bg-[#18181b] hover:bg-[#27272a]"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Bottom Row: 90 days ago · Attributed Metrics · Today */}
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mt-3 pt-2 border-t border-zinc-900">
            <span>90 days ago</span>

            <div className="hidden sm:flex items-center gap-6">
              <span className="flex items-center text-emerald-400 font-medium">
                <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block mr-1.5 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                ${formatNumber(attributedSpend)} attributed
              </span>
              <span className="flex items-center text-zinc-400">
                <span className="w-2 h-2 bg-zinc-600 rounded-full inline-block mr-1.5" />
                ${formatNumber(unallocatedSpend)} unallocated
              </span>
            </div>

            <span className="text-zinc-400 font-medium">Today</span>
          </div>
        </div>

        {/* ── ML Suggestions Card with Grid Background & Ambient Aura ── */}
        {suggestions.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#070b09] p-6 transition-all duration-300 shadow-xl group">
            {/* Ambient Blurred Mesh Aura Gradient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Left vibrant warm yellow/amber glow blob */}
              <div
                className="absolute -top-12 -left-12 w-80 h-72 rounded-full opacity-35 blur-[75px] transition-all group-hover:opacity-45"
                style={{
                  background: "radial-gradient(circle, #facc15 0%, #eab308 50%, transparent 80%)",
                }}
              />
              {/* Center-right vibrant emerald/lime green glow blob */}
              <div
                className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-80 rounded-full opacity-30 blur-[85px] transition-all group-hover:opacity-40"
                style={{
                  background: "radial-gradient(circle, #22c55e 0%, #10b981 45%, #059669 70%, transparent 85%)",
                }}
              />
              {/* Far right warm coral/amber edge aura */}
              <div
                className="absolute -bottom-16 -right-12 w-88 h-80 rounded-full opacity-30 blur-[80px] transition-all group-hover:opacity-40"
                style={{
                  background: "radial-gradient(circle, #f97316 0%, #ea580c 50%, #f43f5e 80%, transparent 90%)",
                }}
              />

              {/* Precise Vector Grid Pattern (24px x 24px) */}
              <div
                className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: "24px 24px",
                }}
              />

              {/* Translucent vignette for high contrast readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70 backdrop-blur-[1px]" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 font-mono">
                    SUGGESTED RULES (ML DISCOVERED)
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-semibold">
                  {suggestions.length} suggestions ready
                </span>
              </div>

              <div className="space-y-3">
                {suggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="bg-black/60 backdrop-blur-md rounded-xl p-3.5 border border-white/10 flex items-center justify-between gap-4 hover:border-emerald-400/40 hover:bg-black/75 transition-all shadow-sm"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white font-mono flex items-center gap-2">
                        <span>{sug.pattern}</span>
                      </div>
                      <div className="text-[11px] text-zinc-300 mt-1 font-mono">
                        Suggested Team:{" "}
                        <span className="font-semibold text-white">{sug.suggestedTeam}</span> ·{" "}
                        Confidence:{" "}
                        <span className="font-medium text-emerald-300">
                          {(sug.confidence * 100).toFixed(0)}%
                        </span>{" "}
                        · Attributed spend:{" "}
                        <span className="font-semibold text-emerald-200">
                          ${formatNumber(sug.estimatedSpend)}/mo
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleConfirmSuggestion(sug)}
                        disabled={createRuleMutation.isPending}
                        className="px-4 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold flex items-center gap-1.5 transition-all font-mono cursor-pointer shadow-[0_0_14px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
                      >
                        <Check className="w-3.5 h-3.5 text-black stroke-[3]" /> Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismissSuggestion(sug.id)}
                        className="px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-700/80 text-zinc-300 text-xs font-medium hover:text-white hover:bg-zinc-800 transition-colors font-mono cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Rules Table Card (Existing Allocation Rules CRUD) ──────── */}
        <div className="bg-[#09090b] border border-zinc-800/80 hover:border-emerald-500/30 transition-colors rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white text-base font-mono">Allocation Rules Hierarchy</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Rules are evaluated sequentially from top to bottom
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors font-mono cursor-pointer shadow-[0_0_10px_rgba(5,150,105,0.35)]"
            >
              <Plus className="w-3.5 h-3.5 text-white" /> Add Rule
            </button>
          </div>

          {/* Inline Add Rule Form */}
          {isAdding && (
            <form
              onSubmit={handleCreateRule}
              className="mb-4 p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-3 font-mono"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Match Type
                  </label>
                  <select
                    value={newMatchType}
                    onChange={(e) =>
                      setNewMatchType(
                        e.target.value as "tag" | "prefix" | "regex" | "service"
                      )
                    }
                    className="w-full h-8 px-2 text-xs rounded-lg border border-zinc-800 bg-[#09090b] text-white"
                  >
                    <option value="tag">tag</option>
                    <option value="prefix">prefix</option>
                    <option value="regex">regex</option>
                    <option value="service">service</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Match Value
                  </label>
                  <input
                    value={newMatchValue}
                    onChange={(e) => setNewMatchValue(e.target.value)}
                    placeholder="e.g. env=prod"
                    required
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-zinc-800 bg-[#09090b] text-white placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Assign Team
                  </label>
                  <input
                    value={newAssignTeam}
                    onChange={(e) => setNewAssignTeam(e.target.value)}
                    placeholder="e.g. Core Platform"
                    required
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-zinc-800 bg-[#09090b] text-white placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Feature (Optional)
                  </label>
                  <input
                    value={newAssignFeature}
                    onChange={(e) => setNewAssignFeature(e.target.value)}
                    placeholder="e.g. Storage"
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-zinc-800 bg-[#09090b] text-white placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRuleMutation.isPending}
                  className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
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
                    <Skeleton className="w-4 h-4 bg-zinc-800" />
                    <Skeleton className="w-6 h-4 bg-zinc-800" />
                    <Skeleton className="w-12 h-5 rounded bg-zinc-800" />
                    <Skeleton className="w-32 h-5 rounded bg-zinc-800" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-24 h-5 rounded-full bg-zinc-800" />
                    <Skeleton className="w-16 h-4 bg-zinc-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : rules.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400 font-mono">
              No allocation rules defined yet. Click &quot;Add Rule&quot; to configure your first rule.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="py-3 px-2 flex items-center justify-between hover:bg-zinc-900/40 rounded-lg group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab opacity-40 group-hover:opacity-100" />
                    <span className="text-xs font-mono font-bold text-zinc-400 w-6">
                      #{rule.priority}
                    </span>
                    <Badge
                      variant={rule.match_type === "tag" ? "indigo" : "neutral"}
                      className="uppercase text-[10px]"
                    >
                      {rule.match_type}
                    </Badge>
                    <code className="text-xs font-mono font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                      {rule.match_value}
                    </code>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-200 border border-zinc-800 font-mono">
                        {rule.assign_team}
                      </span>
                      {rule.assign_feature && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-850 text-zinc-400 font-mono">
                          {rule.assign_feature}
                        </span>
                      )}
                      {Boolean(rule.spendAttributed) && (
                        <span className="text-xs font-mono text-zinc-400 ml-2">
                          ${formatNumber(rule.spendAttributed ?? 0)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={deleteRuleMutation.isPending}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
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
          <div className="bg-[#09090b] p-8 border border-dashed border-zinc-800 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-zinc-400 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-300 uppercase tracking-wider inline-block mb-2 font-mono border border-zinc-800">
                Smart Allocation — Enable in settings
              </span>
              <h3 className="text-base font-semibold text-white font-mono">
                Automated Allocation & Optimization Intelligence
              </h3>
              <p className="text-xs text-zinc-400 mt-1 font-sans">
                Unlock model swap recommendations, growth scaling alerts, and automated budget guardrails by setting{" "}
                <code className="text-white bg-zinc-900 px-1 py-0.5 rounded font-mono border border-zinc-800">ENABLE_SMART_ALLOCATION=true</code>.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── SECTION 1: Model Swap Recommendations ───────────────── */}
            <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-white" />
                    <h3 className="font-semibold text-white text-base font-mono">
                      Model Optimization Opportunities
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Switch to cheaper models without sacrificing quality
                  </p>
                </div>

                {totalSavings > 0 && (
                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-white px-3 py-1.5 rounded-full text-xs font-semibold font-mono">
                    <TrendingUp className="w-4 h-4 text-white" />
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
                            className={`p-3.5 rounded-xl border transition-colors space-y-2 ${isTriggered
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
