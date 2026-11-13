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
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "approved":
      case "executed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rolled_back":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "failed":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-[#0A192F]">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A192F]">Action Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF3FE] text-[#0062E0] border border-[#BCD9FC]">
              Human-in-the-Loop
            </span>
          </div>
          <p className="text-sm text-[#5A6E85] mt-1">
            Review simulated impact, approve autonomous kill switches, or trigger instant rollbacks.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200 text-xs font-medium self-start">
          {[
            { id: "all", label: "All Actions" },
            { id: "proposed", label: "Proposed" },
            { id: "executed", label: "Executed" },
            { id: "rolled_back", label: "Rolled Back" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === tab.id
                  ? "bg-white text-[#0062E0] font-bold shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-xl bg-[#F0F7FF] border border-[#CDE1F8] flex items-start gap-3 text-xs text-[#1E3A8A]">
        <Info className="w-4 h-4 text-[#0062E0] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Strict Safety Protocol: </span>
          AI never directly executes actions on your production infrastructure without verification. Every action is dry-run tested with estimated savings before requesting your explicit approval.
        </div>
      </div>

      {/* Actions List */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-[#64748B] flex flex-col items-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#0062E0] mb-3" />
          Loading actions and simulated impact...
        </div>
      ) : actions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No actions found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
                className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] transition-all overflow-hidden"
              >
                {/* Collapsed Header / Row */}
                <div
                  onClick={() => setExpandedActionId(isExpanded ? null : action.id)}
                  className="p-5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isKillSwitch
                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                          : "bg-blue-50 text-[#0062E0] border border-blue-100"
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
                        <span className="font-bold text-sm text-[#0A192F]">
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
                      <div className="flex items-center gap-3 text-xs text-[#64748B] mt-0.5">
                        {action.provider && (
                          <span className="font-medium uppercase text-[11px] text-[#0062E0]">
                            {action.provider}
                          </span>
                        )}
                        {action.target_key_id && (
                          <span className="font-mono text-[11px]">
                            Key: {action.target_key_id}
                          </span>
                        )}
                        {action.created_at && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3" />
                            {new Date(action.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {dryRun.estimated_monthly_savings_usd ? (
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-slate-500">Estimated Savings</div>
                        <div className="text-sm font-bold text-emerald-600 flex items-center justify-end">
                          <DollarSign className="w-3.5 h-3.5 -mr-1" />
                          {dryRun.estimated_monthly_savings_usd.toLocaleString()}
                          <span className="text-[10px] text-slate-400 font-normal ml-1">/mo</span>
                        </div>
                      </div>
                    ) : null}

                    <div className="text-slate-400 p-1">
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
                  <div className="px-5 pb-5 pt-2 border-t border-[#F1F5F9] bg-[#F8FAFD] space-y-4">
                    {/* Dry Run Simulation details */}
                    <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0062E0]" /> Simulated Dry-Run Result
                      </div>
                      <p className="text-sm text-slate-700">
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
                            className="inline-flex items-center gap-1.5 text-xs text-[#0062E0] font-semibold hover:underline"
                          >
                            View Pull Request on GitHub <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Operational controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-slate-500">
                        {feedback && (
                          <span className="font-semibold text-blue-600">{feedback}</span>
                        )}
                        {!feedback && (
                          <span>
                            Action ID: <span className="font-mono text-[10px]">{action.id}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {canApprove && (
                          <button
                            type="button"
                            onClick={() => handleApprove(action)}
                            disabled={isApproving}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0062E0] text-white text-xs font-bold hover:bg-[#0051B8] shadow-sm transition-all disabled:opacity-50"
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
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-600 text-xs font-semibold hover:bg-rose-50 transition-colors disabled:opacity-50"
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
  );
}

