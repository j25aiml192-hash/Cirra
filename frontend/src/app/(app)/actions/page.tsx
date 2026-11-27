"use client";

import * as React from "react";
import {
  CheckSquare,
  ShieldAlert,
  GitPullRequest,
  CheckCircle2,
  RotateCcw,
  Clock,
  ChevronDown,
  ChevronUp,
  DollarSign,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Info,
} from "lucide-react";
import { useActions, type ActionItem, type DryRunResult } from "@/hooks/useActions";
import { useAuthStore } from "@/store/authStore";
import { Topbar } from "@/components/layout/Topbar";

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
      setActionFeedback((prev) => ({ ...prev, [action.id]: "Approving..." }));
      await approveAction({ actionId: action.id, userId: currentUser?.id });
      setActionFeedback((prev) => ({ ...prev, [action.id]: "Action successfully executed!" }));
      refetch();
    } catch (err: any) {
      setActionFeedback((prev) => ({ ...prev, [action.id]: `Error: ${err.message}` }));
    }
  };

  const handleRollback = async (action: ActionItem) => {
    try {
      setActionFeedback((prev) => ({ ...prev, [action.id]: "Rolling back..." }));
      await rollbackAction({ actionId: action.id });
      setActionFeedback((prev) => ({ ...prev, [action.id]: "Action rolled back!" }));
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

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "proposed":
      case "dry_run":
        return "bg-zinc-900 text-zinc-300 border-zinc-800";
      case "approved":
      case "executed":
        return "bg-white text-black border-transparent font-bold";
      case "rolled_back":
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
      case "failed":
        return "bg-zinc-900 text-white border-zinc-700";
      default:
        return "bg-zinc-900 text-zinc-300 border-zinc-800";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Topbar />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-white font-mono select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Action Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800">
              Human-in-the-Loop
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1 font-sans">
            Review simulated impact, approve autonomous kill switches, or trigger instant rollbacks.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-medium self-start">
          {[
            { id: "all", label: "All Actions" },
            { id: "proposed", label: "Proposed" },
            { id: "executed", label: "Executed" },
            { id: "rolled_back", label: "Rolled Back" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-amber-400 text-black font-bold shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800/80 hover:border-amber-500/30 transition-colors flex items-start gap-3 text-xs text-zinc-300">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Strict Safety Protocol: </span>
          AI never directly executes actions on your production infrastructure without verification. Every action is dry-run tested with estimated savings before requesting your explicit approval.
        </div>
      </div>

      {/* Actions List */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-zinc-400 flex flex-col items-center">
          <Loader2 className="w-7 h-7 animate-spin text-white mb-3" />
          Loading actions and simulated impact...
        </div>
      ) : actions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-[#09090b]">
          <CheckSquare className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No actions found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto font-sans">
            When Cirra Sentinel flags an anomaly or spend spike, proposed kill switches or pull requests will appear here for one-click approval.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => {
            const isExpanded = expandedActionId === action.id;
            const dryRun = parseDryRun(action.dry_run_result_json);
            const isKillSwitch = action.type === "kill_switch";
            const canApprove = action.status === "proposed" || action.status === "dry_run";
            const canRollback = action.status === "executed" || action.status === "approved";
            const feedback = actionFeedback[action.id];

            return (
              <div
                key={action.id}
                className="bg-[#09090b] rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition-all overflow-hidden"
              >
                {/* Collapsed Header / Row */}
                <div
                  onClick={() => setExpandedActionId(isExpanded ? null : action.id)}
                  className="p-5 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-900/40"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isKillSwitch
                          ? "bg-zinc-900 text-white border border-zinc-800"
                          : "bg-zinc-900 text-zinc-300 border border-zinc-800"
                      }`}
                    >
                      {isKillSwitch ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : (
                        <GitPullRequest className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {isKillSwitch ? "API Key Kill Switch" : "GitHub Remediation PR"}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                            action.status
                          )}`}
                        >
                          {action.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                        {action.provider && (
                          <span className="font-medium uppercase text-[11px] text-zinc-300 font-mono">
                            {action.provider}
                          </span>
                        )}
                        {action.target_key_id && (
                          <span className="font-mono text-[11px]">
                            Key: {action.target_key_id}
                          </span>
                        )}
                        {action.created_at && (
                          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <Clock className="w-3 h-3" />
                            {new Date(action.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {dryRun.estimated_monthly_savings_usd ? (
                      <div className="text-right hidden sm:block font-mono">
                        <div className="text-xs text-zinc-500">Estimated Savings</div>
                        <div className="text-sm font-bold text-white flex items-center justify-end">
                          <DollarSign className="w-3.5 h-3.5 -mr-1" />
                          {dryRun.estimated_monthly_savings_usd.toLocaleString()}
                          <span className="text-[10px] text-zinc-400 font-normal ml-1">/mo</span>
                        </div>
                      </div>
                    ) : null}

                    <div className="text-zinc-400 p-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-zinc-800/80 bg-zinc-950/90 space-y-4">
                    {/* Dry Run Simulation details */}
                    <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Simulated Dry-Run Result
                      </div>
                      <p className="text-sm text-zinc-300 font-mono">
                        {dryRun.simulated_effect ||
                          (isKillSwitch
                            ? `Would revoke access for key ${action.target_key_id || "target"} on ${action.provider}.`
                            : "Would create automated PR on your repository with updated spend limits.")}
                      </p>

                      {dryRun.pr_url && (
                        <div className="pt-2">
                          <a
                            href={dryRun.pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-white font-semibold hover:underline font-mono"
                          >
                            View Pull Request on GitHub <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Operational controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-zinc-500 font-mono">
                        {feedback && (
                          <span className="font-semibold text-white">{feedback}</span>
                        )}
                        {!feedback && (
                          <span>
                            Action ID: <span className="font-mono text-[10px] text-zinc-400">{action.id}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {canApprove && (
                          <button
                            type="button"
                            onClick={() => handleApprove(action)}
                            disabled={isApproving}
                            className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold transition-all disabled:opacity-50 font-mono cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                          >
                            {isApproving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Approve & Execute Action
                          </button>
                        )}

                        {canRollback && (
                          <button
                            type="button"
                            onClick={() => handleRollback(action)}
                            disabled={isRollingBack}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 font-mono cursor-pointer"
                          >
                            {isRollingBack ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            Rollback Action
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
    </div>
  </div>
  );
}

