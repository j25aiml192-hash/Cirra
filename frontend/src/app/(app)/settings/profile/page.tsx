"use client";

import React, { useState } from "react";
import { User, ShieldAlert, AlertTriangle, Check, Lock } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";

export default function ProfileSettingsPage() {
  const [name, setName] = useState("Hiten Kumar");
  const [timezone, setTimezone] = useState("America/New_York (EST)");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleDeleteTenant = () => {
    if (deleteConfirmText !== "DELETE") return;
    setIsDeleting(true);
    setTimeout(() => {
      alert("Tenant data deletion simulated.");
      setIsDeleting(false);
    }, 1000);
  };

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <Topbar title="Profile & Preferences" subtitle="Manage individual credentials, organization profiles, and alert thresholds" />

      {/* 1. Profile Section Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-semibold text-slate-900 text-base">Personal Profile</h3>
          <p className="text-xs text-slate-400 mt-0.5">Your personal credentials and display identity across Cirra</p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-base flex items-center justify-center shadow-md">
              HK
            </div>
            <div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Change Avatar
              </button>
              <p className="text-[11px] text-slate-400 mt-1">PNG, JPG or SVG up to 2MB</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Work Email</label>
            <div className="relative">
              <input
                value="hiten@cirra.dev"
                disabled
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-400 font-mono cursor-not-allowed"
              />
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-400">Managed via NextAuth / Google Workspace SSO</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Primary Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="America/New_York (EST)">America/New_York (UTC-5)</option>
              <option value="America/Los_Angeles (PST)">America/Los_Angeles (UTC-8)</option>
              <option value="Europe/London (GMT)">Europe/London (UTC+0)</option>
              <option value="Asia/Tokyo (JST)">Asia/Tokyo (UTC+9)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Save Changes
            </button>
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-medium animate-fade-in">
                Profile saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* 2. Notifications Section Card (dimmed with amber banner) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 relative overflow-hidden">
        {/* Amber banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Available in Cirra Guard</span>
          </div>
          <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
            Enterprise Tier
          </span>
        </div>

        {/* Dimmed controls */}
        <div className="opacity-50 pointer-events-none space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-semibold text-slate-900 text-base">Alert & Telemetry Notifications</h3>
            <p className="text-xs text-slate-400">Automated Slack, PagerDuty, and email dispatch</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1">
              <span>Notify upon Critical Sentinel Anomaly</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Weekly Executive Cost Summary digest</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Slack webhook dispatch for high confidence savings</span>
              <input type="checkbox" className="rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Danger Zone Card */}
      <div
        className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
        style={{ border: "1.5px solid #FCA5A5" }}
      >
        <div className="flex items-center gap-2 text-rose-700">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <h3 className="font-bold text-base">Danger Zone</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Permanently eradicate all historical FOCUS ClickHouse billing partitions, allocation rules, and connection credentials for this workspace. This action cannot be reversed.
        </p>

        <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/80 space-y-3">
          <label className="text-xs font-semibold text-rose-900 block">
            Type <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-rose-300">DELETE</span> to confirm purge
          </label>
          <input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full h-9 px-3 text-xs rounded-lg border border-rose-300 bg-white font-mono text-rose-900 focus:outline-none focus:border-rose-500"
          />

          <button
            type="button"
            onClick={handleDeleteTenant}
            disabled={deleteConfirmText !== "DELETE" || isDeleting}
            className="w-full h-9 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-40 transition-colors shadow-sm"
          >
            {isDeleting ? "Purging workspace data..." : "Eradicate Workspace & Historical Data"}
          </button>
        </div>
      </div>
    </div>
  );
}
