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
  Volume2,
  ShieldAlert,
  Loader2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  X,
} from "lucide-react";
import { useVoiceCalls, type VoiceCallItem } from "@/hooks/useVoiceCalls";
import { Topbar } from "@/components/layout/Topbar";

export default function VoiceCallsPage() {
  const [selectedCallId, setSelectedCallId] = React.useState<string | null>(null);
  const [retryFeedback, setRetryFeedback] = React.useState<{ [id: string]: string }>({});

  const { calls, isLoading, retryCall, isRetrying, refetch } = useVoiceCalls();

  const selectedCall = React.useMemo(() => {
    return calls.find((c) => c.id === selectedCallId) || null;
  }, [calls, selectedCallId]);

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

  const formatTimestamp = (ts?: string) => {
    if (!ts) return "";
    if (ts.includes(":") && ts.length <= 8) return ts;
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-white/10 text-white border-white/20 font-bold";
      case "no-answer":
      case "busy":
        return "bg-zinc-800/80 text-zinc-300 border-zinc-700/80";
      case "failed":
        return "bg-zinc-900 text-zinc-300 border-zinc-700/80";
      case "in-progress":
      case "initiated":
        return "bg-white/10 text-white border-white/20 animate-pulse";
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
    }
  };

  const getOutcomeBadge = (outcome?: string) => {
    switch (outcome?.toLowerCase()) {
      case "acknowledged":
        return "bg-zinc-800/80 text-zinc-200 border-zinc-700/80";
      case "escalated":
        return "bg-zinc-800/80 text-white border-zinc-600/80";
      case "no-response":
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
      default:
        return "bg-zinc-900 text-zinc-500 border-zinc-800";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Topbar />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-white font-mono select-none">
        {selectedCall ? (
          /* ══════════════════════════════════════════════════════════════════════
             DEDICATED CONVERSATION TRANSCRIPT VIEW (SINGLE UNIFIED DARK CARD)
          ══════════════════════════════════════════════════════════════════════ */
          <div className="rounded-3xl border border-white/10 overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)] bg-[#090a0f] animate-in fade-in duration-200">
            {/* Unified Top Bar with Call Info & Close X Button */}
            <div className="flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-white/10 bg-[#0c0d12]/95 backdrop-blur-xl">
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedCallId(null)}
                  className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                  title="Back to list of calls"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-mono truncate">
                      {selectedCall.provider ? `${selectedCall.provider.toUpperCase()} Anomaly Alert Call` : "Cirra AI Voice Call"}
                    </h2>
                    <span
                      className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border shrink-0 bg-white/10 text-zinc-200 border-white/20 font-mono tracking-wider"
                    >
                      {selectedCall.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 font-mono truncate">
                    <span>To: <span className="text-zinc-200">{selectedCall.to_number}</span></span>
                    {selectedCall.duration_seconds !== undefined && (
                      <>
                        <span className="text-zinc-600">·</span>
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          {selectedCall.duration_seconds}s duration ({selectedCall.turn_count || selectedCall.transcript.length} turns)
                        </span>
                      </>
                    )}
                    {selectedCall.initiated_at && (
                      <>
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-400">{new Date(selectedCall.initiated_at).toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button in Liquid Glass */}
              <button
                type="button"
                onClick={() => setSelectedCallId(null)}
                className="group relative px-4 py-1.5 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center gap-1.5 text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer shrink-0"
                title="Close transcript and return to call logs"
              >
                <div className="absolute top-0 inset-x-1.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                <X className="w-3.5 h-3.5 relative z-10 text-zinc-300" />
                <span className="relative z-10">Close</span>
              </button>
            </div>

            {/* Chat Conversation Directly Below (Single Unified Dark Area) */}
            <div
              className="p-5 sm:p-7 space-y-4 max-h-[560px] overflow-y-auto relative"
              style={{
                backgroundImage: "url('/cirra-chat-bg-dark.jpg')",
                backgroundRepeat: "repeat",
                backgroundSize: "380px",
                backgroundColor: "#07080b",
              }}
            >
              {/* Audio Call Transcript Banner */}
              <div className="flex items-center justify-between text-[11px] font-mono border-b border-white/10 pb-3 mb-4">
                <span className="font-semibold tracking-wider text-zinc-300 uppercase">
                  Full Audio Call Transcript
                </span>
                <span className="text-zinc-500 text-[10px]">
                  Recorded via Twilio Programmable Voice
                </span>
              </div>

              {selectedCall.transcript && selectedCall.transcript.length > 0 ? (
                selectedCall.transcript.map((turn, tIdx) => {
                  const isAssistant = turn.role === "assistant";
                  return (
                    <div
                      key={tIdx}
                      className={`flex items-start gap-3 ${
                        isAssistant ? "justify-start" : "justify-end"
                      }`}
                    >
                      {/* Assistant Avatar */}
                      {isAssistant && (
                        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/15 shadow-sm">
                          <Bot className="w-4 h-4 text-zinc-200" />
                        </div>
                      )}

                      {/* Message Bubble: Receiver (Dark Obsidian) vs Sender (Charcoal Glass) */}
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.08)] ${
                          isAssistant
                            ? "bg-[#121318]/90 backdrop-blur-xl text-zinc-100 rounded-tl-sm border border-white/10 font-mono"
                            : "bg-[#1a1d24]/90 backdrop-blur-xl text-white rounded-tr-sm border border-white/15 font-mono"
                        }`}
                      >
                        <div
                          className={`flex items-center justify-between gap-6 mb-1.5 text-[10px] ${
                            isAssistant ? "text-zinc-400 font-semibold" : "text-zinc-300 font-semibold"
                          }`}
                        >
                          <span>{isAssistant ? "Cirra AI Voice Agent" : "Operator (You)"}</span>
                          {turn.timestamp && (
                            <span className="text-zinc-500">{formatTimestamp(turn.timestamp)}</span>
                          )}
                        </div>
                        <p className={`whitespace-pre-wrap ${isAssistant ? "text-zinc-200 font-normal leading-relaxed" : "text-zinc-100 font-medium leading-relaxed"}`}>
                          {turn.text}
                        </p>
                      </div>

                      {/* Operator Avatar */}
                      {!isAssistant && (
                        <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center text-xs text-zinc-500 italic font-mono">
                  <div className="inline-block px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 shadow-sm text-zinc-400">
                    No conversational turns recorded (call may not have been answered).
                  </div>
                </div>
              )}
            </div>

            {/* Operational Footer at bottom of the single card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 border-t border-white/10 bg-[#0c0d12]/95 backdrop-blur-xl">
              <div className="text-xs text-zinc-400 font-mono">
                {retryFeedback[selectedCall.id] && (
                  <span className="font-semibold text-white">{retryFeedback[selectedCall.id]}</span>
                )}
                {!retryFeedback[selectedCall.id] && (
                  <span>
                    Call SID: <span className="font-mono text-[11px] text-zinc-300 font-semibold">{selectedCall.call_sid || selectedCall.id}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {(selectedCall.status === "failed" || selectedCall.status === "no-answer" || selectedCall.status === "busy") && (
                  <button
                    type="button"
                    onClick={() => handleRetry(selectedCall)}
                    disabled={isRetrying}
                    className="group relative px-4 py-2 rounded-full overflow-hidden text-xs font-mono font-bold transition-all duration-300 inline-flex items-center gap-1.5 text-white border border-white/25 bg-white/[0.14] hover:bg-white/[0.22] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    <div className="absolute top-0 inset-x-1.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                    {isRetrying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin relative z-10" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 relative z-10" />
                    )}
                    <span className="relative z-10">Retry Voice Call</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedCallId(null)}
                  className="group relative px-4 py-2 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 inline-flex items-center gap-1.5 text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer"
                >
                  <div className="absolute top-0 inset-x-1.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                  <span className="relative z-10">← Back to All Calls</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════════════════
             LIST OF VOICE CALLS VIEW
          ══════════════════════════════════════════════════════════════════════ */
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
                  AI Voice Alert Logs
                </h1>
                <p className="text-sm text-zinc-400 mt-1 font-sans">
                  Real-time conversational voice calls triggered by critical cloud & AI anomalies.
                </p>
              </div>
            </div>

            {/* Feature Showcase Banner */}
            <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-white font-mono">
                  <Volume2 className="w-4 h-4 text-white" /> Autonomous Voice Incident Response
                </div>
                <p className="text-xs text-zinc-400 max-w-2xl font-sans">
                  When runaway API keys or critical spend anomalies hit at 2 AM, Cirra dials the on-call engineer&apos;s phone, speaks real numbers, listens to speech conversationally, and safely executes spoken kill switch approvals.
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
                  return (
                    <div
                      key={call.id}
                      className="bg-[#09090b] rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition-all overflow-hidden"
                    >
                      <div className="p-5 flex items-center justify-between select-none">
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

                        {/* Open Dedicated Transcript Tab Button */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedCallId(call.id)}
                            className="group relative overflow-hidden px-4 py-2 rounded-full text-xs font-mono font-medium text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all"
                            title="Open conversation transcript"
                          >
                            <span className="absolute top-0 inset-x-1.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                            <span className="relative z-10">View Transcript</span>
                            <ArrowRight className="w-3.5 h-3.5 relative z-10 text-zinc-300 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
