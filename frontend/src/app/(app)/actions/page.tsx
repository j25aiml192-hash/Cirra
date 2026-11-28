"use client";

import * as React from "react";
import {
  ShieldAlert,
  GitPullRequest,
  CheckCircle2,
  RotateCcw,
  Clock,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Loader2,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useActions, type ActionItem, type DryRunResult } from "@/hooks/useActions";
import { useAuthStore } from "@/store/authStore";
import { Topbar } from "@/components/layout/Topbar";
import { ProviderLogo } from "@/components/ui/provider-logos";
import { formatNumber, cn } from "@/lib/utils";

export default function ActionsPage() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [expandedActionId, setExpandedActionId] = React.useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = React.useState<{ [id: string]: string }>({});

  const {
    actions,
    isLoading,
    approveAction,
    isApproving,
    rollbackAction,
    isRollingBack,
    refetch,
  } = useActions(statusFilter);

  const currentUser = useAuthStore((s) => s.user);

  const handleApprove = async (action: ActionItem) => {
    try {
      setActionFeedback((prev) => ({ ...prev, [action.id]: "Executing..." }));
      await approveAction({ actionId: action.id, userId: currentUser?.id });
      setActionFeedback((prev) => ({ ...prev, [action.id]: "Action executed!" }));
      refetch();
    } catch (err: any) {
      setActionFeedback((prev) => ({ ...prev, [action.id]: `Error: ${err.message}` }));
    }
  };

  const handleRollback = async (action: ActionItem) => {
    try {
      setActionFeedback((prev) => ({ ...prev, [action.id]: "Rolling back..." }));
      await rollbackAction({ actionId: action.id });
      setActionFeedback((prev) => ({ ...prev, [action.id]: "Rolled back!" }));
      refetch();
    } catch (err: any) {
      setActionFeedback((prev) => ({ ...prev, [action.id]: `Error: ${err.message}` }));
    }
  };

  const parseDryRun = (dryRun: any): DryRunResult => {
    if (!dryRun) return {};
    if (typeof dryRun === "string") {
      try {
        return JSON.parse(dryRun);
      } catch {
        return { simulated_effect: dryRun };
      }
    }
    return dryRun;
  };

  // Group metrics
  const proposedCount = actions.filter((a) => a.status === "proposed" || a.status === "dry_run").length;
  const executedCount = actions.filter((a) => a.status === "executed" || a.status === "approved").length;
  const rolledBackCount = actions.filter((a) => a.status === "rolled_back").length;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white">
      <Topbar title="Action Center" />

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
              <span>Remediation & Guardrail Actions</span>
            </h1>
            <p className="text-xs text-zinc-400 font-sans mt-1">
              Dry-run simulated impact, automated pull requests, and autonomous kill switches.
            </p>
          </div>

          {/* Minimal Status Counter */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500">Proposed:</span>
              <span className="text-white font-bold">{proposedCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500">Executed:</span>
              <span className="text-zinc-300 font-bold">{executedCount}</span>
            </div>
          </div>
        </div>

        {/* Toolbar: Safety Note & Filter Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-sans">
            <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Dry-run verified before manual approval. Zero direct production mutations without consent.</span>
          </div>

          {/* Status Filter Tabs */}
          <div className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-full text-xs font-mono shrink-0">
            {[
              { id: "all", label: "All" },
              { id: "proposed", label: `Proposed (${proposedCount})` },
              { id: "executed", label: `Executed (${executedCount})` },
              { id: "rolled_back", label: `Rolled Back (${rolledBackCount})` },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-mono transition-colors cursor-pointer",
                    isActive
                      ? "bg-zinc-800 text-white font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions List (Clean, Sleek Dark Rows) */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-zinc-500 flex flex-col items-center font-mono">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400 mb-2" />
            Loading actions...
          </div>
        ) : actions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-zinc-800/80 bg-zinc-950/60 text-zinc-500 font-mono text-xs">
            Zero actions matching the active filter.
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 divide-y divide-zinc-800/60 overflow-hidden">
            {actions.map((action) => {
              const isExpanded = expandedActionId === action.id;
              const dryRun = parseDryRun(action.dry_run_result_json);
              const isKillSwitch = action.type === "kill_switch";
              const canApprove = action.status === "proposed" || action.status === "dry_run";
              const canRollback = action.status === "executed" || action.status === "approved";
              const feedback = actionFeedback[action.id];

              return (
                <div key={action.id} className="transition-colors">
                  {/* Row Summary */}
                  <div
                    onClick={() => setExpandedActionId(isExpanded ? null : action.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/40 select-none"
                  >
                    {/* Left: Icon, Action Title & Key */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 p-1.5">
                        {action.provider ? (
                          <ProviderLogo provider={action.provider} size={20} />
                        ) : isKillSwitch ? (
                          <ShieldAlert className="w-4 h-4 text-zinc-300" />
                        ) : (
                          <GitPullRequest className="w-4 h-4 text-zinc-300" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-100 font-sans truncate">
                            {isKillSwitch ? "API Key Kill Switch" : "Remediation Pull Request"}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 uppercase">
                            {action.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono mt-0.5 truncate">
                          {action.provider && (
                            <span className="uppercase font-semibold text-zinc-400">
                              {action.provider}
                            </span>
                          )}
                          {action.target_key_id && (
                            <span>{action.target_key_id}</span>
                          )}
                          {action.created_at && (
                            <span className="flex items-center gap-1 text-zinc-600">
                              <Clock className="w-3 h-3" />
                              {new Date(action.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Estimated Savings & Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/60">
                      {dryRun.estimated_monthly_savings_usd ? (
                        <div className="text-right">
                          <div className="text-sm font-bold font-mono text-white">
                            +${formatNumber(dryRun.estimated_monthly_savings_usd)}/mo
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500">
                            Est. Savings
                          </div>
                        </div>
                      ) : null}

                      <div className="text-zinc-500 p-1">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-300" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel (Dark Theme, No Clutter) */}
                  {isExpanded && (
                    <div className="px-5 py-4 border-t border-zinc-800/80 bg-zinc-900/30 space-y-4">
                      {/* Dry-run Narrative */}
                      <div className="text-xs text-zinc-400 font-sans leading-relaxed">
                        <span className="text-zinc-200 font-mono font-semibold block mb-1">
                          Simulation Effect:
                        </span>
                        {dryRun.simulated_effect ||
                          (isKillSwitch
                            ? `Revokes execution credentials for ${action.target_key_id || "target"} on ${action.provider} immediately.`
                            : "Submits automated code remediation pull request with optimized compute and scaling configs.")}
                      </div>

                      {dryRun.pr_url && (
                        <div>
                          <a
                            href={dryRun.pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white font-mono underline"
                          >
                            <span>Open PR on GitHub</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {/* Action Triggers */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                        <div className="text-[11px] font-mono text-zinc-500">
                          {feedback ? (
                            <span className="text-zinc-200 font-bold">{feedback}</span>
                          ) : (
                            <span>ID: {action.id}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {canApprove && (
                            <button
                              type="button"
                              onClick={() => handleApprove(action)}
                              disabled={isApproving}
                              className="py-1.5 px-3.5 rounded-lg border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] text-white text-xs font-mono font-medium transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
                            >
                              {isApproving ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3 text-zinc-400" />
                              )}
                              <span>Approve Action</span>
                            </button>
                          )}

                          {canRollback && (
                            <button
                              type="button"
                              onClick={() => handleRollback(action)}
                              disabled={isRollingBack}
                              className="py-1.5 px-3 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              {isRollingBack ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3 h-3 text-zinc-400" />
                              )}
                              <span>Rollback</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
