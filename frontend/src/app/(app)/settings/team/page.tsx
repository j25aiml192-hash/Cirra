"use client";

import React, { useState } from "react";
import { UserPlus, Trash2, Mail, Shield, Check, X } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import type { TeamMember } from "@/types";

const initialMembers: TeamMember[] = [
  {
    id: "mem-1",
    name: "Hiten Kumar",
    email: "hiten@cirra.dev",
    role: "owner",
    status: "active",
    avatarInitials: "HK",
  },
  {
    id: "mem-2",
    name: "Alex Vance",
    email: "alex@cirra.dev",
    role: "admin",
    status: "active",
    avatarInitials: "AV",
  },
  {
    id: "mem-3",
    name: "Sarah Chen",
    email: "sarah@cirra.dev",
    role: "viewer",
    status: "invited",
    avatarInitials: "SC",
  },
];

export default function TeamSettingsPage() {
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
      name: (inviteName || inviteEmail.split("@")[0]) || "Member",
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

  const handleRoleChange = (id: string, newRole: TeamMember["role"]) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole } : m))
    );
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Topbar title="Team & Access Control" subtitle="Manage organization access, role assignments, and tenant boundaries" />
        <button
          type="button"
          onClick={() => setShowInviteForm((prev) => !prev)}
          className="px-4 py-2 rounded-xl bg-[#0062E0] text-white font-medium text-xs flex items-center gap-2 hover:bg-[#0052C2] shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      {/* Invite Form (inline row form, glass-tinted, dashed border, indigo-50 bg) */}
      {showInviteForm && (
        <form
          onSubmit={handleSendInvite}
          className="p-5 rounded-2xl bg-[#EBF3FE]/70 border-2 border-dashed border-[#BCD9FC] backdrop-blur-sm flex flex-wrap items-center gap-4 transition-all"
        >
          <div className="flex-1 min-w-[180px]">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#334155] block mb-1">
              Full Name
            </label>
            <input
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="e.g. Rachel Zane"
              className="w-full h-9 px-3 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F] focus:outline-none focus:border-[#0062E0]"
            />
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#334155] block mb-1">
              Work Email
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="rachel@company.com"
              className="w-full h-9 px-3 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#0A192F] focus:outline-none focus:border-[#0062E0]"
            />
          </div>

          <div className="w-36">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#334155] block mb-1">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as TeamMember["role"])}
              className="w-full h-9 px-2 text-xs rounded-lg border border-[#D6E4F5] bg-white text-[#334155] focus:outline-none focus:border-[#0062E0] font-medium"
            >
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end mt-4 sm:mt-0">
            <button
              type="submit"
              className="h-9 px-4 rounded-lg bg-[#0062E0] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#0052C2] shadow-sm"
            >
              <Check className="w-3.5 h-3.5" /> Send Invite
            </button>
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="h-9 px-3 rounded-lg border border-[#D6E4F5] bg-white text-[#475569] text-xs font-medium hover:bg-[#F0F5FD]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Members List */}
      <div className="cirra-card overflow-hidden">
        <div className="p-5 border-b border-[#D6E4F5] flex items-center justify-between">
          <h3 className="font-semibold text-[#0A192F] text-base">Active Organization Members</h3>
          <span className="text-xs text-[#64748B]">{members.length} seats utilized</span>
        </div>

        <div className="divide-y divide-[#EBF2FA]">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-4 px-6 flex items-center justify-between hover:bg-[#F4F8FD] transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0052C2] to-[#6366F1] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                  {member.avatarInitials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#0A192F] text-sm">{member.name}</span>
                    {member.status === "invited" && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded-full font-medium">
                        Pending Invite
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#64748B] mt-0.5">
                    <Mail className="w-3 h-3 text-[#64748B]" />
                    <span>{member.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Role Pill Select */}
                <select
                  value={member.role}
                  onChange={(e) =>
                    handleRoleChange(member.id, e.target.value as TeamMember["role"])
                  }
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-colors ${
                    member.role === "owner"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : member.role === "admin"
                      ? "bg-[#EBF3FE] text-[#0062E0] border-[#BCD9FC]"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>

                {/* Remove button on hover */}
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.id)}
                  title="Remove member"
                  className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
