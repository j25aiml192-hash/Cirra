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
        return "bg-white text-black border-transparent font-bold";
      case "no-answer":
      case "busy":
        return "bg-zinc-900 text-zinc-300 border-zinc-800";
      case "failed":
        return "bg-zinc-900 text-white border-zinc-700";
      case "in-progress":
      case "initiated":
        return "bg-zinc-800 text-white border-zinc-700 animate-pulse";
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
    }
  };

  const getOutcomeBadge = (outcome?: string) => {
    switch (outcome?.toLowerCase()) {
      case "acknowledged":
        return "bg-zinc-900 text-zinc-200 border-zinc-800";
      case "escalated":
        return "bg-zinc-900 text-white border-zinc-700";
      case "no-response":
        return "bg-zinc-900 text-zinc-500 border-zinc-800";
      default:
        return "bg-zinc-900 text-zinc-500 border-zinc-800";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Topbar />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-white font-mono select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              AI Voice Alert Logs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-white" /> Groq + Twilio Telephony
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1 font-sans">
            Real-time conversational voice calls triggered by critical cloud & AI anomalies.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Voice Agent Active
          </span>
        </div>
      </div>

      {/* Feature Showcase Banner */}
      <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-mono">
            <Volume2 className="w-4 h-4 text-white" /> Autonomous Voice Incident Response
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl font-sans">
            When runaway API keys or critical spend anomalies hit at 2 AM, Cirra dials the on-call engineer's phone, speaks real numbers, listens to speech conversationally, and safely executes spoken kill switch approvals.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-zinc-300 bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800/80 shadow-sm flex-shrink-0 font-mono">
          <div>
            <div className="text-[10px] uppercase text-zinc-500">Total Calls</div>
            <div className="text-sm font-bold text-white">{calls.length}</div>
          </div>
          <div className="w-px h-6 bg-zinc-800" />
          <div>
            <div className="text-[10px] uppercase text-zinc-500">Model</div>
            <div className="text-sm font-bold text-white">Llama 3.1 8B</div>
          </div>
        </div>
      </div>

      {/* Call Logs Table */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-zinc-400 flex flex-col items-center">
          <Loader2 className="w-7 h-7 animate-spin text-white mb-3" />
          Loading voice call records and transcripts...
        </div>
      ) : calls.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-[#09090b]">
          <Phone className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white font-mono">No voice calls recorded yet</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto font-sans">
            When a critical spend anomaly occurs, real-time conversational transcripts and response telemetry will appear here.
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
                className="bg-[#09090b] rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition-all overflow-hidden"
              >
                {/* Collapsed Bar */}
                <div
                  onClick={() => setSelectedCallId(isExpanded ? null : call.id)}
                  className="p-5 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-900/40"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        call.status === "completed"
                          ? "bg-zinc-900 text-white border border-zinc-800"
                          : "bg-zinc-900 text-zinc-400 border border-zinc-800"
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
                        <span className="font-bold text-sm text-white">
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

                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                        <span className="font-medium text-zinc-300">
                          To: {call.to_number}
                        </span>
                        {call.duration_seconds !== undefined && (
                          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <Clock className="w-3 h-3" />
                            {call.duration_seconds}s duration ({call.turn_count || call.transcript.length} turns)
                          </span>
                        )}
                        {call.initiated_at && (
                          <span className="text-[11px] text-zinc-500">
                            {new Date(call.initiated_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="relative overflow-hidden px-3.5 py-1.5 rounded-full text-xs font-mono font-medium text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] hidden sm:inline-flex items-center">
                      <span className="absolute top-0 inset-x-1.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                      <span className="relative z-10">
                        {isExpanded ? "Hide Transcript" : "View Transcript"}
                      </span>
                    </span>
                    <div className="text-zinc-500 p-1">
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
                  <div className="px-5 pb-5 pt-2 border-t border-zinc-800/80 bg-zinc-950/90 space-y-4">
                    {/* Anomaly Snapshot Box */}
                    {call.anomaly_snapshot && (
                      <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-white" />
                          <span className="font-bold text-white font-mono">Triggering Anomaly Snapshot:</span>
                        </div>
                        <div className="flex items-center gap-4 text-zinc-400 font-medium font-mono">
                          {call.anomaly_snapshot.provider && (
                            <span>Provider: <b className="text-white uppercase">{call.anomaly_snapshot.provider}</b></span>
                          )}
                          {call.anomaly_snapshot.actual_value !== undefined && (
                            <span>Spike Spend: <b className="text-white">${Number(call.anomaly_snapshot.actual_value).toFixed(2)}</b></span>
                          )}
                          {call.anomaly_snapshot.baseline_value !== undefined && (
                            <span>Baseline: <b className="text-zinc-300">${Number(call.anomaly_snapshot.baseline_value).toFixed(2)}</b></span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interactive Conversational Transcript */}
                    <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between font-mono">
                        <span>Full Audio Call Transcript</span>
                        <span className="text-[11px] font-normal text-zinc-500">
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
                                  <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center flex-shrink-0 mt-0.5 border border-zinc-800">
                                    <Bot className="w-4 h-4 text-white" />
                                  </div>
                                )}

                                <div
                                  className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                                    isAssistant
                                      ? "bg-zinc-900 text-white rounded-tl-sm border border-zinc-800 font-mono"
                                      : "bg-white text-black rounded-tr-sm font-semibold font-mono"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
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
                                  <div className="w-7 h-7 rounded-full bg-zinc-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <User className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs text-zinc-500 italic font-mono">
                          No conversational turns recorded (call may not have been answered).
                        </div>
                      )}
                    </div>

                    {/* Operational Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-zinc-500 font-mono">
                        {feedback && (
                          <span className="font-semibold text-white">{feedback}</span>
                        )}
                        {!feedback && (
                          <span>
                            Call SID: <span className="font-mono text-[10px] text-zinc-400">{call.call_sid || call.id}</span>
                          </span>
                        )}
                      </div>

                      {canRetry && (
                        <button
                          type="button"
                          onClick={() => handleRetry(call)}
                          disabled={isRetrying}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 self-start font-mono cursor-pointer"
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

