"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Loader2,
  PhoneCall,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  useAnomalyDetail,
  useAcknowledgeAnomaly,
  useResolveAnomaly,
} from "@/hooks/useAnomalies";
import { useActions } from "@/hooks/useActions";
import { useVoiceCalls } from "@/hooks/useVoiceCalls";

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

  const relatedAction = actions.find((a) => a.anomaly_id === anomalyId);
  const relatedCall = calls.find((c) => c.anomaly_id === anomalyId);

  const handleAcknowledge = async () => {
    try {
      setFeedback("Acknowledging anomaly...");
      await acknowledgeMutation.mutateAsync(anomalyId);
      setFeedback("Anomaly acknowledged!");
      refetch();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
  };

  const handleResolve = async () => {
    try {
      setFeedback("Resolving anomaly...");
      await resolveMutation.mutateAsync(anomalyId);
      setFeedback("Anomaly resolved!");
      refetch();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-sm text-[#64748B] flex flex-col items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0062E0] mb-3" />
        Loading anomaly details & telemetry...
      </div>
    );
  }

  if (!anomaly) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">Anomaly not found</h2>
        <p className="text-sm text-slate-500">
          The requested anomaly record could not be loaded or may not exist for this tenant.
        </p>
        <Link
          href="/anomalies"
          className="inline-flex items-center gap-2 text-sm text-[#0062E0] font-semibold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Anomalies List
        </Link>
      </div>
    );
  }

  const baseline = Number(anomaly.baseline_value || 0);
  const actual = Number(anomaly.actual_value || 0);
  const deviation = Number(anomaly.deviation_pct || 0);

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case "critical":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "high":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st?.toLowerCase()) {
      case "open":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "acknowledged":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 text-[#0A192F]">
      {/* Back button */}
      <div>
        <Link
          href="/anomalies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0062E0] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Anomalies
        </Link>
      </div>

      {/* Top Banner & Title */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-xl uppercase tracking-tight text-[#0A192F]">
                {anomaly.provider} Anomaly Incident
              </span>
              <span
                className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getSeverityBadge(
                  anomaly.severity
                )}`}
              >
                {anomaly.severity}
              </span>
              <span
                className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                  anomaly.status
                )}`}
              >
                {anomaly.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#64748B] mt-1">
              <span>Incident ID: <code className="font-mono text-[10px]">{anomaly.id}</code></span>
              {anomaly.api_key_id && (
                <span>Key / Series: <code className="font-mono text-[10px]">{anomaly.api_key_id}</code></span>
              )}
              {anomaly.detected_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Detected {new Date(anomaly.detected_at).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {anomaly.status === "open" && (
              <button
                type="button"
                onClick={handleAcknowledge}
                disabled={acknowledgeMutation.isPending}
                className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                Acknowledge
              </button>
            )}

            {anomaly.status !== "resolved" && (
              <button
                type="button"
                onClick={handleResolve}
                disabled={resolveMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Anomaly
              </button>
            )}
          </div>
        </div>

        {feedback && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            {feedback}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0]">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Baseline Value (Expected)
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              ${baseline.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Statistical 7-day median</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0]">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Spike Value (Observed)
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              ${actual.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Measured usage in billing window</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0]">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-rose-500" /> Deviation Spike
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              +{deviation.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Above statistical threshold</div>
          </div>
        </div>
      </div>

      {/* AI Plain English Explanation */}
      <div className="bg-white rounded-2xl border border-[#BCD9FC] p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0062E0]">
          <Sparkles className="w-4 h-4" /> AI Incident Analysis & Explanation
        </div>
        <p className="text-sm text-slate-700 leading-relaxed bg-[#F8FAFD] p-4 rounded-xl border border-[#E2E8F0]">
          {typeof anomaly.explanation === "string"
            ? anomaly.explanation
            : typeof anomaly.explanation === "object" && anomaly.explanation !== null
            ? (anomaly.explanation.summary || anomaly.explanation.root_cause || JSON.stringify(anomaly.explanation))
            : `Cirra Sentinel identified a ${deviation.toFixed(1)}% spike on ${(anomaly.provider || "").toUpperCase()} at ${new Date(
                anomaly.detected_at
              ).toLocaleTimeString()}. The actual cost ($${actual.toFixed(2)}) significantly exceeds the established baseline ($${baseline.toFixed(2)}), triggering autonomous alerts.`}
        </p>
      </div>

      {/* Automated Actions Timeline */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-[#0A192F]">Automated Incident Lifecycle & Timeline</h3>

        <div className="space-y-3">
          {/* Step 1: Detection */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                Anomaly Detected by MAD Z-Score Engine
              </div>
              <div className="text-[11px] text-slate-500">
                Logged at {new Date(anomaly.detected_at).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Step 2: Push & Slack alerts */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                Slack & Push Notifications Dispatched
              </div>
              <div className="text-[11px] text-slate-500">
                High-priority notification delivered to registered webhook & topic
              </div>
            </div>
          </div>

          {/* Step 3: AI Voice Call */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-purple-100 bg-purple-50/30">
            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-purple-900">
                  AI Autonomous Voice Alert Call Placed
                </div>
                <div className="text-[11px] text-purple-700">
                  {relatedCall ? `Call status: ${relatedCall.status} (${relatedCall.duration_seconds || 0}s duration)` : "Voice alert triggered for registered phone"}
                </div>
              </div>
              <Link
                href="/calls"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0062E0] hover:underline"
              >
                View Call Transcript <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Step 4: Kill switch / Action */}
          {relatedAction ? (
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-blue-100 bg-blue-50/30">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-[#0062E0] flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-900">
                    Action Engine: {relatedAction.type.replace("_", " ").toUpperCase()} ({relatedAction.status})
                  </div>
                  <div className="text-[11px] text-blue-700">
                    Target: {relatedAction.target_key_id || "API key resource"}
                  </div>
                </div>
                <Link
                  href="/actions"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0062E0] hover:underline"
                >
                  Manage Action <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Remediation Action
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Propose a kill switch or spend cap in the Action Center
                  </div>
                </div>
                <Link
                  href="/actions"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0062E0] hover:underline"
                >
                  Open Action Center <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

