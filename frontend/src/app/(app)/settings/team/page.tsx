"use client";

import * as React from "react";
import { Users, UserPlus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { TeamMember } from "@/types/api";

const mockMembers: TeamMember[] = [
  {
    id: "u1",
    email: "admin@cirra.dev",
    role: "owner",
    status: "active",
  },
  {
    id: "u2",
    email: "devops-lead@cirra.dev",
    role: "admin",
    status: "active",
  },
  {
    id: "u3",
    email: "finance-analyst@cirra.dev",
    role: "viewer",
    status: "invited",
  },
];

export default function TeamSettingsPage() {
  const columns = [
    {
      key: "email",
      header: "Member Email",
      render: (row: TeamMember) => (
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{row.email}</span>
      ),
    },
    {
      key: "role",
      header: "Access Role",
      render: (row: TeamMember) => (
        <Badge variant={row.role === "owner" ? "default" : "secondary"} className="capitalize">
          {row.role}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: TeamMember) => (
        <span className="text-xs capitalize text-zinc-500">{row.status}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Team & Role-Based Access Control
          </h1>
          <p className="text-sm text-zinc-500">
            Postgres RLS ensures team members can only access authorized tenant budgets.
          </p>
        </div>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" /> Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Directory</CardTitle>
          <CardDescription>Manage organization membership and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={mockMembers}
            keyExtractor={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
