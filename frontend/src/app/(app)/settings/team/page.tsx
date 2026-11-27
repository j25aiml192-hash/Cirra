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
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Topbar title="Team & Access Control" subtitle="Manage organization access, role assignments, and tenant boundaries" />
          <button
            type="button"
            onClick={() => setShowInviteForm((prev) => !prev)}
            className="px-4 py-2 rounded-full bg-white text-black font-mono font-semibold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-zinc-200 shadow-none transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <form
            onSubmit={handleSendInvite}
            className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 backdrop-blur-sm flex flex-wrap items-center gap-4 transition-all"
          >
            <div className="flex-1 min-w-[180px]">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Full Name
              </label>
              <input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Rachel Zane"
                className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="flex-1 min-w-[220px]">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Work Email
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="rachel@company.com"
                className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="w-36">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as TeamMember["role"])}
                className="w-full h-9 px-2 text-xs font-mono rounded-xl border border-zinc-700 bg-zinc-900 text-white focus:outline-none focus:border-zinc-500 font-medium"
              >
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            <div className="flex items-center gap-2 self-end mt-4 sm:mt-0">
              <button
                type="submit"
                className="h-9 px-4 rounded-full bg-white text-black text-xs font-mono font-semibold flex items-center gap-1.5 hover:bg-zinc-200 transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Send Invite
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="h-9 px-3 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 text-xs font-mono hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Members List */}
        <div className="bg-[#09090b] rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm font-mono uppercase tracking-wider">Active Organization Members</h3>
            <span className="text-xs font-mono text-zinc-500">{members.length} seats utilized</span>
          </div>

          <div className="divide-y divide-zinc-800/80">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-4 px-6 flex items-center justify-between hover:bg-zinc-900/40 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center font-bold font-mono text-xs shadow-none flex-shrink-0">
                    {member.avatarInitials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{member.name}</span>
                      {member.status === "invited" && (
                        <span className="text-[10px] font-mono bg-zinc-900 text-amber-400 border border-amber-900/60 px-1.5 py-0.2 rounded-full">
                          Pending Invite
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-mono text-zinc-500 mt-0.5">
                      <Mail className="w-3 h-3 text-zinc-500" />
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
                    className="text-xs font-mono font-medium px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-200 cursor-pointer focus:outline-none transition-colors"
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
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
