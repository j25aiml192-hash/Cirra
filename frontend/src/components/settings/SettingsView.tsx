"use client";

import React, { useState } from "react";
import {
  User,
  SlidersHorizontal,
  Bell,
  Key,
  ShieldAlert,
  Check,
  Lock,
  AlertTriangle,
  Copy,
  CheckCheck,
  RefreshCw,
  Clock,
  ShieldCheck,
  Cloud,
  Cpu,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";

type SettingsTab = "profile" | "preferences" | "notifications" | "security" | "danger";

interface SettingsViewProps {
  initialTab?: SettingsTab;
}

export function SettingsView({ initialTab = "profile" }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  /* -------------------------------------------------------------------------- */
  /* 1. Profile State                                                           */
  /* -------------------------------------------------------------------------- */
  const [fullName, setFullName] = useState("Hiten Kumar");
  const [timezone, setTimezone] = useState("America/New_York (EST)");
  const [profileSaved, setProfileSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2400);
  };

  /* -------------------------------------------------------------------------- */
  /* 2. Preferences State                                                       */
  /* -------------------------------------------------------------------------- */
  const [defaultPeriod, setDefaultPeriod] = useState("30d");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [compactNumbers, setCompactNumbers] = useState(true);
  const [enabledProviders, setEnabledProviders] = useState<string[]>([
    "AWS",
    "GCP",
    "OpenAI",
    "Anthropic",
  ]);
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  const toggleProvider = (provider: string) => {
    setEnabledProviders((prev) =>
      prev.includes(provider)
        ? prev.filter((p) => p !== provider)
        : [...prev, provider]
    );
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setPreferencesSaved(true);
    setTimeout(() => setPreferencesSaved(false), 2400);
  };

  /* -------------------------------------------------------------------------- */
  /* 3. Notifications State                                                     */
  /* -------------------------------------------------------------------------- */
  const [notifyAnomaly, setNotifyAnomaly] = useState(true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(true);
  const [notifyHealthReports, setNotifyHealthReports] = useState(false);
  const [notifySlackSavings, setNotifySlackSavings] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState(
    "https://hooks.slack.com/services/T048A/B072C/xK94lPQ118"
  );
  const [notificationsSaved, setNotificationsSaved] = useState(false);
  const [testWebhookStatus, setTestWebhookStatus] = useState<
    "idle" | "testing" | "sent"
  >("idle");

  const handleTestWebhook = () => {
    setTestWebhookStatus("testing");
    setTimeout(() => {
      setTestWebhookStatus("sent");
      setTimeout(() => setTestWebhookStatus("idle"), 2500);
    }, 800);
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setNotificationsSaved(true);
    setTimeout(() => setNotificationsSaved(false), 2400);
  };

  /* -------------------------------------------------------------------------- */
  /* 4. Security & API State                                                    */
  /* -------------------------------------------------------------------------- */
  const [copiedKey, setCopiedKey] = useState(false);
  const [keyRotated, setKeyRotated] = useState(false);
  const apiKey = "cirra_live_8f3d9a10c74be2e0081bb45b";

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRotateKey = () => {
    setKeyRotated(true);
    setTimeout(() => setKeyRotated(false), 2400);
  };

  /* -------------------------------------------------------------------------- */
  /* 5. Danger Zone State                                                       */
  /* -------------------------------------------------------------------------- */
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteTenant = () => {
    if (deleteConfirmText !== "DELETE") return;
    setIsDeleting(true);
    setTimeout(() => {
      alert("Tenant data eradication routine simulated.");
      setIsDeleting(false);
      setDeleteConfirmText("");
    }, 1200);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* 1. Page Header (with Topbar search, date & avatar) */}
      <Topbar
        title="Settings"
        subtitle="Manage individual credentials, organization profiles, and alert thresholds."
      />

      {/* 2. Master-Detail Layout Structure */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Sub-Navigation Menu (Width: 220px–240px) */}
        <nav
          className="w-full md:w-60 flex-shrink-0 cirra-card p-2.5 space-y-1 bg-white/90"
          aria-label="Settings navigation"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#7E93AB] px-3 py-1.5">
            Settings Menu
          </div>

          {/* Personal Profile Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "profile"
                ? "bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] shadow-xs"
                : "text-[#5A6E85] hover:text-[#0A192F] hover:bg-[#F8FAFD] border border-transparent"
            }`}
          >
            <User className="w-4 h-4 flex-shrink-0" />
            <span>Personal Profile</span>
          </button>

          {/* Preferences Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "preferences"
                ? "bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] shadow-xs"
                : "text-[#5A6E85] hover:text-[#0A192F] hover:bg-[#F8FAFD] border border-transparent"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 flex-shrink-0" />
            <span>Preferences</span>
          </button>

          {/* Notifications Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "notifications"
                ? "bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] shadow-xs"
                : "text-[#5A6E85] hover:text-[#0A192F] hover:bg-[#F8FAFD] border border-transparent"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 flex-shrink-0" />
              <span>Notifications</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              Guard
            </span>
          </button>

          {/* Security & API Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "security"
                ? "bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] shadow-xs"
                : "text-[#5A6E85] hover:text-[#0A192F] hover:bg-[#F8FAFD] border border-transparent"
            }`}
          >
            <Key className="w-4 h-4 flex-shrink-0" />
            <span>Security & API</span>
          </button>

          {/* Divider */}
          <div className="border-t border-[#D6E4F5]/70 my-1.5" />

          {/* Danger Zone Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("danger")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "danger"
                ? "bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] shadow-xs"
                : "text-[#DC2626]/85 hover:text-[#DC2626] hover:bg-[#FEF2F2] border border-transparent"
            }`}
          >
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-[#DC2626]" />
            <span>Danger Zone</span>
          </button>
        </nav>

        {/* Right Main Content Panel */}
        <div className="flex-1 w-full min-w-0">
          {/* TAB 1: PERSONAL PROFILE */}
          {activeTab === "profile" && (
            <div className="cirra-card p-6 sm:p-7 space-y-6">
              <div className="border-b border-[#EBF2FA] pb-4">
                <h3 className="font-bold text-[#0A192F] text-lg tracking-tight">
                  Personal Profile
                </h3>
                <p className="text-xs text-[#5A6E85] mt-0.5">
                  Your personal credentials and display identity across Cirra Cost Intelligence
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Avatar Row */}
                <div className="flex items-center gap-4 p-3.5 rounded-xl bg-[#F8FAFD] border border-[#D6E4F5]">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] text-white font-bold text-lg flex items-center justify-center shadow-sm shadow-[#4F46E5]/20 flex-shrink-0">
                    HK
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl border border-[#D6E4F5] bg-white text-xs font-bold text-[#0A192F] hover:bg-[#F0F5FD] hover:border-[#BCD4F0] shadow-xs transition-all active:scale-[0.98]"
                      >
                        Change Avatar
                      </button>
                    </div>
                    <p className="text-[11px] text-[#7E93AB] font-medium mt-1">
                      PNG, JPG or SVG up to 2MB
                    </p>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0A192F] block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-9 px-3.5 text-xs rounded-xl border border-[#D6E4F5] bg-white text-[#0A192F] font-semibold focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all shadow-xs"
                    placeholder="Your name"
                  />
                </div>

                {/* Work Email (Read-only SSO) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0A192F] block">
                    Work Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value="hiten@cirra.dev"
                      disabled
                      className="w-full h-9 pl-3.5 pr-9 text-xs rounded-xl border border-[#D6E4F5] bg-[#F8FAFD] text-[#5A6E85] font-mono cursor-not-allowed select-all"
                    />
                    <Lock className="w-3.5 h-3.5 text-[#7E93AB] absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-[#5A6E85] font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#0D824D]" />
                    <span>Managed via NextAuth / Google Workspace SSO</span>
                  </p>
                </div>

                {/* Primary Timezone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0A192F] block">
                    Primary Timezone
                  </label>
                  <div className="relative">
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full h-9 px-3.5 text-xs rounded-xl border border-[#D6E4F5] bg-white text-[#0A192F] font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all shadow-xs cursor-pointer appearance-none"
                    >
                      <option value="America/New_York (EST)">
                        America/New_York (UTC-5 EST) — Eastern Time
                      </option>
                      <option value="America/Chicago (CST)">
                        America/Chicago (UTC-6 CST) — Central Time
                      </option>
                      <option value="America/Los_Angeles (PST)">
                        America/Los_Angeles (UTC-8 PST) — Pacific Time
                      </option>
                      <option value="Europe/London (GMT)">
                        Europe/London (UTC+0 GMT) — British Summer Time
                      </option>
                      <option value="Europe/Berlin (CET)">
                        Europe/Berlin (UTC+1 CET) — Central Europe
                      </option>
                      <option value="Asia/Tokyo (JST)">
                        Asia/Tokyo (UTC+9 JST) — Japan Standard Time
                      </option>
                      <option value="Asia/Kolkata (IST)">
                        Asia/Kolkata (UTC+5:30 IST) — India Standard Time
                      </option>
                    </select>
                    <Clock className="w-3.5 h-3.5 text-[#7E93AB] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-[#7E93AB]">
                    Determines hourly billing boundary alignment and daily reporting cut-offs.
                  </p>
                </div>

                {/* Action Bar */}
                <div className="pt-3 border-t border-[#EBF2FA] flex items-center gap-3">
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold shadow-sm shadow-[#4F46E5]/25 transition-all flex items-center gap-1.5 active:scale-[0.98]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>

                  {profileSaved && (
                    <span className="text-xs font-semibold text-[#0D824D] bg-[#E6F8F0] border border-[#B3ECCB] px-3 py-1 rounded-xl flex items-center gap-1.5 animate-fadeIn">
                      <Check className="w-3 h-3 text-[#0D824D]" />
                      Profile saved successfully!
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: PREFERENCES */}
          {activeTab === "preferences" && (
            <div className="cirra-card p-6 sm:p-7 space-y-6">
              <div className="border-b border-[#EBF2FA] pb-4">
                <h3 className="font-bold text-[#0A192F] text-lg tracking-tight">
                  Preferences
                </h3>
                <p className="text-xs text-[#5A6E85] mt-0.5">
                  Configure default telemetry horizons and multi-cloud focus scopes
                </p>
              </div>

              <form onSubmit={handleSavePreferences} className="space-y-5">
                {/* Default Time Period Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0A192F] block">
                    Default Time Horizon
                  </label>
                  <select
                    value={defaultPeriod}
                    onChange={(e) => setDefaultPeriod(e.target.value)}
                    className="w-full h-9 px-3.5 text-xs rounded-xl border border-[#D6E4F5] bg-white text-[#0A192F] font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all shadow-xs cursor-pointer"
                  >
                    <option value="30d">Last 30 Days (Recommended)</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="6m">Last 6 Months</option>
                    <option value="12m">Last 12 Months</option>
                    <option value="mtd">Month to Date (MTD)</option>
                  </select>
                  <p className="text-[11px] text-[#7E93AB]">
                    Sets the initial range loaded across the Dashboard and Spend pages.
                  </p>
                </div>

                {/* Multi-Cloud Default Provider Filter Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#0A192F] block">
                    Active Multi-Cloud & AI Providers
                  </label>
                  <p className="text-[11px] text-[#5A6E85] mb-2">
                    Enable or disable telemetry providers displayed by default in aggregate views.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: "AWS", name: "Amazon Web Services", category: "Cloud" },
                      { id: "GCP", name: "Google Cloud Platform", category: "Cloud" },
                      { id: "Azure", name: "Microsoft Azure", category: "Cloud" },
                      { id: "OpenAI", name: "OpenAI Foundation Models", category: "AI" },
                      { id: "Anthropic", name: "Anthropic Claude Models", category: "AI" },
                    ].map((prov) => {
                      const active = enabledProviders.includes(prov.id);
                      return (
                        <div
                          key={prov.id}
                          onClick={() => toggleProvider(prov.id)}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            active
                              ? "bg-[#F0F5FD] border-[#BCD9FC]"
                              : "bg-[#F8FAFD] border-[#D6E4F5] opacity-65"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {prov.category === "Cloud" ? (
                              <Cloud className="w-3.5 h-3.5 text-[#0062E0]" />
                            ) : (
                              <Cpu className="w-3.5 h-3.5 text-[#7C3AED]" />
                            )}
                            <div>
                              <div className="text-xs font-bold text-[#0A192F]">
                                {prov.name}
                              </div>
                              <div className="text-[10px] text-[#7E93AB]">
                                {prov.category}
                              </div>
                            </div>
                          </div>

                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                              active
                                ? "bg-[#4F46E5] border-[#4F46E5] text-white"
                                : "bg-white border-[#D6E4F5]"
                            }`}
                          >
                            {active && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Default Currency Format */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-[#0A192F] block">
                    Display Currency
                  </label>
                  <select
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    className="w-full sm:w-64 h-9 px-3.5 text-xs rounded-xl border border-[#D6E4F5] bg-white text-[#0A192F] font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all shadow-xs cursor-pointer"
                  >
                    <option value="USD">USD ($) — United States Dollar</option>
                    <option value="EUR">EUR (€) — Euro</option>
                    <option value="GBP">GBP (£) — British Pound</option>
                  </select>
                </div>

                {/* Action Bar */}
                <div className="pt-3 border-t border-[#EBF2FA] flex items-center gap-3">
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold shadow-sm shadow-[#4F46E5]/25 transition-all flex items-center gap-1.5 active:scale-[0.98]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Preferences</span>
                  </button>

                  {preferencesSaved && (
                    <span className="text-xs font-semibold text-[#0D824D] bg-[#E6F8F0] border border-[#B3ECCB] px-3 py-1 rounded-xl flex items-center gap-1.5 animate-fadeIn">
                      <Check className="w-3 h-3 text-[#0D824D]" />
                      Preferences saved successfully!
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="cirra-card p-6 sm:p-7 space-y-6">
              <div className="border-b border-[#EBF2FA] pb-4">
                <h3 className="font-bold text-[#0A192F] text-lg tracking-tight">
                  Alert & Telemetry Notifications
                </h3>
                <p className="text-xs text-[#5A6E85] mt-0.5">
                  Automated Slack, PagerDuty, and email dispatch policies
                </p>
              </div>

              {/* Enterprise / Warning Banner matching specification */}
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-[#92400E]">
                  <AlertTriangle className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                  <span>Available in Cirra Guard</span>
                </div>
                <span className="text-[11px] font-bold text-[#78350F] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
                  Enterprise Tier
                </span>
              </div>

              <form onSubmit={handleSaveNotifications} className="space-y-4">
                {/* 4 Apple/Linear style toggle switch controls */}
                <div className="space-y-3 divide-y divide-[#EBF2FA]">
                  {/* Toggle 1: Sentinel Anomaly */}
                  <div className="pt-2 flex items-center justify-between gap-4">
                    <div className="pr-4">
                      <div className="text-xs font-bold text-[#0A192F]">
                        Notify upon Critical Sentinel Anomaly
                      </div>
                      <div className="text-[11px] text-[#5A6E85] mt-0.5">
                        Triggers immediate dispatch when ARIMA + MAD detector flags cost spikes exceeding ±2.5σ.
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifyAnomaly}
                      onClick={() => setNotifyAnomaly(!notifyAnomaly)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 ${
                        notifyAnomaly ? "bg-[#4F46E5]" : "bg-[#D6E4F5]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                          notifyAnomaly ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 2: Weekly Executive Digest */}
                  <div className="pt-3 flex items-center justify-between gap-4">
                    <div className="pr-4">
                      <div className="text-xs font-bold text-[#0A192F]">
                        Weekly Executive Cost Summary digest
                      </div>
                      <div className="text-[11px] text-[#5A6E85] mt-0.5">
                        Delivers a Monday 08:00 UTC FOCUS 1.0 multi-cloud rollup with prior period variance.
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifyWeeklyDigest}
                      onClick={() => setNotifyWeeklyDigest(!notifyWeeklyDigest)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 ${
                        notifyWeeklyDigest ? "bg-[#4F46E5]" : "bg-[#D6E4F5]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                          notifyWeeklyDigest ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 3: Data Ingestion Health Reports */}
                  <div className="pt-3 flex items-center justify-between gap-4">
                    <div className="pr-4">
                      <div className="text-xs font-bold text-[#0A192F]">
                        Receive data ingestion health reports
                      </div>
                      <div className="text-[11px] text-[#5A6E85] mt-0.5">
                        Alerts cloud architects if billing data sync stalls or API credentials encounter auth errors.
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifyHealthReports}
                      onClick={() => setNotifyHealthReports(!notifyHealthReports)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 ${
                        notifyHealthReports ? "bg-[#4F46E5]" : "bg-[#D6E4F5]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                          notifyHealthReports ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 4: Slack Webhook Dispatch */}
                  <div className="pt-3 flex items-center justify-between gap-4">
                    <div className="pr-4">
                      <div className="text-xs font-bold text-[#0A192F]">
                        Slack webhook dispatch for high-confidence savings
                      </div>
                      <div className="text-[11px] text-[#5A6E85] mt-0.5">
                        Pushes actionable rightsizing suggestions directly into your #finops engineering channel.
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifySlackSavings}
                      onClick={() => setNotifySlackSavings(!notifySlackSavings)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 ${
                        notifySlackSavings ? "bg-[#4F46E5]" : "bg-[#D6E4F5]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                          notifySlackSavings ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Webhook Configuration Sub-panel */}
                <div className="p-3.5 rounded-xl bg-[#F8FAFD] border border-[#D6E4F5] space-y-2 mt-4">
                  <label className="text-xs font-bold text-[#0A192F] block">
                    Slack Incoming Webhook URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="flex-1 h-9 px-3 text-xs rounded-xl border border-[#D6E4F5] bg-white text-[#0A192F] font-mono focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      className="h-9 px-3.5 rounded-xl border border-[#D6E4F5] bg-white text-xs font-bold text-[#0A192F] hover:bg-[#F0F5FD] hover:border-[#BCD4F0] shadow-xs transition-all active:scale-[0.98] whitespace-nowrap"
                    >
                      {testWebhookStatus === "testing"
                        ? "Testing..."
                        : testWebhookStatus === "sent"
                        ? "Payload Sent ✓"
                        : "Send Test Payload"}
                    </button>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="pt-3 border-t border-[#EBF2FA] flex items-center gap-3">
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold shadow-sm shadow-[#4F46E5]/25 transition-all flex items-center gap-1.5 active:scale-[0.98]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Notification Rules</span>
                  </button>

                  {notificationsSaved && (
                    <span className="text-xs font-semibold text-[#0D824D] bg-[#E6F8F0] border border-[#B3ECCB] px-3 py-1 rounded-xl flex items-center gap-1.5 animate-fadeIn">
                      <Check className="w-3 h-3 text-[#0D824D]" />
                      Alert rules saved successfully!
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: SECURITY & API */}
          {activeTab === "security" && (
            <div className="cirra-card p-6 sm:p-7 space-y-6">
              <div className="border-b border-[#EBF2FA] pb-4">
                <h3 className="font-bold text-[#0A192F] text-lg tracking-tight">
                  Security & API
                </h3>
                <p className="text-xs text-[#5A6E85] mt-0.5">
                  Manage API tokens, scoped service credentials, and tenant access boundaries
                </p>
              </div>

              {/* Scoped API Key Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0A192F]">
                    Scoped Telemetry Ingestion Token
                  </label>
                  <span className="text-[10px] font-bold text-[#0D824D] bg-[#E6F8F0] border border-[#B3ECCB] px-2 py-0.5 rounded-full">
                    Read-Only Active
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFD] border border-[#D6E4F5] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono text-xs text-[#0A192F] font-semibold truncate bg-white px-3 py-1.5 rounded-lg border border-[#D6E4F5] flex-1">
                      {apiKey}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="h-8 px-3 rounded-xl border border-[#D6E4F5] bg-white text-xs font-bold text-[#0A192F] hover:bg-[#F0F5FD] hover:border-[#BCD4F0] transition-all flex items-center gap-1.5 shadow-xs flex-shrink-0"
                    >
                      {copiedKey ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-[#0D824D]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#5A6E85]" />
                          <span>Copy Token</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleRotateKey}
                      className="h-8 px-3 rounded-xl border border-[#D6E4F5] bg-white text-xs font-bold text-[#0A192F] hover:bg-[#F0F5FD] hover:border-[#BCD4F0] transition-all flex items-center gap-1.5 shadow-xs flex-shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#5A6E85]" />
                      <span>Rotate</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5A6E85]">
                    <span className="font-semibold text-[#0A192F]">Scopes:</span>
                    <span className="bg-white border border-[#D6E4F5] px-2 py-0.5 rounded-md font-mono text-[10px]">
                      focus:read
                    </span>
                    <span className="bg-white border border-[#D6E4F5] px-2 py-0.5 rounded-md font-mono text-[10px]">
                      anomalies:read
                    </span>
                    <span className="bg-white border border-[#D6E4F5] px-2 py-0.5 rounded-md font-mono text-[10px]">
                      telemetry:export
                    </span>
                  </div>

                  {keyRotated && (
                    <div className="text-xs font-semibold text-[#0D824D] bg-[#E6F8F0] border border-[#B3ECCB] p-2 rounded-lg animate-fadeIn">
                      New secret token generated and rotated. Prior token scheduled to expire in 24 hours.
                    </div>
                  )}
                </div>
              </div>

              {/* Single Sign-On Status */}
              <div className="p-4 rounded-xl bg-white border border-[#D6E4F5] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0D824D]" />
                    <span className="text-xs font-bold text-[#0A192F]">
                      Google Workspace SSO & MFA Enforcement
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#0D824D] bg-[#E6F8F0] border border-[#B3ECCB] px-2 py-0.5 rounded-full">
                    Enforced
                  </span>
                </div>
                <p className="text-xs text-[#5A6E85]">
                  All tenant users must authenticate via Google Workspace OIDC with hardware-key or authenticator MFA.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: DANGER ZONE */}
          {activeTab === "danger" && (
            <div
              className="cirra-card p-6 sm:p-7 space-y-5 bg-[#FFF8F8]"
              style={{ border: "1.5px solid #FCA5A5" }}
            >
              <div className="border-b border-[#FECACA] pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#DC2626]">
                    <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
                    <h3 className="font-bold text-lg tracking-tight">Danger Zone</h3>
                  </div>
                  <p className="text-xs text-[#5A6E85] mt-0.5">
                    Destructive actions that permanently affect workspace data
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[#DC2626] bg-[#FEE2E2] px-2.5 py-0.5 rounded-full border border-[#FECACA]">
                  Permanent Action
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] space-y-3.5">
                <p className="text-xs text-[#7F1D1D] leading-relaxed font-medium">
                  Permanently eradicate all historical FOCUS ClickHouse billing partitions, allocation rules, and connection credentials for this workspace. This action cannot be reversed.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#7F1D1D] block">
                    Type{" "}
                    <span className="font-mono bg-white text-[#DC2626] px-1.5 py-0.5 rounded border border-[#FECACA] font-bold">
                      DELETE
                    </span>{" "}
                    to confirm purge
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full h-9 px-3.5 text-xs rounded-xl border border-[#FCA5A5] bg-white font-mono text-[#7F1D1D] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626] transition-all shadow-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDeleteTenant}
                  disabled={deleteConfirmText !== "DELETE" || isDeleting}
                  className="w-full h-9 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-40 disabled:hover:bg-[#DC2626] text-white text-xs font-bold transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Eradicating workspace data...</span>
                    </>
                  ) : (
                    <span>Eradicate Workspace & Historical Data</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
