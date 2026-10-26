"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plug,
  Users,
  User,
  Plus,
  Check,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  SlidersHorizontal,
  Bell,
  Key,
  ShieldAlert,
  Lock,
  Copy,
  Clock,
  ExternalLink,
  Shield,
  Mail,
  UserPlus,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { useConnections } from "@/hooks/useConnections";
import type { Connection, TeamMember } from "@/types";
import { cn } from "@/lib/utils";

export type SettingsMainTab = "connections" | "team" | "profile";

type ProviderKey =
  | "aws"
  | "gcp"
  | "azure"
  | "kubernetes"
  | "openai"
  | "anthropic"
  | "bedrock"
  | "vertex";

interface ProviderOption {
  key: ProviderKey;
  name: string;
  category: "Cloud" | "AI" | "Infra";
  letter: string;
  color: string;
}

const providerOptions: ProviderOption[] = [
  { key: "aws", name: "Amazon Web Services", category: "Cloud", letter: "A", color: "#F59E0B" },
  { key: "gcp", name: "Google Cloud Platform", category: "Cloud", letter: "G", color: "#3B82F6" },
  { key: "azure", name: "Microsoft Azure", category: "Cloud", letter: "M", color: "#0284C7" },
  { key: "kubernetes", name: "Kubernetes Cluster", category: "Infra", letter: "K", color: "#326CE5" },
  { key: "openai", name: "OpenAI Platform", category: "AI", letter: "O", color: "#10B981" },
  { key: "anthropic", name: "Anthropic Claude", category: "AI", letter: "C", color: "#7C3AED" },
  { key: "bedrock", name: "AWS Bedrock", category: "AI", letter: "B", color: "#F97316" },
  { key: "vertex", name: "Google Vertex AI", category: "AI", letter: "V", color: "#6366F1" },
];

const initialMembers: TeamMember[] = [
  {
    id: "mem-1",
    name: "Hiten Kumar",
    email: "hiten@cirra.dev",
    role: "owner",
    status: "active",
    avatarInitials: "HK",
  },
];

interface UnifiedSettingsProps {
  initialTab?: SettingsMainTab;
}

function SettingsContent({ initialTab = "connections" }: UnifiedSettingsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams?.get("tab") as SettingsMainTab | null;
  const [activeTab, setActiveTab] = useState<SettingsMainTab>(
    tabParam && ["connections", "team", "profile"].includes(tabParam)
      ? tabParam
      : initialTab
  );

  useEffect(() => {
    if (tabParam && ["connections", "team", "profile"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const switchTab = (tab: SettingsMainTab) => {
    setActiveTab(tab);
    router.replace(`/settings?tab=${tab}`, { scroll: false });
  };

  /* -------------------------------------------------------------------------- */
  /* 1. Connections State                                                       */
  /* -------------------------------------------------------------------------- */
  const { data: connectionsData } = useConnections();
  const [localConnections, setLocalConnections] = useState<Connection[]>(connectionsData ?? []);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey | null>(null);
  const [connName, setConnName] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [providerFilter, setProviderFilter] = useState<"all" | "Cloud" | "AI" | "Infra">("all");

  useEffect(() => {
    if (connectionsData) setLocalConnections(connectionsData);
  }, [connectionsData]);

  const handleTestConnection = () => {
    setTestStatus("testing");
    setTimeout(() => {
      setTestStatus("success");
    }, 1000);
  };

  const handleSaveConnection = () => {
    if (!selectedProvider || testStatus !== "success") return;
    const prov = providerOptions.find((p) => p.key === selectedProvider);
    const newConn: Connection = {
      id: `conn-${Date.now()}`,
      tenant_id: "tenant-acme",
      name: connName || `${prov?.name} Integration`,
      provider: selectedProvider,
      status: "connected",
      last_synced_at: "Just now",
    };
    setLocalConnections((prev) => [newConn, ...prev]);
    setSheetOpen(false);
    setSelectedProvider(null);
    setConnName("");
    setTestStatus("idle");
  };

  const handleRemoveConnection = (id: string) => {
    setLocalConnections((prev) => prev.filter((c) => c.id !== id));
  };

  const getProviderInfo = (providerStr: string) => {
    return (
      providerOptions.find((p) => p.key === providerStr) ?? {
        key: providerStr as ProviderKey,
        name: providerStr.toUpperCase(),
        category: "Cloud",
        letter: providerStr.charAt(0).toUpperCase(),
        color: "#6366F1",
      }
    );
  };

  const filteredConnections = localConnections.filter((conn) => {
    if (providerFilter === "all") return true;
    const prov = getProviderInfo(conn.provider);
    return prov.category === providerFilter;
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Team State                                                              */
  /* -------------------------------------------------------------------------- */
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("viewer");

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const initials = (inviteName || inviteEmail)
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const newMember: TeamMember = {
      id: `mem-${Date.now()}`,
      name: inviteName || inviteEmail.split("@")[0] || "Member",
      email: inviteEmail,
      role: inviteRole,
      status: "invited",
      avatarInitials: initials,
    };

    setMembers((prev) => [...prev, newMember]);
    setInviteName("");
    setInviteEmail("");
    setShowInviteForm(false);
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleRoleChange = (id: string, newRole: TeamMember["role"]) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole } : m))
    );
  };

  /* -------------------------------------------------------------------------- */
  /* 3. Profile & Preferences State                                             */
  /* -------------------------------------------------------------------------- */
  const [fullName, setFullName] = useState("Hiten Kumar");
  const [email] = useState("hiten@cirra.dev");
  const [timezone, setTimezone] = useState("America/New_York (EST)");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [defaultPeriod, setDefaultPeriod] = useState("30d");
  const [profileSaved, setProfileSaved] = useState(false);

  const [notifyAnomaly, setNotifyAnomaly] = useState(true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(true);
  const [notifySlackSavings, setNotifySlackSavings] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState(
    "https://hooks.slack.com/services/T048A/B072C/xK94lPQ118"
  );
  const [notificationsSaved, setNotificationsSaved] = useState(false);
  const [testWebhookStatus, setTestWebhookStatus] = useState<"idle" | "testing" | "sent">("idle");

  const [copiedKey, setCopiedKey] = useState(false);
  const [keyRotated, setKeyRotated] = useState(false);
  const apiKey = "cirra_live_8f3d9a10c74be2e0081bb45b";

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2400);
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setNotificationsSaved(true);
    setTimeout(() => setNotificationsSaved(false), 2400);
  };

  const handleTestWebhook = () => {
    setTestWebhookStatus("testing");
    setTimeout(() => {
      setTestWebhookStatus("sent");
      setTimeout(() => setTestWebhookStatus("idle"), 2500);
    }, 800);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRotateKey = () => {
    setKeyRotated(true);
    setTimeout(() => setKeyRotated(false), 2400);
  };

  return (
    <div className="space-y-6">
      {/* Topbar Component */}
      <Topbar
        title="Settings & Workspace"
        subtitle="Manage cloud connections, team access permissions, and personal preferences"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#CBD5E1] pb-4">
          <div className="flex items-center gap-1.5 p-1 bg-white/80 backdrop-blur-md rounded-2xl border border-[#D6E4F5] shadow-xs">
            <button
              type="button"
              onClick={() => switchTab("connections")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                activeTab === "connections"
                  ? "bg-[#0B1527] text-white shadow-sm"
                  : "text-[#5A6E85] hover:text-[#0A192F] hover:bg-[#F0F4F8]"
              )}
            >
              <Plug className="w-4 h-4" />
              <span>Connections</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold ml-1",
                  activeTab === "connections"
                    ? "bg-white/20 text-white"
                    : "bg-[#E2E8F0] text-[#334155]"
                )}
              >
                {localConnections.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => switchTab("team")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                activeTab === "team"
                  ? "bg-[#0B1527] text-white shadow-sm"
                  : "text-[#5A6E85] hover:text-[#0A192F] hover:bg-[#F0F4F8]"
              )}
            >
              <Users className="w-4 h-4" />
              <span>Team & Access</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold ml-1",
                  activeTab === "team"
                    ? "bg-white/20 text-white"
                    : "bg-[#E2E8F0] text-[#334155]"
                )}
              >
                {members.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => switchTab("profile")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                activeTab === "profile"
                  ? "bg-[#0B1527] text-white shadow-sm"
                  : "text-[#5A6E85] hover:text-[#0A192F] hover:bg-[#F0F4F8]"
              )}
            >
              <User className="w-4 h-4" />
              <span>Profile & Security</span>
            </button>
          </div>

          {/* Action button corresponding to active tab */}
          {activeTab === "connections" && (
            <button
              type="button"
              onClick={() => {
                setSheetOpen(true);
                setSelectedProvider("aws");
                setTestStatus("idle");
              }}
              className="px-4 py-2 rounded-xl bg-[#0062E0] text-white font-medium text-xs flex items-center gap-2 hover:bg-[#0052C2] shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Connect Provider
            </button>
          )}

          {activeTab === "team" && (
            <button
              type="button"
              onClick={() => setShowInviteForm(true)}
              className="px-4 py-2 rounded-xl bg-[#0062E0] text-white font-medium text-xs flex items-center gap-2 hover:bg-[#0052C2] shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" /> Invite Member
            </button>
          )}
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: CONNECTIONS & INTEGRATIONS                                     */}
        {/* ==================================================================== */}
        {activeTab === "connections" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              {(["all", "Cloud", "AI", "Infra"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setProviderFilter(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                    providerFilter === cat
                      ? "bg-white text-[#0A192F] shadow-xs border border-[#CBD5E1]"
                      : "text-[#64748B] hover:text-[#0A192F] hover:bg-white/60"
                  )}
                >
                  {cat === "all" ? "All Providers" : cat}
                </button>
              ))}
            </div>

            {/* Connection Cards Grid */}
            {filteredConnections.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#D6E4F5] p-10 sm:p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F0F5FD] border border-[#D6E4F5] flex items-center justify-center text-[#0062E0] mx-auto">
                  <Plug className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-[#0A192F] text-base">No active provider connections</h4>
                <p className="text-xs text-[#64748B] max-w-md mx-auto">
                  Connect your AWS CUR 2.0, GCP BigQuery export, Azure, OpenAI, or Anthropic accounts to stream live FOCUS 1.0 cost telemetry.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSheetOpen(true);
                    setSelectedProvider("aws");
                    setTestStatus("idle");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0062E0] text-white text-xs font-semibold hover:bg-[#0052C2] transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Connect Provider
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredConnections.map((conn) => {
                  const prov = getProviderInfo(conn.provider);
                  const isError = conn.status === "error";

                  return (
                    <div
                      key={conn.id}
                      className={cn(
                        "rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between bg-white border border-[#D6E4F5] hover:border-[#BCD4F0] hover:shadow-sm",
                        isError && "bg-red-50/50 border-red-200"
                      )}
                      style={{
                        borderLeft: isError ? "4px solid #EF4444" : undefined,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0"
                            style={{ background: prov.color }}
                          >
                            {prov.letter}
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#0A192F] text-sm leading-tight">
                              {conn.name}
                            </h4>
                            <span className="text-xs text-[#64748B]">{prov.name}</span>
                          </div>
                        </div>

                        <Badge
                          variant={
                            conn.status === "connected"
                              ? "success"
                              : conn.status === "error"
                              ? "danger"
                              : "neutral"
                          }
                          className="capitalize text-[10px]"
                        >
                          {conn.status}
                        </Badge>
                      </div>

                      {isError && conn.errorMessage && (
                        <div className="mt-3 text-xs text-red-700 bg-red-100/60 p-2.5 rounded-lg border border-red-200/50 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{conn.errorMessage}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#EDF2F7]">
                        <span className="text-xs text-[#64748B]">
                          Last synced {conn.last_synced_at ?? "never"}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="px-2.5 py-1 text-xs font-medium text-[#475569] hover:text-[#0A192F] hover:bg-[#F0F5FD] rounded-md transition-colors"
                          >
                            Test
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveConnection(conn.id)}
                            className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Disconnect Provider"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: TEAM & PERMISSIONS                                            */}
        {/* ==================================================================== */}
        {activeTab === "team" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#D6E4F5] shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-[#EDF2F7] flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-[#0A192F] text-sm">Active Organization Members</h3>
                  <p className="text-xs text-[#64748B]">Manage RBAC access tiers across FOCUS datasets</p>
                </div>
                <span className="text-xs text-[#64748B] font-mono">
                  {members.length} seats used
                </span>
              </div>

              <div className="divide-y divide-[#EDF2F7]">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#0B1527] text-white flex items-center justify-center text-xs font-bold shadow-xs flex-shrink-0">
                        {member.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#0A192F] text-sm truncate">
                            {member.name}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                              member.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            )}
                          >
                            {member.status}
                          </span>
                        </div>
                        <span className="text-xs text-[#64748B] truncate block">
                          {member.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.id, e.target.value as TeamMember["role"])
                        }
                        className="h-8 px-2.5 text-xs font-medium rounded-lg border border-[#D6E4F5] bg-white text-[#334155] focus:outline-none focus:border-[#0062E0]"
                      >
                        <option value="owner">Owner (Full)</option>
                        <option value="admin">Admin (Manage)</option>
                        <option value="viewer">Viewer (Read-Only)</option>
                      </select>

                      {member.role !== "owner" && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: PROFILE, PREFERENCES & SECURITY                               */}
        {/* ==================================================================== */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* Left 2 Cols: Personal info & Preferences */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Details */}
              <div className="bg-white rounded-2xl border border-[#D6E4F5] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-3">
                  <div>
                    <h3 className="font-bold text-[#0A192F] text-sm">Personal Credentials</h3>
                    <p className="text-xs text-[#64748B]">Update profile information and localization settings</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0062E0] border border-blue-200">
                    Administrator
                  </span>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#334155] block mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-9 px-3 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F] focus:outline-none focus:border-[#0062E0]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#334155] block mb-1">
                        Work Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full h-9 px-3 text-xs rounded-lg border border-[#E2E8F0] bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#334155] block mb-1">
                        Primary Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full h-9 px-3 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F] focus:outline-none focus:border-[#0062E0]"
                      >
                        <option value="America/New_York (EST)">America/New_York (EST)</option>
                        <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
                        <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                        <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                        <option value="Asia/Tokyo (JST)">Asia/Tokyo (JST)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#334155] block mb-1">
                        Reporting Currency
                      </label>
                      <select
                        value={defaultCurrency}
                        onChange={(e) => setDefaultCurrency(e.target.value)}
                        className="w-full h-9 px-3 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F] focus:outline-none focus:border-[#0062E0]"
                      >
                        <option value="USD">USD ($) — Default</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    {profileSaved ? (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Profile changes saved
                      </span>
                    ) : (
                      <span className="text-xs text-[#64748B]">Changes reflect across all reports</span>
                    )}

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#0062E0] text-white font-medium text-xs hover:bg-[#0052C2] transition-colors shadow-xs"
                    >
                      Save Profile
                    </button>
                  </div>
                </form>
              </div>

              {/* Notifications & Alert Webhooks */}
              <div className="bg-white rounded-2xl border border-[#D6E4F5] p-6 shadow-xs space-y-4">
                <div className="border-b border-[#EDF2F7] pb-3">
                  <h3 className="font-bold text-[#0A192F] text-sm">Automated Alerts & Webhooks</h3>
                  <p className="text-xs text-[#64748B]">Real-time Sentinel threshold dispatches to Slack / Opsgenie</p>
                </div>

                <form onSubmit={handleSaveNotifications} className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 rounded-xl border border-[#EDF2F7] hover:bg-slate-50 cursor-pointer transition-colors">
                      <div>
                        <span className="text-xs font-semibold text-[#0A192F] block">
                          Anomaly Sentinel Alerts
                        </span>
                        <span className="text-[11px] text-[#64748B]">
                          Instant alert when cost spike exceeds 15% hourly velocity
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyAnomaly}
                        onChange={(e) => setNotifyAnomaly(e.target.checked)}
                        className="w-4 h-4 text-[#0062E0] rounded focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-[#EDF2F7] hover:bg-slate-50 cursor-pointer transition-colors">
                      <div>
                        <span className="text-xs font-semibold text-[#0A192F] block">
                          Weekly Cost Optimization Digest
                        </span>
                        <span className="text-[11px] text-[#64748B]">
                          Summary of idle instances, orphaned volumes, and AI token savings
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyWeeklyDigest}
                        onChange={(e) => setNotifyWeeklyDigest(e.target.checked)}
                        className="w-4 h-4 text-[#0062E0] rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#334155] block mb-1">
                      Slack Webhook URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="flex-1 h-9 px-3 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F] font-mono focus:outline-none focus:border-[#0062E0]"
                      />
                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={testWebhookStatus === "testing"}
                        className="px-3 py-2 rounded-lg border border-[#CBD5E1] bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
                      >
                        {testWebhookStatus === "testing" ? "Pinging..." : testWebhookStatus === "sent" ? "Sent ✓" : "Test Ping"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    {notificationsSaved ? (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Notification preferences saved
                      </span>
                    ) : (
                      <span className="text-xs text-[#64748B]">Webhooks verify with TLS 1.3 payload</span>
                    )}

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#0062E0] text-white font-medium text-xs hover:bg-[#0052C2] transition-colors shadow-xs"
                    >
                      Save Preferences
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right 1 Col: Security, API Key, Danger Zone */}
            <div className="space-y-6">
              {/* API Credentials Card */}
              <div className="bg-white rounded-2xl border border-[#D6E4F5] p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-[#EDF2F7] pb-3">
                  <Key className="w-4 h-4 text-[#0062E0]" />
                  <h3 className="font-bold text-[#0A192F] text-sm">Tenant API Access Key</h3>
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed">
                  Use this secret key to stream FOCUS 1.0 JSON telemetry directly from Terraform or CI/CD pipelines.
                </p>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-[#E2E8F0] flex items-center justify-between font-mono text-xs">
                  <span className="text-[#334155] truncate pr-2">{apiKey}</span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="p-1 rounded text-slate-500 hover:text-[#0062E0] hover:bg-white transition-colors"
                    title="Copy API Key"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleRotateKey}
                  className="w-full py-2 rounded-lg border border-[#CBD5E1] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {keyRotated ? "Key Rotated Successfully ✓" : "Rotate API Secret Key"}
                </button>
              </div>

              {/* Danger Zone */}
              <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-rose-700">
                  <ShieldAlert className="w-4 h-4" />
                  <h4 className="font-bold text-sm">Organization Danger Zone</h4>
                </div>
                <p className="text-xs text-rose-600 leading-relaxed">
                  Permanently purge historical billing datasets or reset telemetry ingestion schedules.
                </p>
                <button
                  type="button"
                  onClick={() => alert("Purge routine simulated in sandbox.")}
                  className="w-full py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs"
                >
                  Purge Telemetry History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* DRAWER: ADD CONNECTION MODAL                                         */}
      {/* ==================================================================== */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSheetOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white border-l border-[#D6E4F5] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-[#D6E4F5] pb-4">
                <div>
                  <h3 className="font-bold text-[#0A192F] text-lg">Connect New Provider</h3>
                  <p className="text-xs text-[#475569] mt-0.5">
                    Ingested with read-only least-privilege credentials
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="p-1 text-[#64748B] hover:text-[#334155] rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Provider grid */}
              <div className="mt-5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-2.5">
                  Select Provider
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {providerOptions.map((prov) => {
                    const isSelected = selectedProvider === prov.key;
                    return (
                      <button
                        key={prov.key}
                        type="button"
                        onClick={() => {
                          setSelectedProvider(prov.key);
                          setTestStatus("idle");
                        }}
                        className={cn(
                          "p-3 rounded-xl border text-left flex items-center justify-between transition-all",
                          isSelected
                            ? "border-[#0062E0] bg-[#EBF3FE] ring-1 ring-[#0062E0]"
                            : "border-[#D6E4F5] hover:border-[#BCD4F0] bg-white"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[11px] font-bold"
                            style={{ background: prov.color }}
                          >
                            {prov.letter}
                          </div>
                          <span className="text-xs font-semibold text-[#334155]">{prov.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#0062E0]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Credential Fields */}
              {selectedProvider && (
                <div className="mt-6 space-y-3.5 pt-4 border-t border-[#D6E4F5]">
                  <div>
                    <label className="text-xs font-semibold text-[#334155] block mb-1">
                      Connection Nickname
                    </label>
                    <input
                      value={connName}
                      onChange={(e) => setConnName(e.target.value)}
                      placeholder="e.g. Production AWS CUR"
                      className="w-full h-9 px-3 text-xs rounded-lg border border-[#D6E4F5] bg-white focus:outline-none focus:border-[#0062E0]"
                    />
                  </div>

                  {["aws", "bedrock"].includes(selectedProvider) && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-[#334155] block mb-1">
                          Role ARN (Read-Only)
                        </label>
                        <input
                          placeholder="arn:aws:iam::123456789012:role/CirraCostReader"
                          className="w-full h-9 px-3 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F] focus:outline-none focus:border-[#0062E0]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#334155] block mb-1">
                          External ID
                        </label>
                        <input
                          defaultValue="cirra-tenant-token-98f2b"
                          readOnly
                          className="w-full h-9 px-3 text-xs rounded-lg border border-[#D6E4F5] bg-[#F8FAFD] text-[#475569]"
                        />
                      </div>
                    </>
                  )}

                  {["openai", "anthropic"].includes(selectedProvider) && (
                    <div>
                      <label className="text-xs font-semibold text-[#334155] block mb-1">
                        Admin Usage Read-Only API Key
                      </label>
                      <input
                        type="password"
                        placeholder="sk-admin-..."
                        className="w-full h-9 px-3 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F] focus:outline-none focus:border-[#0062E0] font-mono"
                      />
                    </div>
                  )}

                  {["gcp", "vertex"].includes(selectedProvider) && (
                    <div>
                      <label className="text-xs font-semibold text-[#334155] block mb-1">
                        Service Account JSON Key
                      </label>
                      <textarea
                        rows={3}
                        placeholder='{"type": "service_account", ...}'
                        className="w-full p-2.5 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F] focus:outline-none focus:border-[#0062E0] font-mono"
                      />
                    </div>
                  )}

                  {selectedProvider === "kubernetes" && (
                    <div>
                      <label className="text-xs font-semibold text-[#334155] block mb-1">
                        Prometheus / OpenCost Endpoint
                      </label>
                      <input
                        placeholder="https://opencost.internal.cluster:9003"
                        className="w-full h-9 px-3 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F] focus:outline-none focus:border-[#0062E0]"
                      />
                    </div>
                  )}

                  {/* Inline Test Connection button & status */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testStatus === "testing"}
                      className="w-full h-9 rounded-lg border border-[#D6E4F5] bg-[#F8FAFD] text-[#334155] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#F0F5FD] transition-colors"
                    >
                      {testStatus === "testing" ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing handshake...</span>
                        </>
                      ) : (
                        <span>Test Connection Handshake</span>
                      )}
                    </button>

                    {testStatus === "success" && (
                      <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Connection test successful! Ready to save.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#D6E4F5] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#475569] hover:bg-[#F0F5FD]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConnection}
                disabled={testStatus !== "success"}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#0062E0] text-white hover:bg-[#0052C2] disabled:opacity-40 transition-colors shadow-sm"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DRAWER: INVITE TEAM MEMBER MODAL                                     */}
      {/* ==================================================================== */}
      {showInviteForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowInviteForm(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white border-l border-[#D6E4F5] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-[#D6E4F5] pb-4">
                <div>
                  <h3 className="font-bold text-[#0A192F] text-lg">Invite Team Member</h3>
                  <p className="text-xs text-[#475569] mt-0.5">
                    Send invitation email with organization RBAC permissions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="p-1 text-[#64748B] hover:text-[#334155] rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendInvite} id="invite-form" className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">
                    Member Name
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full h-9 px-3 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F] focus:outline-none focus:border-[#0062E0]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full h-9 px-3 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F] focus:outline-none focus:border-[#0062E0]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] block mb-1">
                    Access Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as TeamMember["role"])}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F] focus:outline-none focus:border-[#0062E0]"
                  >
                    <option value="viewer">Viewer — Read-only telemetry and dashboards</option>
                    <option value="admin">Admin — Manage connections, budgets, and alerts</option>
                    <option value="owner">Owner — Full billing & organization management</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-[#D6E4F5] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#475569] hover:bg-[#F0F5FD]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="invite-form"
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#0062E0] text-white hover:bg-[#0052C2] transition-colors shadow-sm"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function UnifiedSettings({ initialTab = "connections" }: UnifiedSettingsProps) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading workspace settings...
        </div>
      }
    >
      <SettingsContent initialTab={initialTab} />
    </Suspense>
  );
}
