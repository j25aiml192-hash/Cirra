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
  MoreHorizontal,
  FileText,
  Lightbulb,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProviderLogo } from "@/components/ui/provider-logos";
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
  const [menuOpenRuleId, setMenuOpenRuleId] = useState<string | null>(null);

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

  // Real brand logo resolver for Allocation Rules (AWS, GCP, OpenAI, Supabase, Kubernetes, Azure)
  const getRuleLogo = (rule: AllocationRule) => {
    const match = (rule.match_value || "").toLowerCase();
    const team = (rule.assign_team || "").toLowerCase();
    const feature = (rule.assign_feature || "").toLowerCase();
    const all = `${match} ${team} ${feature}`;

    if (all.includes("aws") || all.includes("core-platform") || all.includes("ec2") || all.includes("s3") || all.includes("lambda")) {
      return <ProviderLogo provider="aws" size={18} />;
    }
    if (all.includes("gcp") || all.includes("google") || all.includes("bigquery") || all.includes("gke")) {
      return <ProviderLogo provider="gcp" size={18} />;
    }
    if (all.includes("ai") || all.includes("openai") || all.includes("gpt") || all.includes("agent") || all.includes("swarm")) {
      return <ProviderLogo provider="openai" size={18} />;
    }
    if (all.includes("anthropic") || all.includes("claude")) {
      return <ProviderLogo provider="anthropic" size={18} />;
    }
    if (all.includes("db") || all.includes("database") || all.includes("postgres") || all.includes("sql") || all.includes("data lake")) {
      return <ProviderLogo provider="supabase" size={18} />;
    }
    if (all.includes("groq") || all.includes("lpu")) {
      return <ProviderLogo provider="groq" size={18} />;
    }
    if (all.includes("k8s") || all.includes("kubernetes")) {
      return <ProviderLogo provider="kubernetes" size={18} />;
    }
    if (all.includes("azure")) {
      return <ProviderLogo provider="azure" size={18} />;
    }
    return <ProviderLogo provider="aws" size={18} />;
  };

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

        {/* ── 2-COLUMN SIDE-BY-SIDE LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* ════ LEFT COLUMN (lg:col-span-7): Coverage, Rules Hierarchy & Smart Lock ════ */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            {/* ── SECTION 0: Attribution Coverage Timeline — connected to page content ── */}
            <div className="bg-[#0b0c10]/95 backdrop-blur-xl border border-zinc-800/80 hover:border-zinc-700/90 transition-all duration-300 rounded-2xl p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_0_rgba(255,255,255,0.1)] space-y-5">

              {/* Header: meaningful name + live metrics */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-zinc-800/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white font-mono text-base tracking-tight">
                      Attribution Coverage
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 text-[11px] font-mono font-bold">
                      <span>↗</span>
                      <span>+5.2%</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-700 text-zinc-400">
                      SLA 99.4%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans">
                    Monthly attributed vs unallocated spend — Jan through Jun 2025
                  </p>
                </div>
                <div className="font-mono text-right shrink-0">
                  <div className="text-2xl font-black text-white tracking-tight">{coveragePct.toFixed(1)}%</div>
                  <div className="text-[11px] text-zinc-500 font-normal">{unallocatedPct}% unallocated</div>
                </div>
              </div>

              {/* Stacked area coverage chart — attributed (blue) vs unallocated (zinc) */}
              <div className="w-full">
                <svg className="w-full h-40" viewBox="0 0 460 148" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="attrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.08" />
                    </linearGradient>
                    <linearGradient id="unallocGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#52525b" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#27272a" stopOpacity="0.05" />
                    </linearGradient>
                    <pattern id="hatch" width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="5" stroke="#3b82f6" strokeWidth="1.2" strokeOpacity="0.4" />
                    </pattern>
                  </defs>

                  {/* Y-axis grid lines */}
                  {[25, 50, 75, 100].map((pct) => {
                    const y = 118 - (pct / 100) * 110;
                    return (
                      <g key={pct}>
                        <line x1="8" y1={y} x2="452" y2={y} stroke="#27272a" strokeWidth="0.75" strokeDasharray="3 4" />
                        <text x="6" y={y + 3.5} fill="#52525b" fontSize="8" fontFamily="monospace" textAnchor="end">{pct}</text>
                      </g>
                    );
                  })}

                  {/* Attributed spend area — full height bars with fill + hatch overlay */}
                  {[
                    { x: 14, attr: 78, total: 100 },
                    { x: 45, attr: 83, total: 100 },
                    { x: 76, attr: 80, total: 100 },
                    { x: 107, attr: 82, total: 100 },
                    { x: 138, attr: 79, total: 100 },
                    { x: 169, attr: 84, total: 100 },
                    { x: 200, attr: 86, total: 100 },
                    { x: 231, attr: 85, total: 100 },
                    { x: 262, attr: 83, total: 100 },
                    { x: 293, attr: 84, total: 100 },
                    { x: 324, attr: 87, total: 100 },
                    { x: 355, attr: 85, total: 100 },
                    { x: 386, attr: 84, total: 100 },
                    { x: 417, attr: 84, total: 100 },
                  ].map((bar, i) => {
                    const totalH = Math.round((bar.total / 100) * 110);
                    const attrH = Math.round((bar.attr / 100) * 110);
                    const unallocH = totalH - attrH;
                    return (
                      <g key={i} className="group cursor-pointer">
                        {/* Unallocated segment — top (zinc) */}
                        <rect x={bar.x} y={118 - totalH} width={18} height={unallocH} rx={2} fill="#3f3f46" fillOpacity={0.6} />
                        {/* Attributed segment — bottom (blue gradient + hatch) */}
                        <rect x={bar.x} y={118 - attrH} width={18} height={attrH} rx={2} fill="url(#attrGrad)" />
                        <rect x={bar.x} y={118 - attrH} width={18} height={attrH} rx={2} fill="url(#hatch)" />
                        {/* Hover glow border */}
                        <rect
                          x={bar.x} y={118 - totalH} width={18} height={totalH} rx={2}
                          fill="transparent" stroke="#3b82f6" strokeWidth={0}
                          className="group-hover:stroke-blue-400/60 group-hover:[stroke-width:1.5] transition-all"
                        />
                      </g>
                    );
                  })}

                  {/* Baseline */}
                  <line x1="8" y1="118" x2="452" y2="118" stroke="#27272a" strokeWidth="1" />

                  {/* Month labels */}
                  <text x="23" y="134" fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="middle">Jan</text>
                  <text x="85" y="134" fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="middle">Feb</text>
                  <text x="147" y="134" fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="middle">Mar</text>
                  <text x="209" y="134" fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="middle">Apr</text>
                  <text x="271" y="134" fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="middle">May</text>
                  <text x="333" y="134" fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="middle">Jun</text>
                  <text x="395" y="134" fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="middle">Jul</text>
                </svg>
              </div>

              {/* Bottom legend + SLA */}
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pt-1 border-t border-zinc-900">
                <div className="flex items-center gap-5">
                  <span className="flex items-center gap-1.5 text-zinc-200 font-medium">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block shadow-[0_0_6px_rgba(59,130,246,0.7)]" />
                    ${formatNumber(attributedSpend)} attributed
                  </span>
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-zinc-600 inline-block" />
                    ${formatNumber(unallocatedSpend)} unallocated
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-semibold">↑ Trending +5.2% coverage this quarter</span>
                </div>
              </div>
            </div>

            {/* ── Rules Table Card (Allocation Rules Hierarchy - Floating) ──────── */}
            <div className="bg-[#0b0c10]/95 backdrop-blur-xl border border-zinc-800/80 hover:border-zinc-700/90 transition-all duration-300 rounded-2xl p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
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
                  className="group relative px-4 py-1.5 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center gap-1.5 text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer"
                >
                  <div className="absolute top-0 inset-x-1.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                  <Plus className="w-3.5 h-3.5 text-emerald-400 relative z-10" />
                  <span className="relative z-10">Add Rule</span>
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
                <div className="space-y-2.5 sm:space-y-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="bg-[#0c0d10] hover:bg-[#111317] border border-zinc-800/90 hover:border-zinc-700/80 rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-4 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Real provider / platform logo matching reference */}
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                          {getRuleLogo(rule)}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          {/* Top Line: Bold Title */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-white font-mono truncate">
                              {rule.match_value}
                            </span>
                            <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                              {rule.match_type}
                            </span>
                            <span className="text-xs font-mono font-medium text-zinc-500">
                              #{rule.priority}
                            </span>
                          </div>

                          {/* Bottom Line: Subtitle metadata with dot separators matching reference */}
                          <div className="text-xs text-zinc-400 font-mono flex items-center gap-2 flex-wrap">
                            <span className="text-zinc-300">{rule.assign_team}</span>
                            {rule.assign_feature && (
                              <>
                                <span className="text-zinc-600">·</span>
                                <span className="text-zinc-400">{rule.assign_feature}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side: Spend & More Options (...) */}
                      <div className="flex items-center gap-3 shrink-0">
                        {Boolean(rule.spendAttributed) && (
                          <span className="text-xs font-mono font-semibold text-zinc-300 hidden sm:inline-block">
                            ${formatNumber(rule.spendAttributed ?? 0)}
                          </span>
                        )}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuOpenRuleId(menuOpenRuleId === rule.id ? null : rule.id)
                            }
                            title="More options"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>

                          {menuOpenRuleId === rule.id && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-30 font-mono animate-in fade-in zoom-in-95 duration-150">
                              <button
                                type="button"
                                onClick={() => {
                                  handleDeleteRule(rule.id);
                                  setMenuOpenRuleId(null);
                                }}
                                disabled={deleteRuleMutation.isPending}
                                className="w-full px-3 py-1.5 text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-zinc-800 flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── SMART ALLOCATION GATE (Floating Lock) ─────────────────────────── */}
            {!isSmartEnabled ? (
              <div className="bg-[#0b0c10]/95 backdrop-blur-xl p-8 border border-dashed border-zinc-800/90 hover:border-zinc-700 transition-all duration-300 rounded-2xl text-center space-y-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
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
          </div>

          {/* ════ RIGHT COLUMN (lg:col-span-5): ML Discovered Suggestions ════ */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            {/* Page Header (Right Side Only) */}
            <div className="space-y-1.5 pb-3 border-b border-zinc-800/80">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                Cost Allocation Engine
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
                Unit Economics & Attribution.
              </h2>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Map unallocated cloud & AI infrastructure spend directly to engineering teams, features, and business units with continuous ML heuristics.
              </p>
            </div>

            {/* Suggestions Section */}
            <div className="space-y-4">
              {/* Clean Heading of Suggestions */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-[#f6f3eb] via-[#efebe3] to-[#e4e0d8] border border-[#ded8cb] flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.9)]">
                    <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]" />
                  </div>
                  <h3 className="text-base font-semibold text-white font-mono tracking-tight">
                    Suggestions
                  </h3>
                </div>
              </div>

              {suggestions.length === 0 ? (
                <div className="py-8 text-center space-y-2 font-mono">
                  <div className="w-9 h-9 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="text-xs font-bold text-white">All Suggestions Evaluated</div>
                  <p className="text-[11px] text-zinc-400 max-w-xs mx-auto font-sans">
                    Cirra&apos;s continuous discovery engine is monitoring spend streams for new allocation patterns.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((sug) => (
                    <div
                      key={sug.id}
                      className="bg-[#0f1014] rounded-2xl p-4 sm:p-5 border border-zinc-800/80 hover:border-zinc-700 shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] space-y-3.5 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono font-bold text-zinc-100 bg-zinc-900 border border-zinc-700/80 px-2.5 py-1 rounded-lg truncate max-w-[220px] shadow-inner">
                          {sug.pattern}
                        </code>
                        <span className="text-xs font-bold font-mono text-emerald-400 shrink-0">
                          ${formatNumber(sug.estimatedSpend)}/mo
                        </span>
                      </div>

                      <div className="text-[11px] font-mono space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Suggested Team:</span>
                          <span className="font-semibold text-zinc-200">{sug.suggestedTeam}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Confidence:</span>
                          <span className="font-semibold text-emerald-400">
                            {(sug.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                        <button
                          type="button"
                          onClick={() => handleConfirmSuggestion(sug)}
                          disabled={createRuleMutation.isPending}
                          className="group relative flex-1 py-1.5 rounded-full overflow-hidden text-xs font-mono font-bold transition-all duration-300 flex items-center justify-center gap-1.5 text-white border border-white/25 bg-white/[0.14] hover:bg-white/[0.22] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] active:scale-[0.98] cursor-pointer whitespace-nowrap"
                        >
                          <div className="absolute top-0 inset-x-1.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                          <Check className="w-3.5 h-3.5 stroke-[3] shrink-0 relative z-10 text-white" />
                          <span className="relative z-10">Confirm</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissSuggestion(sug.id)}
                          className="group relative px-4 py-1.5 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center justify-center gap-1.5 text-zinc-300 hover:text-white border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <div className="absolute top-0 inset-x-1.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                          <X className="w-3.5 h-3.5 shrink-0 relative z-10" />
                          <span className="relative z-10">Dismiss</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>{/* ── end 2-COLUMN GRID ── */}

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
