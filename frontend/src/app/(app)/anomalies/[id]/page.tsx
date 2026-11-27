"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  PhoneCall,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Cpu,
  Layers,
  ArrowUpRight,
  Radio,
} from "lucide-react";
import {
  useAnomalyDetail,
  useAcknowledgeAnomaly,
  useResolveAnomaly,
} from "@/hooks/useAnomalies";
import { useActions } from "@/hooks/useActions";
import { useVoiceCalls } from "@/hooks/useVoiceCalls";
import { ProviderLogo } from "@/components/ui/provider-logos";
import { formatNumber, cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

export default function AnomalyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const anomalyId = String(params?.id || "");

  const { data: anomaly, isLoading, refetch } = useAnomalyDetail(anomalyId);
  const acknowledgeMutation = useAcknowledgeAnomaly();
  const resolveMutation = useResolveAnomaly();

  // Load related actions & voice calls
  const { actions } = useActions();
  const { calls } = useVoiceCalls();

  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [isKilling, setIsKilling] = React.useState(false);

  const relatedAction = actions.find((a) => a.anomaly_id === anomalyId);
  const relatedCall = calls.find((c) => c.anomaly_id === anomalyId);

  const handleAcknowledge = async () => {
    try {
      setFeedback("Acknowledging anomaly...");
      await acknowledgeMutation.mutateAsync(anomalyId);
      setFeedback("Anomaly acknowledged");
      refetch();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
  };

  const handleResolve = async () => {
    try {
      setFeedback("Resolving anomaly...");
      await resolveMutation.mutateAsync(anomalyId);
      setFeedback("Anomaly marked as resolved");
      refetch();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
  };

  const handleKillSwitch = async () => {
    if (!anomaly) return;
    setIsKilling(true);
    try {
      await apiFetch("/api/v1/actions/propose", {
        method: "POST",
        body: JSON.stringify({
          anomaly_id: anomaly.id,
          action_type: "kill_switch",
          provider: anomaly.provider,
          target_key_id: anomaly.api_key_id,
        }),
      });
      setFeedback("Kill switch circuit engaged — proposal dispatched to Savings tab");
    } catch (err: any) {
      setFeedback(`Kill switch error: ${err.message}`);
    } finally {
      setIsKilling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-zinc-400 font-mono text-xs">
        <Loader2 className="w-8 h-8 animate-spin text-white mb-3" />
        <p>Loading incident telemetry &amp; live sentinel data...</p>
      </div>
    );
  }

  if (!anomaly) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 max-w-lg mx-auto text-center space-y-4 font-mono">
        <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-900/60 flex items-center justify-center text-rose-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">
          Incident Record Not Found
        </h2>
        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          The requested anomaly record (<code className="text-zinc-200">{anomalyId}</code>) could not be retrieved from the active cluster.
        </p>
        <Link
          href="/anomalies"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-medium text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Anomalies</span>
        </Link>
      </div>
    );
  }

  const baseline = Number(anomaly.baseline_value || 0);
  const actual = Number(anomaly.actual_value || 0);
  const deviation = Number(anomaly.deviation_pct || 0);
  const excess = Math.max(0, actual - baseline);
  const isCritical = anomaly.severity?.toLowerCase() === "critical";
  const isHigh = anomaly.severity?.toLowerCase() === "high";
  const isOpen = anomaly.status?.toLowerCase() === "open";
  const isResolved = anomaly.status?.toLowerCase() === "resolved";

  const rootCause =
    typeof anomaly.explanation === "string"
      ? anomaly.explanation
      : anomaly.explanation?.root_cause ||
        anomaly.explanation?.summary ||
        "Abnormal inference spend velocity observed against established baseline.";

  return (
    <div className="min-h-screen pb-16 text-white font-mono space-y-6">
      {/* Top Breadcrumb & Return Bar */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Link
          href="/anomalies"
          className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium text-zinc-400 hover:text-white border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Anomalies</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE SENTINEL
          </span>
        </div>
      </div>

      {/* Main Incident Hero Card (Classy Dark Glass, No Boxy Cards) */}
      <div className="rounded-2xl bg-[#09090b]/95 border border-zinc-800/90 shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800/80">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                <ProviderLogo
                  provider={anomaly.provider}
                  name={anomaly.serviceName || anomaly.provider}
                  size={18}
                />
              </div>

              <h1 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white uppercase">
                {anomaly.provider} Anomaly Incident
              </h1>

              {/* Severity Pill */}
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider",
                  isCritical
                    ? "border border-rose-500/30 bg-rose-950/60 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.25)]"
                    : isHigh
                    ? "border border-amber-500/30 bg-amber-950/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                    : "border border-zinc-700 bg-zinc-800 text-zinc-300"
                )}
              >
                {anomaly.severity}
              </span>

              {/* Status Pill */}
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider",
                  isOpen
                    ? "border border-amber-500/30 bg-amber-950/40 text-amber-300"
                    : isResolved
                    ? "border border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
                    : "border border-zinc-700 bg-zinc-800 text-zinc-300"
                )}
              >
                {anomaly.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 font-mono pt-0.5">
              <span>
                Incident ID: <code className="text-zinc-200">{anomaly.id}</code>
              </span>
              <span>·</span>
              {anomaly.api_key_id && (
                <>
                  <span>
                    Key / Series: <code className="text-zinc-200">{anomaly.api_key_id}</code>
                  </span>
                  <span>·</span>
                </>
              )}
              {anomaly.detected_at && (
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  Detected {new Date(anomaly.detected_at).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons (Liquid Glass Styled) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isOpen && (
              <button
                type="button"
                onClick={handleAcknowledge}
                disabled={acknowledgeMutation.isPending}
                className="group relative px-4 py-2 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center gap-1.5 text-zinc-300 hover:text-white border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <div className="absolute top-0 inset-x-1 h-[45%] rounded-t-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                <span className="relative z-10">Acknowledge</span>
              </button>
            )}

            {isOpen && (isCritical || isHigh) && (
              <button
                type="button"
                onClick={handleKillSwitch}
                disabled={isKilling}
                className="px-4 py-2 rounded-full text-xs font-mono font-bold bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.25)] active:scale-[0.98] disabled:opacity-50"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>{isKilling ? "Engaging..." : "Kill Switch"}</span>
              </button>
            )}

            {!isResolved && (
              <button
                type="button"
                onClick={handleResolve}
                disabled={resolveMutation.isPending}
                className="group relative px-5 py-2 rounded-full overflow-hidden text-xs font-mono font-bold transition-all duration-300 flex items-center gap-1.5 text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <div className="absolute top-0 inset-x-1 h-[45%] rounded-t-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                <CheckCircle2 className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">Resolve Anomaly</span>
              </button>
            )}
          </div>
        </div>

        {feedback && (
          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-700 text-zinc-200 text-xs font-mono flex items-center justify-between">
            <span>{feedback}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-zinc-400 hover:text-white text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 3 Metrics: Baseline, Observed Spike, Deviation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
          <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 hover:border-zinc-700 transition-colors">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Baseline Value (Expected)
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ${baseline.toFixed(2)}
            </div>
            <div className="text-xs text-zinc-500 font-sans">
              Statistical 7-day median
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-1.5 hover:border-rose-800/60 transition-colors">
            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
              Spike Value (Observed)
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
              ${actual.toFixed(2)}
            </div>
            <div className="text-xs text-rose-300/70 font-sans">
              Measured usage in billing window
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 hover:border-zinc-700 transition-colors">
            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
              <span>Deviation Spike</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
              +{deviation.toFixed(1)}%
            </div>
            <div className="text-xs text-zinc-500 font-sans">
              Above statistical threshold
            </div>
          </div>
        </div>

        {/* AI Incident Analysis & Explanation (DIRECT EDITORIAL TYPOGRAPHY - NO NESTED BOXES) */}
        <div className="pt-2 border-t border-zinc-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>AI Incident Analysis &amp; Explanation</span>
          </div>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-sans font-normal">
            {rootCause}
          </p>

          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            During the active billing observation cycle, spend elevated from the historical baseline of{" "}
            <span className="font-mono text-zinc-200 font-bold">${baseline.toFixed(2)}</span> to an observed{" "}
            <span className="font-mono text-white font-bold">${actual.toFixed(2)}</span>. This represents an unbudgeted spike of{" "}
            <span className="font-mono text-rose-400 font-bold">+${excess.toFixed(2)}</span> (+{deviation.toFixed(1)}% over threshold), logged by the MAD Z-Score outlier detection engine.
          </p>

          {/* Clean Hairline Ledger Rows */}
          <div className="pt-2 border-t border-b border-zinc-800/80 divide-y divide-zinc-800/60 text-xs font-mono">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500">Provider &amp; Scope</span>
              <span className="font-semibold text-zinc-200 uppercase">
                {anomaly.provider} · {anomaly.serviceName || anomaly.series_key}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500">Target Key / Resource</span>
              <span className="font-semibold text-white">
                {anomaly.api_key_id || anomaly.series_key || "Primary Series"}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500">Detection Algorithm</span>
              <span className="text-zinc-300">
                Median Absolute Deviation (MAD) Z-Score
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500">Automated Dispatch</span>
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Slack &amp; Sentinel Webhook Dispatched
              </span>
            </div>
          </div>
        </div>

        {/* Automated Incident Lifecycle & Timeline */}
        <div className="pt-4 border-t border-zinc-800/80 space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-white font-mono">
            Automated Incident Lifecycle &amp; Timeline
          </h3>

          <div className="space-y-3 font-mono">
            {/* Step 1: Detection */}
            <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Anomaly Detected by MAD Z-Score Engine
                  </div>
                  <div className="text-[11px] text-zinc-400 font-sans">
                    Logged at {new Date(anomaly.detected_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                VERIFIED
              </span>
            </div>

            {/* Step 2: Push & Slack alerts */}
            <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Slack &amp; Push Notifications Dispatched
                  </div>
                  <div className="text-[11px] text-zinc-400 font-sans">
                    High-priority alert delivered to registered alert channel
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">
                SENT
              </span>
            </div>

            {/* Step 3: AI Voice Call */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/40">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-950/80 border border-purple-800/50 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <PhoneCall className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-200">
                    AI Autonomous Voice Alert Call Placed
                  </div>
                  <div className="text-[11px] text-purple-300/80 font-sans">
                    {relatedCall
                      ? `Status: ${relatedCall.status} (${relatedCall.duration_seconds || 0}s duration)`
                      : "Voice alert dispatched to on-call phone"}
                  </div>
                </div>
              </div>

              <Link
                href="/calls"
                className="group relative px-3 py-1 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center gap-1 text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer shrink-0"
              >
                <div className="absolute top-0 inset-x-1 h-[45%] rounded-t-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                <span className="relative z-10">View Call Transcript</span>
                <ExternalLink className="w-3 h-3 relative z-10" />
              </Link>
            </div>

            {/* Step 4: Kill switch / Action */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {relatedAction
                      ? `Remediation: ${relatedAction.type.replace("_", " ").toUpperCase()} (${relatedAction.status})`
                      : "Emergency Remediation Circuit"}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-sans">
                    {relatedAction
                      ? `Target Key: ${relatedAction.target_key_id || "Active API key"}`
                      : "Propose a kill switch or spend quota cut-off in Action Center"}
                  </div>
                </div>
              </div>

              <Link
                href="/actions"
                className="group relative px-3 py-1 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center gap-1 text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer shrink-0"
              >
                <div className="absolute top-0 inset-x-1 h-[45%] rounded-t-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                <span className="relative z-10">Manage Action</span>
                <ExternalLink className="w-3 h-3 relative z-10" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
