"use client";

import React, { useState } from "react";
import { GripVertical, Plus, Edit2, Trash2, Check, X, Sparkles } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { formatNumber } from "@/lib/utils";
import type { AllocationRule, SuggestedRule } from "@/types";

const initialRules: AllocationRule[] = [
  {
    id: "rule-1",
    priority: 1,
    match_type: "tag",
    match_value: "team=core-platform",
    assign_team: "Core Platform",
    assign_feature: "API Gateway",
    spendAttributed: 54200,
  },
  {
    id: "rule-2",
    priority: 2,
    match_type: "prefix",
    match_value: "gke-search-*",
    assign_team: "Search & Retrieval",
    assign_feature: "Vector Search",
    spendAttributed: 28400,
  },
  {
    id: "rule-3",
    priority: 3,
    match_type: "tag",
    match_value: "env=prod AND component=copilot",
    assign_team: "Copilot Eng",
    assign_feature: "LLM Orchestration",
    spendAttributed: 18500,
  },
  {
    id: "rule-4",
    priority: 4,
    match_type: "service",
    match_value: "Amazon S3",
    assign_team: "Data Lake",
    assign_feature: "Storage",
    spendAttributed: 7000,
  },
];

const initialSuggestions: SuggestedRule[] = [
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
  const [rules, setRules] = useState(initialRules);
  const [suggestions, setSuggestions] = useState(initialSuggestions);

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
          <span className="text-[#475569] font-medium">84.2% attributed · 15.8% unallocated</span>
        </div>
        <div className="h-3 rounded-full bg-[#EBF2FA] overflow-hidden">
          <div className="h-full bg-[#0062E0] rounded-full" style={{ width: "84.2%" }} />
        </div>
        <div className="flex gap-6 mt-3 text-xs text-[#475569] font-medium">
          <span className="flex items-center">
            <span className="w-2 h-2 bg-[#0062E0] rounded-full inline-block mr-1.5" />
            $108,100 attributed
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 bg-[#CBD5E1] rounded-full inline-block mr-1.5" />
            $20,320 unallocated
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

                {/* Edit / Delete actions visible on hover */}
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
      </div>
      </main>
    </div>
  );
}
