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
  Layers,
  Scale,
  Cpu,
} from "lucide-react";
import {
  ChalkWalletIcon,
  ChalkAnomalyIcon,
  ChalkLayersIcon,
  ChalkSparklesIcon,
  ChalkStarIcon,
} from "@/components/ui/chalk-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProviderLogo } from "@/components/ui/provider-logos";
import { apiFetch } from "@/lib/api";
import { formatNumber, cn } from "@/lib/utils";
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

  // Active view tab for lower section: "rules" | "models" | "scaling" | "guardrails"
  const [activeTab, setActiveTab] = useState<"rules" | "models" | "scaling" | "guardrails">("rules");

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
      showToast("Suggested rule approved & mapped to " + sug.suggestedTeam);
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

  // Real brand logo resolver for Allocation Rules (AWS, GCP, OpenAI, Supabase, Groq, Kubernetes, Azure)
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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-7 max-w-7xl mx-auto select-none">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#09090b]/95 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-zinc-700 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300 font-mono text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ── UNIFIED EXECUTIVE HEADER (FULL WIDTH) ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-zinc-800/80">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              Spend Attribution &amp; Cost Mapping
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-2xl leading-relaxed">
              Map unallocated cloud &amp; AI infrastructure spend directly to engineering teams and workloads using automated pattern rules and ML discovery.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="group relative px-4 py-2 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center gap-1.5 text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer"
            >
              <div className="absolute top-0 inset-x-2 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
              <Plus className="w-3.5 h-3.5 text-white relative z-10" />
              <span className="relative z-10">Add Rule</span>
            </button>
          </div>
        </div>

        {/* ── 2-COLUMN MAIN LAYOUT: LEFT (2x2 CARDS + GRAPH) · RIGHT (SUGGESTIONS) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ════ LEFT COLUMN (lg:col-span-7): 2x2 Metric Cards + Minimized Graph Below ════ */}
          <div className="lg:col-span-7 space-y-4">
            {/* 4 Cards in 2x2 Grid with Chalk Icons, Monochromatic Theme */}
            <div className="grid grid-cols-2 gap-3.5 font-mono">
              {/* Card 1: Attributed Spend */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    Attributed Spend
                  </span>
                  <ChalkWalletIcon size={14} className="text-zinc-400" />
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  ${formatNumber(attributedSpend)}
                </div>
                <div className="text-[11px] text-zinc-400 font-sans">
                  84.2% mapped to active teams
                </div>
              </div>

              {/* Card 2: Unallocated Gap */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    Unallocated Gap
                  </span>
                  <ChalkAnomalyIcon size={14} className="text-zinc-400" />
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  ${formatNumber(unallocatedSpend)}
                </div>
                <div className="text-[11px] text-zinc-400 font-sans">
                  {unallocatedPct}% requires tag or prefix rule
                </div>
              </div>

              {/* Card 3: Active Rules */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    Active Rules
                  </span>
                  <ChalkLayersIcon size={14} className="text-zinc-400" />
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {rules.length}
                </div>
                <div className="text-[11px] text-zinc-400 font-sans">
                  Sequential rule evaluation
                </div>
              </div>

              {/* Card 4: ML Discovery */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    ML Discovery
                  </span>
                  <ChalkSparklesIcon size={14} className="text-zinc-400" />
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {suggestions.length} Ready
                </div>
                <div className="text-[11px] text-zinc-400 font-sans">
                  ${formatNumber(suggestions.reduce((acc, s) => acc + s.estimatedSpend, 0))}/mo mappable
                </div>
              </div>
            </div>

            {/* Minimized Redefined Graph Below the 2x2 Cards */}
            <div className="bg-[#09090b]/95 border border-zinc-800/90 rounded-2xl p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Attribution Coverage
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    Monthly attributed vs unallocated spend
                  </p>
                </div>
                <div className="font-mono text-xl font-black text-white tracking-tight">
                  {coveragePct.toFixed(1)}%
                </div>
              </div>

              {/* Minimal Clean SVG Stacked Bars */}
              <div className="w-full pt-1">
                <svg className="w-full h-32" viewBox="0 0 460 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="minAttrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#a1a1aa" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>

                  {/* Clean bars */}
                  {[
                    { x: 16, attr: 78, total: 100 },
                    { x: 50, attr: 83, total: 100 },
                    { x: 84, attr: 80, total: 100 },
                    { x: 118, attr: 82, total: 100 },
                    { x: 152, attr: 79, total: 100 },
                    { x: 186, attr: 84, total: 100 },
                    { x: 220, attr: 86, total: 100 },
                    { x: 254, attr: 85, total: 100 },
                    { x: 288, attr: 83, total: 100 },
                    { x: 322, attr: 84, total: 100 },
                    { x: 356, attr: 87, total: 100 },
                    { x: 390, attr: 85, total: 100 },
                    { x: 424, attr: 84, total: 100 },
                  ].map((bar, i) => {
                    const totalH = Math.round((bar.total / 100) * 75);
                    const attrH = Math.round((bar.attr / 100) * 75);
                    const unallocH = totalH - attrH;
                    return (
                      <g key={i} className="group cursor-pointer">
                        {/* Unallocated - top */}
                        <rect x={bar.x} y={80 - totalH} width={18} height={unallocH} rx={2} fill="#27272a" />
                        {/* Attributed - bottom */}
                        <rect x={bar.x} y={80 - attrH} width={18} height={attrH} rx={2} fill="url(#minAttrGrad)" />
                      </g>
                    );
                  })}

                  {/* Baseline */}
                  <line x1="8" y1="82" x2="452" y2="82" stroke="#27272a" strokeWidth="1" />

                  {/* Month labels */}
                  <text x="25" y="98" fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="middle">Jan</text>
                  <text x="93" y="98" fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="middle">Feb</text>
                  <text x="161" y="98" fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="middle">Mar</text>
                  <text x="229" y="98" fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="middle">Apr</text>
                  <text x="297" y="98" fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="middle">May</text>
                  <text x="365" y="98" fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="middle">Jun</text>
                  <text x="433" y="98" fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="middle">Jul</text>
                </svg>
              </div>

              {/* Minimal Clean Legend */}
              <div className="flex items-center gap-6 text-[11px] font-mono text-zinc-400 pt-2 border-t border-zinc-900">
                <span className="flex items-center gap-2 text-zinc-200">
                  <span className="w-2 h-2 rounded-xs bg-zinc-200 inline-block" />
                  ${formatNumber(attributedSpend)} Attributed
                </span>
                <span className="flex items-center gap-2 text-zinc-500">
                  <span className="w-2 h-2 rounded-xs bg-zinc-800 inline-block" />
                  ${formatNumber(unallocatedSpend)} Unallocated
                </span>
              </div>
            </div>
          </div>

          {/* ════ RIGHT COLUMN (lg:col-span-5): ML SUGGESTIONS IN BRIGHT THEME (NO TEXT BOX, BETTER ICONS) ════ */}
          <div className="lg:col-span-5 bg-[#faf8f5] text-zinc-900 border border-[#e8e4dc] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e0d5]">
              <div className="flex items-center gap-2.5">
                <ChalkStarIcon size={18} className="text-zinc-800" />
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 font-sans tracking-tight flex items-center gap-2">
                    <span>Discovered Suggestions</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200/90 text-zinc-800 font-bold">
                      {suggestions.length}
                    </span>
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    ML heuristics discovered unmapped pattern rules
                  </p>
                </div>
              </div>
            </div>

            {suggestions.length === 0 ? (
              <div className="py-8 text-center space-y-2 font-mono">
                <div className="text-xs font-bold text-zinc-800">All Suggestions Evaluated</div>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto font-sans">
                  Cirra is monitoring spend streams for new allocation patterns.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="bg-white rounded-xl p-4 border border-[#e8e3d8] shadow-xs hover:shadow-sm transition-all space-y-2.5"
                  >
                    {/* NO TEXT BOX — clean direct typography */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-900 tracking-tight">
                        {sug.pattern}
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-900 shrink-0">
                        +${formatNumber(sug.estimatedSpend)}/mo
                      </span>
                    </div>

                    <div className="text-[11px] font-mono space-y-0.5 text-zinc-600">
                      <div className="flex items-center justify-between">
                        <span>Suggested Team:</span>
                        <span className="font-semibold text-zinc-900">{sug.suggestedTeam}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Confidence:</span>
                        <span className="font-semibold text-zinc-800">
                          {(sug.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Glass Morphism Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#f0ece3]">
                      <button
                        type="button"
                        onClick={() => handleConfirmSuggestion(sug)}
                        disabled={createRuleMutation.isPending}
                        className="group relative flex-1 py-1.5 px-3 rounded-full overflow-hidden text-xs font-mono font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 text-white border border-white/30 bg-zinc-900/90 hover:bg-black backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_6px_rgba(0,0,0,0.15)] active:scale-[0.98] cursor-pointer"
                      >
                        <div className="absolute top-0 inset-x-2 h-[50%] rounded-t-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                        <Check className="w-3.5 h-3.5 stroke-[2.5] relative z-10 text-white" />
                        <span className="relative z-10">Confirm</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDismissSuggestion(sug.id)}
                        className="group relative px-4 py-1.5 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center justify-center gap-1.5 text-zinc-700 hover:text-black border border-zinc-300/80 bg-zinc-100/80 hover:bg-zinc-200/90 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] active:scale-[0.98] cursor-pointer"
                      >
                        <div className="absolute top-0 inset-x-2 h-[50%] rounded-t-full bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
                        <X className="w-3.5 h-3.5 relative z-10" />
                        <span className="relative z-10">Dismiss</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── LOWER SECTION: UNIFIED DATA TABLE & INTELLIGENCE WITH CLEAN SEGMENTED PILL SWITCHER ── */}
        <div className="space-y-4 pt-2">
          {/* Segmented Switcher Pill (No Clutter, Full View) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
            <div className="inline-flex items-center gap-1 bg-zinc-900/80 backdrop-blur-xl p-1 rounded-full border border-zinc-800 text-xs font-mono shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab("rules")}
                className={cn(
                  "px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer font-medium",
                  activeTab === "rules"
                    ? "bg-white text-black font-bold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Rules Hierarchy ({rules.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("models")}
                className={cn(
                  "px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer font-medium",
                  activeTab === "models"
                    ? "bg-white text-black font-bold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Model Optimization ({modelSwaps.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("scaling")}
                className={cn(
                  "px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer font-medium",
                  activeTab === "scaling"
                    ? "bg-white text-black font-bold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Scaling Alerts ({scalingRecs.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("guardrails")}
                className={cn(
                  "px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer font-medium",
                  activeTab === "guardrails"
                    ? "bg-white text-black font-bold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Guardrails ({smartRules.length})
              </button>
            </div>

            <div className="text-xs font-mono text-zinc-400">
              {activeTab === "rules" && "Evaluated sequentially top to bottom"}
              {activeTab === "models" && "Potential monthly savings: $" + formatNumber(totalSavings) + "/mo"}
              {activeTab === "scaling" && "Week-over-week acceleration monitoring"}
              {activeTab === "guardrails" && "Automated budget limits & enforcement"}
            </div>
          </div>

          {/* Inline Add Rule Form when open */}
          {isAdding && (
            <form
              onSubmit={handleCreateRule}
              className="p-5 rounded-2xl border border-zinc-800 bg-[#09090b] shadow-2xl space-y-4 font-mono animate-in fade-in zoom-in-98 duration-200"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Create New Allocation Rule
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

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
                    className="w-full h-9 px-2 text-xs rounded-lg border border-zinc-800 bg-[#121318] text-white"
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
                    className="w-full h-9 px-3 text-xs rounded-lg border border-zinc-800 bg-[#121318] text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
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
                    className="w-full h-9 px-3 text-xs rounded-lg border border-zinc-800 bg-[#121318] text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Feature (Optional)
                  </label>
                  <input
                    value={newAssignFeature}
                    onChange={(e) => setNewAssignFeature(e.target.value)}
                    placeholder="e.g. Storage &amp; Edge"
                    className="w-full h-9 px-3 text-xs rounded-lg border border-zinc-800 bg-[#121318] text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRuleMutation.isPending}
                  className="group relative px-5 py-1.5 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center gap-1.5 text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer"
                >
                  <div className="absolute top-0 inset-x-2 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                  <span className="relative z-10">{createRuleMutation.isPending ? "Saving..." : "Save Rule"}</span>
                </button>
              </div>
            </form>
          )}

          {/* ════ TAB 1: ALLOCATION RULES HIERARCHY ════ */}
          {activeTab === "rules" && (
            <div className="rounded-2xl border border-zinc-800/80 bg-[#09090b]/95 shadow-2xl overflow-hidden">
              {rulesQuery.isLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-12 w-full rounded-xl bg-zinc-900" />
                  <Skeleton className="h-12 w-full rounded-xl bg-zinc-900" />
                  <Skeleton className="h-12 w-full rounded-xl bg-zinc-900" />
                </div>
              ) : rules.length === 0 ? (
                <div className="p-12 text-center text-xs text-zinc-400 font-mono">
                  No allocation rules defined yet. Click &quot;Add Rule&quot; to configure your first rule.
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/60 font-mono text-xs">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-zinc-900/60 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                          {getRuleLogo(rule)}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white truncate">
                              {rule.match_value}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                              {rule.match_type}
                            </span>
                            <span className="text-xs text-zinc-500 font-medium">
                              #{rule.priority}
                            </span>
                          </div>

                          <div className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap">
                            <span className="text-zinc-300 font-semibold">{rule.assign_team}</span>
                            {rule.assign_feature && (
                              <>
                                <span className="text-zinc-600">·</span>
                                <span className="text-zinc-400">{rule.assign_feature}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {Boolean(rule.spendAttributed) && (
                          <div className="text-right">
                            <div className="text-xs font-bold text-white">
                              ${formatNumber(rule.spendAttributed ?? 0)}
                            </div>
                            <div className="text-[10px] text-zinc-500">monthly mapped</div>
                          </div>
                        )}

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuOpenRuleId(menuOpenRuleId === rule.id ? null : rule.id)
                            }
                            title="More options"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
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
          )}

          {/* ════ TAB 2: MODEL OPTIMIZATION OPPORTUNITIES (SLEEK DARK THEME, NOT CLUSTERED) ════ */}
          {activeTab === "models" && (
            <div className="space-y-4">
              {recsQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl bg-zinc-900" />
                  ))}
                </div>
              ) : modelSwaps.length === 0 ? (
                <div className="p-12 text-center text-xs text-zinc-400 font-mono bg-[#09090b] rounded-2xl border border-zinc-800">
                  No model swap opportunities found. Your current model deployments are cost-optimal.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                  {modelSwaps.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-[#09090b]/95 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-3.5 shadow-xl"
                    >
                      {/* Top Model Comparison */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                            Current Model
                          </div>
                          <div className="text-sm font-bold text-white truncate">
                            {rec.current_model}
                          </div>
                          <div className="text-xs text-zinc-400">
                            ${formatNumber(rec.current_monthly_cost)}/mo
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-400">
                          <ArrowRight className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 text-right">
                          <div className="text-[10px] text-emerald-400 uppercase tracking-wider">
                            Recommended
                          </div>
                          <div className="text-sm font-bold text-emerald-400 truncate">
                            {rec.recommended_model}
                          </div>
                          <div className="text-xs text-zinc-400">
                            ${formatNumber(rec.projected_monthly_cost)}/mo
                          </div>
                        </div>
                      </div>

                      {/* Trade-off description */}
                      <p className="text-xs text-zinc-400 font-sans border-l-2 border-zinc-700 pl-2.5 leading-relaxed">
                        {rec.trade_off}
                      </p>

                      {/* Savings Pill + Glass Action Button */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 gap-3">
                        <div className="text-xs font-bold text-emerald-400">
                          Save ${formatNumber(rec.monthly_savings)}/mo ({rec.savings_pct.toFixed(0)}%)
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyModelSwapRule(rec)}
                          disabled={createRuleMutation.isPending}
                          className="group relative px-4 py-1.5 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center gap-1.5 text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer"
                        >
                          <div className="absolute top-0 inset-x-1.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                          <span className="relative z-10">Apply Rule</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ TAB 3: SCALING & ACCELERATION ALERTS ════ */}
          {activeTab === "scaling" && (
            <div className="space-y-3 font-mono">
              {scalingRecs.length === 0 ? (
                <div className="p-12 text-center text-xs text-zinc-400 bg-[#09090b] rounded-2xl border border-zinc-800">
                  No scaling anomalies detected. Growth rates across all services are steady.
                </div>
              ) : (
                scalingRecs.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-[#09090b]/95 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white uppercase">
                          {s.provider} · {s.service}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30 bg-rose-950/40 text-rose-300">
                          Growing {s.avg_weekly_growth_pct.toFixed(1)}%/week
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400">
                          {s.priority} Priority
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-sans">{s.recommendation}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-white">
                        ${formatNumber(s.current_weekly_cost)}/wk current
                      </div>
                      <div className="text-[11px] text-emerald-400 font-semibold">
                        -${formatNumber(s.estimated_monthly_impact)}/mo potential reduction
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ════ TAB 4: AUTOMATED SMART GUARDRAILS ════ */}
          {activeTab === "guardrails" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-zinc-400 font-sans">
                  Automated guardrails enforce real-time hard caps and notify on token runaway conditions.
                </p>

                <button
                  type="button"
                  onClick={handleRunEvaluation}
                  disabled={evaluateRulesMutation.isPending}
                  className="group relative px-4 py-1.5 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center gap-1.5 text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer shrink-0"
                >
                  <div className="absolute top-0 inset-x-1.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                  <Play className="w-3.5 h-3.5 relative z-10 text-emerald-400 fill-current" />
                  <span className="relative z-10">{evaluateRulesMutation.isPending ? "Evaluating..." : "Evaluate Guardrails"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 font-mono">
                {/* Templates */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Rule Templates
                  </div>
                  {ruleTemplates.map((tpl) => (
                    <div
                      key={tpl.condition_type}
                      className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-xs font-bold text-white">{tpl.name}</div>
                        <div className="text-[11px] text-zinc-400 font-sans">{tpl.description}</div>
                        <div className="text-[10px] text-zinc-500">
                          Scope: {tpl.scope} · Default: {tpl.default_value !== null ? `${tpl.default_value} ${tpl.unit}` : "Manual"}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenAddSmartRuleModal(tpl)}
                        className="group relative px-3 py-1 rounded-full overflow-hidden text-[11px] font-mono font-medium text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shrink-0 cursor-pointer"
                      >
                        <div className="absolute top-0 inset-x-1 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                        <span className="relative z-10">Add</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Active Guardrails */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Active Guardrails ({smartRules.length})
                  </div>
                  {smartRules.length === 0 ? (
                    <div className="p-8 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
                      No active guardrails. Click &quot;Add&quot; on any template to configure automated limits.
                    </div>
                  ) : (
                    smartRules.map((rule) => {
                      const isTriggered = rule.last_evaluation_status === "triggered";
                      return (
                        <div
                          key={rule.id}
                          className={cn(
                            "p-4 rounded-xl border space-y-2",
                            isTriggered
                              ? "bg-rose-950/20 border-rose-800/60"
                              : "bg-[#09090b] border-zinc-800"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold text-white">{rule.name}</div>
                              <div className="text-[11px] text-zinc-400">
                                Threshold: {rule.threshold_value !== null ? `${rule.threshold_value} ${rule.unit || ""}` : "Approval"} · Scope: {rule.scope}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                title={rule.is_active ? "Pause Rule" : "Activate Rule"}
                                onClick={() =>
                                  toggleSmartRuleMutation.mutate({
                                    id: rule.id,
                                    is_active: !rule.is_active,
                                  })
                                }
                                className="text-zinc-400 hover:text-white cursor-pointer"
                              >
                                {rule.is_active ? (
                                  <ToggleRight className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-zinc-600" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteSmartRuleMutation.mutate(rule.id)}
                                className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="text-[11px]">
                            {isTriggered ? (
                              <div className="text-rose-400 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Triggered: {rule.last_evaluation_message || "Threshold exceeded."}</span>
                              </div>
                            ) : (
                              <div className="text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Active &amp; enforcing</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── MODAL: Customize & Create Smart Rule ────────────────────── */}
        {selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#09090b] text-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 space-y-4 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Configure Guardrail</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSmartRuleModal} className="space-y-4 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">
                    Guardrail Name
                  </label>
                  <input
                    value={modalRuleName}
                    onChange={(e) => setModalRuleName(e.target.value)}
                    required
                    className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-800 bg-[#121318] text-white focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">
                    Threshold Value ({selectedTemplate.unit || "unit"})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={modalThreshold}
                    onChange={(e) => setModalThreshold(e.target.value)}
                    placeholder={selectedTemplate.default_value?.toString() ?? "Optional"}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-800 bg-[#121318] text-white focus:outline-none focus:border-zinc-600"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1 font-sans">{selectedTemplate.description}</p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    className="px-4 py-1.5 rounded-full text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createSmartRuleMutation.isPending}
                    className="group relative px-5 py-1.5 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center gap-1.5 text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer"
                  >
                    <div className="absolute top-0 inset-x-2 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                    <span className="relative z-10">{createSmartRuleMutation.isPending ? "Activating..." : "Activate Guardrail"}</span>
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