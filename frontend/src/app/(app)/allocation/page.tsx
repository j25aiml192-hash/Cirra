"use client";

import React, { useState, useEffect } from "react";
import { GripVertical, Plus, Edit2, Trash2, Check, X, Sparkles, Layers } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { useDashboard } from "@/hooks/useDashboard";
import { apiFetch } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import type { AllocationRule, SuggestedRule } from "@/types";

export default function AllocationPage() {
  const [rules, setRules] = useState<AllocationRule[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: dashboardData } = useDashboard("30d");

  useEffect(() => {
    async function fetchRules() {
      try {
        const [rulesRes, suggestionsRes] = await Promise.all([
          apiFetch<AllocationRule[]>("/allocation/rules").catch(() => []),
          apiFetch<SuggestedRule[]>("/allocation/suggestions").catch(() => []),
        ]);
        if (Array.isArray(rulesRes)) setRules(rulesRes);
        if (Array.isArray(suggestionsRes)) setSuggestions(suggestionsRes);
      } catch {
        setRules([]);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRules();
  }, []);

  const totalSpend = dashboardData?.total_spend_mtd ?? 0;
  const coveragePercent = dashboardData?.attributionCoverage?.percentage ?? 0;
  const attributedSpend = dashboardData?.attributionCoverage?.attributed ?? 0;
  const unallocatedSpend = dashboardData?.attributionCoverage?.unallocated ?? 0;

  const handleConfirmSuggestion = (sug: SuggestedRule) => {
    setRules((prev) => [
      ...prev,
      {
        id: `rule-${Date.now()}`,
        priority: prev.length + 1,
        match_type: "regex",
        match_value: sug.pattern,
        assign_team: sug.suggestedTeam,
        spendAttributed: sug.estimatedSpend,
      },
    ]);
    setSuggestions((prev) => prev.filter((s) => s.id !== sug.id));
  };

  const handleDismissSuggestion = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDeleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="min-h-screen">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
        {/* Coverage Bar Card */}
        <div className="cirra-card p-6">
          <div className="flex justify-between text-sm mb-3">
            <span className="font-semibold text-[#0A192F]">Attribution Coverage</span>
            <span className="text-[#475569] font-medium">
              {coveragePercent.toFixed(1)}% attributed · {(100 - coveragePercent).toFixed(1)}% unallocated
            </span>
          </div>
          <div className="h-3 rounded-full bg-[#EBF2FA] overflow-hidden">
            <div
              className="h-full bg-[#0062E0] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, coveragePercent)}%` }}
            />
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
                      Suggested Team: <span className="font-semibold text-[#0062E0]">{sug.suggestedTeam}</span> ·{" "}
                      Confidence: <span className="font-medium text-emerald-600">{(sug.confidence * 100).toFixed(0)}%</span> ·{" "}
                      Attributed spend: <span className="font-semibold">${formatNumber(sug.estimatedSpend)}/mo</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmSuggestion(sug)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-medium flex items-center gap-1 hover:bg-emerald-700 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismissSuggestion(sug.id)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#D6E4F5] text-[#475569] text-xs font-medium hover:bg-[#F0F5FD]"
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
              <p className="text-xs text-[#475569] mt-0.5">Rules are evaluated sequentially from top to bottom</p>
            </div>
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-[#0062E0] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#0052C2] shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Rule
            </button>
          </div>

          {rules.length > 0 ? (
            <div className="divide-y divide-[#EBF2FA]">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="py-3 px-2 flex items-center justify-between hover:bg-[#F4F8FD] rounded-lg group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-[#94A3B8] cursor-grab opacity-40 group-hover:opacity-100" />
                    <span className="text-xs font-mono font-bold text-[#64748B] w-6">#{rule.priority}</span>
                    <Badge variant={rule.match_type === "tag" ? "indigo" : "neutral"} className="uppercase text-[10px]">
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
                      {rule.spendAttributed && (
                        <span className="text-xs font-mono text-[#64748B] ml-2">
                          ${formatNumber(rule.spendAttributed)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="p-1.5 text-[#64748B] hover:text-[#334155] hover:bg-[#F0F5FD] rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center space-y-2">
              <Layers className="w-8 h-8 text-[#94A3B8] mx-auto opacity-70" />
              <h4 className="font-semibold text-[#0A192F] text-sm">No allocation rules configured</h4>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Define rules based on tags, cost centers, or service names to attribute FOCUS cloud and AI spend to engineering teams.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
