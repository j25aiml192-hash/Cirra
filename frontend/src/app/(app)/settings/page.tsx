"use client";

import * as React from "react";
import {
  Plug,
  Bell,
  Building,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Send,
  RotateCcw,
  RefreshCw,
  Edit2,
  X,
  ShieldAlert,
  Save,
} from "lucide-react";
import { useConnections } from "@/hooks/useConnections";
import { useSettings } from "@/hooks/useSettings";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function UnifiedSettingsPage() {
  const [activeTab, setActiveTab] = React.useState<"connections" | "alerts" | "account">("connections");

  // Connections Hook
  const {
    data: connections,
    isLoading: isConnsLoading,
    createConnection,
    isCreating,
    updateConnection,
    isUpdating: isUpdatingConn,
    deleteConnection,
    isDeleting,
    testConnection,
    isTesting,
  } = useConnections();

  // Settings Hook
  const {
    settings,
    isLoading: isSettingsLoading,
    updateSettings,
    isUpdating: isSavingSettings,
    testSlack,
    isTestingSlack,
    testNtfy,
    isTestingNtfy,
    testCall,
    isTestingCall,
    refetch: refetchSettings,
  } = useSettings();

  // Onboarding Hook (for Account Tab)
  const { state: onboardingState, resetWizard, isResetting } = useOnboarding();

  // Add Connection Modal State
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newProvider, setNewProvider] = React.useState("openai");
  const [newLabel, setNewLabel] = React.useState("");
  const [newApiKey, setNewApiKey] = React.useState("");
  const [newMonthlyCap, setNewMonthlyCap] = React.useState("");

  // Edit Connection Modal State
  const [editingConn, setEditingConn] = React.useState<any | null>(null);
  const [editLabel, setEditLabel] = React.useState("");
  const [editCap, setEditCap] = React.useState("");
  const [editMonitored, setEditMonitored] = React.useState(true);

  // Alerts Form State
  const [alertPhone, setAlertPhone] = React.useState("");
  const [slackWebhook, setSlackWebhook] = React.useState("");
  const [ntfyTopic, setNtfyTopic] = React.useState("");
  const [voiceEnabled, setVoiceEnabled] = React.useState(true);
  const [slackEnabled, setSlackEnabled] = React.useState(true);
  const [ntfyEnabled, setNtfyEnabled] = React.useState(true);
  const [minSevVoice, setMinSevVoice] = React.useState("critical");
  const [minSevSlack, setMinSevSlack] = React.useState("medium");
  const [quietStart, setQuietStart] = React.useState(22);
  const [quietEnd, setQuietEnd] = React.useState(7);
  const [quietTz, setQuietTz] = React.useState("Asia/Kolkata");
  const [cooldown, setCooldown] = React.useState(60);
  const [spendCap, setSpendCap] = React.useState(5000);

  // Feedback notifications
  const [toast, setToast] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  // Sync settings when fetched
  React.useEffect(() => {
    if (settings) {
      if (settings.alert_phone) setAlertPhone(settings.alert_phone);
      if (settings.slack_webhook_url) setSlackWebhook(settings.slack_webhook_url);
      if (settings.ntfy_topic_url) setNtfyTopic(settings.ntfy_topic_url);
      setVoiceEnabled(settings.voice_calls_enabled !== false);
      setSlackEnabled(settings.slack_enabled !== false);
      setNtfyEnabled(settings.ntfy_enabled !== false);
      if (settings.min_severity_voice) setMinSevVoice(settings.min_severity_voice);
      if (settings.min_severity_slack) setMinSevSlack(settings.min_severity_slack);
      if (settings.quiet_hours_start !== undefined) setQuietStart(settings.quiet_hours_start);
      if (settings.quiet_hours_end !== undefined) setQuietEnd(settings.quiet_hours_end);
      if (settings.quiet_hours_tz) setQuietTz(settings.quiet_hours_tz);
      if (settings.anomaly_cooldown_minutes) setCooldown(settings.anomaly_cooldown_minutes);
      if (settings.spend_cap_usd !== undefined) setSpendCap(settings.spend_cap_usd);
    }
  }, [settings]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Add Connection Submit
  const handleAddConnectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiKey.trim()) {
      showToast("API key is required", "error");
      return;
    }
    try {
      await createConnection({
        provider: newProvider,
        name: newLabel.trim() || `${newProvider.toUpperCase()} Key`,
        credentials: {
          api_key: newApiKey.trim(),
          monthly_spend_cap: newMonthlyCap ? parseFloat(newMonthlyCap) : undefined,
        },
      });
      showToast("API connection registered & encrypted");
      setShowAddModal(false);
      setNewApiKey("");
      setNewLabel("");
      setNewMonthlyCap("");
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, "error");
    }
  };

  // Test Connection
  const handleTestConnection = async (id: string) => {
    try {
      showToast("Pinging provider...");
      const res = await testConnection(id);
      if (res.ok) {
        showToast("Connection ping succeeded (200 OK)");
      } else {
        showToast(`Connection failed: ${res.error || "Unreachable"}`, "error");
      }
    } catch (err: any) {
      showToast(`Test error: ${err.message}`, "error");
    }
  };

  // Open Edit Connection Modal
  const openEditModal = (conn: any) => {
    setEditingConn(conn);
    setEditLabel(conn.name || "");
    setEditCap(conn.monthly_spend_cap ? String(conn.monthly_spend_cap) : "");
    setEditMonitored(conn.status !== "paused");
  };

  const handleUpdateConnectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConn) return;
    try {
      await updateConnection({
        id: editingConn.id,
        label: editLabel.trim(),
        monthly_spend_cap: editCap ? parseFloat(editCap) : undefined,
        is_monitored: editMonitored,
      });
      showToast("Connection updated");
      setEditingConn(null);
    } catch (err: any) {
      showToast(`Update error: ${err.message}`, "error");
    }
  };

  // Delete Connection
  const handleDeleteConnection = async (id: string) => {
    if (!confirm("Are you sure you want to remove this connection? Monitoring for this key will stop.")) return;
    try {
      await deleteConnection(id);
      showToast("Connection removed");
    } catch (err: any) {
      showToast(`Delete error: ${err.message}`, "error");
    }
  };

  // Save Alert Settings
  const handleSaveAlerts = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        alert_phone: alertPhone.trim(),
        slack_webhook_url: slackWebhook.trim() || undefined,
        ntfy_topic_url: ntfyTopic.trim() || undefined,
        voice_calls_enabled: voiceEnabled,
        slack_enabled: slackEnabled,
        ntfy_enabled: ntfyEnabled,
        min_severity_voice: minSevVoice,
        min_severity_slack: minSevSlack,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
        quiet_hours_tz: quietTz,
        anomaly_cooldown_minutes: cooldown,
        spend_cap_usd: spendCap,
      });
      showToast("Alert preferences saved");
      refetchSettings();
    } catch (err: any) {
      showToast(`Save error: ${err.message}`, "error");
    }
  };

  // Test Buttons
  const handleTestSlack = async () => {
    try {
      showToast("Sending test Slack message...");
      const res = await testSlack();
      if (res.success) {
        showToast("Slack test alert delivered successfully!");
      } else {
        showToast(`Slack test failed: ${res.error}`, "error");
      }
    } catch (err: any) {
      showToast(`Slack test failed: ${err.message}`, "error");
    }
  };

  const handleTestNtfy = async () => {
    try {
      showToast("Sending test ntfy push notification...");
      const res = await testNtfy();
      if (res.success) {
        showToast("ntfy push notification delivered!");
      } else {
        showToast(`ntfy test failed: ${res.error}`, "error");
      }
    } catch (err: any) {
      showToast(`ntfy test failed: ${err.message}`, "error");
    }
  };

  const handleTestCall = async () => {
    try {
      showToast("Dispatching AI Voice Test Call via Twilio...");
      const res = await testCall();
      showToast(`Voice call initiated! Call ID: ${res.voice_call_id.slice(0, 8)}`);
    } catch (err: any) {
      showToast(`Voice test failed: ${err.message}`, "error");
    }
  };

  // Reset Onboarding
  const handleResetWizard = async () => {
    if (!confirm("Resetting the setup wizard will clear your onboarding progress. Continue?")) return;
    try {
      await resetWizard();
      showToast("Setup wizard reset. Redirecting to onboarding...");
      setTimeout(() => (window.location.href = "/onboarding"), 1000);
    } catch (err: any) {
      showToast(`Reset error: ${err.message}`, "error");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-[#0A192F]">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0A192F]">Settings</h1>
        <p className="text-sm text-[#5A6E85] mt-1">
          Manage cloud API keys, autonomous voice telephony, notification webhooks, and organization account.
        </p>
      </div>

      {/* 3 Main Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0]">
        {[
          { id: "connections", label: "Connections", icon: Plug },
          { id: "alerts", label: "Alert Preferences", icon: Bell },
          { id: "account", label: "Account & Setup", icon: Building },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                isActive
                  ? "border-[#0062E0] text-[#0062E0]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CONNECTIONS */}
      {activeTab === "connections" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Connected API Keys & Cloud Providers</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Keys are stored with AES-256 encryption. Only truncated previews are displayed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0062E0] text-white text-xs font-bold hover:bg-[#0051B8] shadow-sm transition-all self-start"
            >
              <Plus className="w-4 h-4" /> Add Connection
            </button>
          </div>

          {isConnsLoading ? (
            <div className="py-16 text-center text-sm text-[#64748B] flex flex-col items-center">
              <Loader2 className="w-7 h-7 animate-spin text-[#0062E0] mb-2" />
              Loading connected API keys...
            </div>
          ) : !connections || connections.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <Plug className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No API connections registered</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Connect OpenAI, Groq, Anthropic, or AWS keys to start monitoring spend and detecting anomalies.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFD] border-b border-[#E2E8F0] text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Provider</th>
                      <th className="py-3 px-4">Label</th>
                      <th className="py-3 px-4">Key Preview</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Monthly Cap</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {connections.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold uppercase text-[11px] text-[#0062E0]">
                          {c.provider}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{c.name || "API Key"}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {c.provider?.toLowerCase() === "openai" ? "sk-pr••••" : "••••••••"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              (c.status as string) === "active" || c.status === "connected"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {c.status || "active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {c.credentials?.monthly_spend_cap ? `$${c.credentials.monthly_spend_cap}/mo` : "Unlimited"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleTestConnection(c.id)}
                              disabled={isTesting}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
                              title="Test API Key Ping"
                            >
                              Test
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(c)}
                              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteConnection(c.id)}
                              disabled={isDeleting}
                              className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Delete Connection"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADD CONNECTION MODAL */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-base text-slate-900">Add New API Key</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddConnectionSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Provider
                    </label>
                    <select
                      value={newProvider}
                      onChange={(e) => setNewProvider(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="groq">Groq</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="vercel">Vercel</option>
                      <option value="render">Render</option>
                      <option value="github">GitHub</option>
                      <option value="aws">AWS</option>
                      <option value="gcp">Google Cloud</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Label / Description
                    </label>
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="e.g. Production OpenAI API Key"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      API Key or Credential Value <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      placeholder="Paste real key here..."
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Monthly Spend Cap in USD (Optional)
                    </label>
                    <input
                      type="number"
                      value={newMonthlyCap}
                      onChange={(e) => setNewMonthlyCap(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0062E0] text-white text-xs font-bold hover:bg-[#0051B8] shadow-sm disabled:opacity-50"
                    >
                      {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Register Connection
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT CONNECTION MODAL */}
          {editingConn && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-base text-slate-900">Edit Connection</h3>
                  <button
                    type="button"
                    onClick={() => setEditingConn(null)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleUpdateConnectionSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Monthly Spend Cap ($)
                    </label>
                    <input
                      type="number"
                      value={editCap}
                      onChange={(e) => setEditCap(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="editMonitoredCheck"
                      checked={editMonitored}
                      onChange={(e) => setEditMonitored(e.target.checked)}
                      className="rounded border-slate-300 text-[#0062E0] focus:ring-[#0062E0]"
                    />
                    <label htmlFor="editMonitoredCheck" className="text-xs font-semibold text-slate-700">
                      Enable active anomaly monitoring on this key
                    </label>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingConn(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingConn}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0062E0] text-white text-xs font-bold hover:bg-[#0051B8] shadow-sm disabled:opacity-50"
                    >
                      {isUpdatingConn && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALERTS & NOTIFICATIONS */}
      {activeTab === "alerts" && (
        <form onSubmit={handleSaveAlerts} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Alert Dispatch & Telephony</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure real-time voice calls, webhooks, minimum severity thresholds, and quiet hours.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSavingSettings}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0062E0] text-white text-xs font-bold hover:bg-[#0051B8] shadow-sm transition-all self-start disabled:opacity-50"
            >
              {isSavingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Preferences
            </button>
          </div>

          {/* Interactive Test Triggers Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/60 to-purple-50/60 border border-[#BCD9FC] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#0062E0]">
                Integration Health Diagnostics
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Dispatch live test payloads directly to your phone, Slack channel, and push subscription.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTestCall}
                disabled={isTestingCall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 shadow-xs transition-colors disabled:opacity-50"
              >
                {isTestingCall ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Phone className="w-3.5 h-3.5" />
                )}
                Trigger Test Voice Call
              </button>

              <button
                type="button"
                onClick={handleTestSlack}
                disabled={isTestingSlack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition-colors disabled:opacity-50"
              >
                {isTestingSlack ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Test Slack Webhook
              </button>

              <button
                type="button"
                onClick={handleTestNtfy}
                disabled={isTestingNtfy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs transition-colors disabled:opacity-50"
              >
                {isTestingNtfy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bell className="w-3.5 h-3.5" />
                )}
                Test ntfy Push
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-[#F1F5F9]">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">AI Voice Calls</div>
                  <div className="text-[11px] text-slate-500">Autonomous outbound calling</div>
                </div>
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#0062E0] rounded border-slate-300 focus:ring-[#0062E0]"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">Slack Alerts</div>
                  <div className="text-[11px] text-slate-500">Incoming webhook posts</div>
                </div>
                <input
                  type="checkbox"
                  checked={slackEnabled}
                  onChange={(e) => setSlackEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#0062E0] rounded border-slate-300 focus:ring-[#0062E0]"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">ntfy Push</div>
                  <div className="text-[11px] text-slate-500">Mobile & browser alerts</div>
                </div>
                <input
                  type="checkbox"
                  checked={ntfyEnabled}
                  onChange={(e) => setNtfyEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#0062E0] rounded border-slate-300 focus:ring-[#0062E0]"
                />
              </div>
            </div>

            {/* Inputs & Thresholds */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  AI Emergency Phone Number (E.164)
                </label>
                <input
                  type="tel"
                  value={alertPhone}
                  onChange={(e) => setAlertPhone(e.target.value)}
                  placeholder="+918910095002"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Global Monthly Spend Cap ($)
                </label>
                <input
                  type="number"
                  value={spendCap}
                  onChange={(e) => setSpendCap(Number(e.target.value))}
                  placeholder="5000"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slack Webhook URL
                </label>
                <input
                  type="text"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ntfy Topic URL
                </label>
                <input
                  type="text"
                  value={ntfyTopic}
                  onChange={(e) => setNtfyTopic(e.target.value)}
                  placeholder="https://ntfy.sh/cirra-alerts-hiten"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Minimum Severity for Voice Calls
                </label>
                <select
                  value={minSevVoice}
                  onChange={(e) => setMinSevVoice(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                >
                  <option value="critical">Critical Only</option>
                  <option value="high">High & Critical</option>
                  <option value="medium">Medium, High & Critical</option>
                  <option value="low">All Severities</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Minimum Severity for Slack Alerts
                </label>
                <select
                  value={minSevSlack}
                  onChange={(e) => setMinSevSlack(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                >
                  <option value="critical">Critical Only</option>
                  <option value="high">High & Critical</option>
                  <option value="medium">Medium, High & Critical</option>
                  <option value="low">All Severities</option>
                </select>
              </div>
            </div>

            {/* Quiet Hours & Cooldown */}
            <div className="pt-4 border-t border-[#F1F5F9] grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quiet Hours Start (Hour 0-23)
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={quietStart}
                  onChange={(e) => setQuietStart(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quiet Hours End (Hour 0-23)
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  value={quietTz}
                  onChange={(e) => setQuietTz(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Anomaly Cooldown (Minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  value={cooldown}
                  onChange={(e) => setCooldown(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0062E0]"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: ACCOUNT & ONBOARDING */}
      {activeTab === "account" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800">Organization & Account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tenant metadata captured during initial onboarding setup.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] uppercase font-bold text-slate-400">Company Name</div>
                <div className="text-base font-bold text-slate-800 mt-1">
                  {onboardingState?.company_name || "Acme AI Corp"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] uppercase font-bold text-slate-400">Company Size</div>
                <div className="text-base font-bold uppercase text-slate-800 mt-1">
                  {onboardingState?.company_size || "Startup"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] uppercase font-bold text-slate-400">Primary Objective</div>
                <div className="text-base font-bold uppercase text-slate-800 mt-1">
                  {onboardingState?.primary_use_case || "Complete Platform"}
                </div>
              </div>
            </div>

            {/* Developer Reset Section */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-rose-600 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Reset Setup Wizard (Development Only)
                </div>
                <p className="text-xs text-slate-500 mt-0.5 max-w-md">
                  Clears the tenant onboarding status and allows you to walk through the 5-step onboarding wizard again.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetWizard}
                disabled={isResetting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors disabled:opacity-50 self-start"
              >
                {isResetting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                Reset Onboarding Wizard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
