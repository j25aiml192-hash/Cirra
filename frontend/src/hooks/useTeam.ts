"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { TeamMember } from "@/types";

function mapTeamMember(u: Record<string, unknown>): TeamMember {
  const email = String(u.email || "");
  const name = String(u.name || email.split("@")[0] || "Team Member");
  const role = (u.role === "admin" || u.role === "owner" ? u.role : "viewer") as TeamMember["role"];
  const avatarInitials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "TM";

  return {
    id: String(u.id || `user-${Date.now()}`),
    name,
    email,
    role,
    status: (u.status as TeamMember["status"]) || "active",
    avatarInitials,
  };
}

export function useTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await apiFetch<Array<Record<string, unknown>>>("/api/team");
      if (!Array.isArray(res)) return [];
      return res.map(mapTeamMember);
    },
    staleTime: 60 * 1000,
  });
}

export const useTeam = useTeamMembers;

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; role?: "admin" | "viewer" }) =>
      apiFetch<{ invited: boolean }>("/api/team", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

export const useInviteTeamMember = useInviteMember;

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiFetch<TeamMember>(`/api/team/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/team/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

