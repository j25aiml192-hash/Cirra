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
import { ProviderLogo } from "@/components/ui/provider-logos";

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
        return "bg-[#ede8e0] text-[#18181b] border-[#ded7cc] font-bold";
      case "approved":
      case "executed":
        return "bg-[#18181b] text-white border-transparent font-bold";
      case "rolled_back":
        return "bg-[#ede8e0] text-zinc-600 border-[#ded7cc]";
      case "failed":
        return "bg-[#18181b] text-white border-transparent";
      default:
        return "bg-[#ede8e0] text-[#18181b] border-[#ded7cc]";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Topbar />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-white font-mono select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Action Center</h1>
          <p className="text-sm text-zinc-400 mt-1 font-sans">
            Review simulated impact, approve autonomous kill switches, or trigger instant rollbacks.
          </p>
        </div>

        {/* Filter Pills with Liquid Glass */}
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-xs font-mono shadow-inner self-start">
          {[
            { id: "all", label: "All Actions" },
            { id: "proposed", label: "Proposed" },
            { id: "executed", label: "Executed" },
            { id: "rolled_back", label: "Rolled Back" },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`relative px-3.5 py-1 rounded-full text-xs font-mono transition-all duration-200 cursor-pointer overflow-hidden focus:outline-none ${
                  isActive
                    ? "text-white font-bold bg-white/[0.18] border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.3)] backdrop-blur-md"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 inset-x-1 h-[50%] rounded-t-full bg-gradient-to-b from-white/50 to-transparent pointer-events-none" />
                )}
                <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Safety Notice Banner in Bright Theme */}
      <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#ded8cb] shadow-sm flex items-start gap-3 text-xs text-zinc-800 font-mono">
        <Info className="w-4 h-4 text-zinc-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-zinc-950">Strict Safety Protocol: </span>
          AI never directly executes actions on your production infrastructure without verification. Every action is dry-run tested with estimated savings before requesting your explicit approval.
        </div>
      </div>

      {/* Actions List in Bright Theme */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-zinc-400 flex flex-col items-center">
          <Loader2 className="w-7 h-7 animate-spin text-white mb-3" />
          Loading actions and simulated impact...
        </div>
      ) : actions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-[#ded8cb] bg-[#faf8f5] text-zinc-900 shadow-sm">
          <CheckSquare className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-900 font-mono">No actions found</h3>
          <p className="text-xs text-zinc-600 mt-1 max-w-sm mx-auto font-mono">
            When Cirra Sentinel flags an anomaly or spend spike, proposed kill switches or pull requests will appear here for one-click approval.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
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
                className="bg-[#faf8f5] rounded-2xl border border-[#ded8cb] hover:border-[#cfc8b8] shadow-sm hover:shadow-md transition-all overflow-hidden text-zinc-900"
              >
                {/* Collapsed Header / Row */}
                <div
                  onClick={() => setExpandedActionId(isExpanded ? null : action.id)}
                  className="p-5 flex items-center justify-between cursor-pointer select-none hover:bg-[#f5f2ea]/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon Tile with Provider Logo or Shield */}
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#ded8cb] flex items-center justify-center flex-shrink-0 shadow-sm p-1.5">
                      {action.provider ? (
                        <ProviderLogo provider={action.provider} size={22} />
                      ) : isKillSwitch ? (
                        <ShieldAlert className="w-5 h-5 text-zinc-900" />
                      ) : (
                        <GitPullRequest className="w-5 h-5 text-zinc-900" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-950 font-mono">
                          {isKillSwitch ? "API Key Kill Switch" : "GitHub Remediation PR"}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${getStatusBadge(
                            action.status
                          )}`}
                        >
                          {action.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-600 mt-1 font-mono">
                        {action.provider && (
                          <span className="font-bold uppercase text-[11px] text-zinc-900 font-mono">
                            {action.provider}
                          </span>
                        )}
                        {action.target_key_id && (
                          <span className="font-mono text-[11px] text-zinc-600">
                            Key: {action.target_key_id}
                          </span>
                        )}
                        {action.created_at && (
                          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <Clock className="w-3 h-3 text-zinc-500" />
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
                        <div className="text-sm font-bold text-zinc-950 flex items-center justify-end">
                          <DollarSign className="w-3.5 h-3.5 -mr-1" />
                          {dryRun.estimated_monthly_savings_usd.toLocaleString()}
                          <span className="text-[10px] text-zinc-500 font-normal ml-1">/mo</span>
                        </div>
                      </div>
                    ) : null}

                    <div className="text-zinc-600 p-1">
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
                  <div className="px-5 pb-5 pt-3 border-t border-[#ded8cb] bg-[#f5f2ea] space-y-4">
                    {/* Dry Run Simulation details */}
                    <div className="p-4 rounded-xl bg-white border border-[#ded8cb] shadow-sm space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900" /> Simulated Dry-Run Result
                      </div>
                      <p className="text-sm text-zinc-700 font-mono leading-relaxed">
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
                            className="inline-flex items-center gap-1.5 text-xs text-zinc-950 font-bold hover:underline font-mono"
                          >
                            View Pull Request on GitHub <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Operational controls with Glassmorphic Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-zinc-600 font-mono">
                        {feedback && (
                          <span className="font-bold text-zinc-950">{feedback}</span>
                        )}
                        {!feedback && (
                          <span>
                            Action ID: <span className="font-mono text-[10px] text-zinc-700 font-semibold">{action.id}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        {canApprove && (
                          <button
                            type="button"
                            onClick={() => handleApprove(action)}
                            disabled={isApproving}
                            className="group relative px-5 py-2.5 rounded-full overflow-hidden text-xs font-mono font-bold transition-all duration-300 inline-flex items-center justify-center text-white bg-[#18181b]/95 hover:bg-black border border-white/20 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_12px_rgba(0,0,0,0.15)] active:scale-[0.98] cursor-pointer"
                          >
                            <div className="absolute top-0 inset-x-2 h-[45%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                            <span className="relative z-10 flex items-center gap-2">
                              {isApproving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              Approve & Execute Action
                            </span>
                          </button>
                        )}

                        {canRollback && (
                          <button
                            type="button"
                            onClick={() => handleRollback(action)}
                            disabled={isRollingBack}
                            className="group relative px-4 py-2 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 inline-flex items-center justify-center text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer"
                          >
                            <div className="absolute top-0 inset-x-1.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                            <span className="relative z-10 flex items-center gap-2">
                              {isRollingBack ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3.5 h-3.5" />
                              )}
                              Rollback Action
                            </span>
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

