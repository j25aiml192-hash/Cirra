"use client";

import * as React from "react";
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  User,
  Bot,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Volume2,
  ShieldAlert,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useVoiceCalls, type VoiceCallItem } from "@/hooks/useVoiceCalls";
import { Topbar } from "@/components/layout/Topbar";

export default function VoiceCallsPage() {
  const [selectedCallId, setSelectedCallId] = React.useState<string | null>(null);
  const [retryFeedback, setRetryFeedback] = React.useState<{ [id: string]: string }>({});

  const { calls, isLoading, retryCall, isRetrying, refetch } = useVoiceCalls();

  const handleRetry = async (call: VoiceCallItem) => {
    try {
      setRetryFeedback((prev) => ({ ...prev, [call.id]: "Initiating retry call..." }));
      await retryCall(call.id);
      setRetryFeedback((prev) => ({ ...prev, [call.id]: "Retry call dispatched!" }));
      refetch();
    } catch (err: any) {
      setRetryFeedback((prev) => ({ ...prev, [call.id]: `Retry failed: ${err.message}` }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "no-answer":
      case "busy":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "failed":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "in-progress":
      case "initiated":
        return "bg-blue-50 text-[#0062E0] border-blue-200 animate-pulse";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getOutcomeBadge = (outcome?: string) => {
    switch (outcome?.toLowerCase()) {
      case "acknowledged":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "escalated":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "no-response":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  return (
    <div>
      <Topbar />
      <div className="p-8 max-w-7xl mx-auto space-y-6 text-[#0A192F]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A192F]">
              AI Voice Alert Logs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600" /> Groq + Twilio Telephony
            </span>
          </div>
          <p className="text-sm text-[#5A6E85] mt-1">
            Real-time conversational voice calls triggered by critical cloud & AI anomalies.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Voice Agent Active
          </span>
        </div>
      </div>

      {/* Feature Showcase Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0062E0]/5 via-[#0062E0]/10 to-purple-500/5 border border-[#BCD9FC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0062E0]">
            <Volume2 className="w-4 h-4" /> Autonomous Voice Incident Response
          </div>
          <p className="text-xs text-[#334155] max-w-2xl">
            When runaway API keys or critical spend anomalies hit at 2 AM, Cirra dials the on-call engineer's phone, speaks real numbers, listens to speech conversationally, and safely executes spoken kill switch approvals.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 bg-white/80 px-4 py-2 rounded-xl border border-[#BCD9FC]/50 shadow-sm flex-shrink-0">
          <div>
            <div className="text-[10px] uppercase text-slate-400">Total Calls</div>
            <div className="text-sm font-bold text-[#0A192F]">{calls.length}</div>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div>
            <div className="text-[10px] uppercase text-slate-400">Model</div>
            <div className="text-sm font-bold text-purple-700">Llama 3.1 8B</div>
          </div>
        </div>
      </div>

      {/* Call Logs Table */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-[#64748B] flex flex-col items-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#0062E0] mb-3" />
          Loading voice call records and transcripts...
        </div>
      ) : calls.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <Phone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No voice calls recorded yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            When a critical anomaly occurs, or when you trigger a test call from Settings, full conversational transcripts and telemetry will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map((call) => {
            const isExpanded = selectedCallId === call.id;
            const canRetry = call.status === "failed" || call.status === "no-answer" || call.status === "busy";
            const feedback = retryFeedback[call.id];

            return (
              <div
                key={call.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] transition-all overflow-hidden"
              >
                {/* Collapsed Bar */}
                <div
                  onClick={() => setSelectedCallId(isExpanded ? null : call.id)}
                  className="p-5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        call.status === "completed"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}
                    >
                      {call.status === "completed" ? (
                        <PhoneCall className="w-5 h-5" />
                      ) : (
                        <PhoneOff className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0A192F]">
                          {call.provider ? `${call.provider.toUpperCase()} Anomaly Alert Call` : "Cirra AI Voice Call"}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                            call.status
                          )}`}
                        >
                          {call.status}
                        </span>
                        {call.outcome && (
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getOutcomeBadge(
                              call.outcome
                            )}`}
                          >
                            Outcome: {call.outcome}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#64748B] mt-0.5">
                        <span className="font-medium text-slate-700">
                          To: {call.to_number}
                        </span>
                        {call.duration_seconds !== undefined && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3" />
                            {call.duration_seconds}s duration ({call.turn_count || call.transcript.length} turns)
                          </span>
                        )}
                        {call.initiated_at && (
                          <span className="text-[11px]">
                            {new Date(call.initiated_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[#0062E0] hidden sm:inline">
                      {isExpanded ? "Hide Transcript" : "View Transcript"}
                    </span>
                    <div className="text-slate-400 p-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details & Transcript */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-[#F1F5F9] bg-[#F8FAFD] space-y-4">
                    {/* Anomaly Snapshot Box */}
                    {call.anomaly_snapshot && (
                      <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-500" />
                          <span className="font-bold text-slate-800">Triggering Anomaly Snapshot:</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-600 font-medium">
                          {call.anomaly_snapshot.provider && (
                            <span>Provider: <b className="text-slate-800 uppercase">{call.anomaly_snapshot.provider}</b></span>
                          )}
                          {call.anomaly_snapshot.actual_value !== undefined && (
                            <span>Spike Spend: <b className="text-rose-600">${Number(call.anomaly_snapshot.actual_value).toFixed(2)}</b></span>
                          )}
                          {call.anomaly_snapshot.baseline_value !== undefined && (
                            <span>Baseline: <b className="text-slate-800">${Number(call.anomaly_snapshot.baseline_value).toFixed(2)}</b></span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interactive Conversational Transcript */}
                    <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                        <span>Full Audio Call Transcript</span>
                        <span className="text-[11px] font-normal text-slate-400">
                          Recorded via Twilio Programmable Voice
                        </span>
                      </div>

                      {call.transcript && call.transcript.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                          {call.transcript.map((turn, tIdx) => {
                            const isAssistant = turn.role === "assistant";
                            return (
                              <div
                                key={tIdx}
                                className={`flex items-start gap-2.5 ${
                                  isAssistant ? "justify-start" : "justify-end"
                                }`}
                              >
                                {isAssistant && (
                                  <div className="w-7 h-7 rounded-full bg-[#EBF3FE] text-[#0062E0] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#BCD9FC]">
                                    <Bot className="w-4 h-4" />
                                  </div>
                                )}

                                <div
                                  className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                                    isAssistant
                                      ? "bg-[#F1F7FE] text-[#0A192F] rounded-tl-sm border border-[#D6E6FB]"
                                      : "bg-[#0062E0] text-white rounded-tr-sm shadow-sm"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-4 mb-1 text-[10px] font-semibold opacity-75">
                                    <span>{isAssistant ? "Cirra AI Voice Agent" : "Operator (You)"}</span>
                                    {turn.timestamp && (
                                      <span>
                                        {new Date(turn.timestamp).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          second: "2-digit",
                                        })}
                                      </span>
                                    )}
                                  </div>
                                  <p className="whitespace-pre-wrap">{turn.text}</p>
                                </div>

                                {!isAssistant && (
                                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <User className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-400 italic">
                          No conversational turns recorded (call may not have been answered).
                        </div>
                      )}
                    </div>

                    {/* Operational Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-slate-500">
                        {feedback && (
                          <span className="font-semibold text-blue-600">{feedback}</span>
                        )}
                        {!feedback && (
                          <span>
                            Call SID: <span className="font-mono text-[10px]">{call.call_sid || call.id}</span>
                          </span>
                        )}
                      </div>

                      {canRetry && (
                        <button
                          type="button"
                          onClick={() => handleRetry(call)}
                          disabled={isRetrying}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0062E0] text-white text-xs font-bold hover:bg-[#0051B8] shadow-sm transition-all disabled:opacity-50 self-start"
                        >
                          {isRetrying ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          Retry Voice Call
                        </button>
                      )}
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

