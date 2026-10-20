"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Button,
  Avatar,
} from "@cirra/ui";
import { Users, UserPlus, Shield } from "lucide-react";
import type { UserRole } from "@cirra/types";

interface Member {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  joinedAt: string;
}

const mockMembers: Member[] = [
  {
    id: "usr-1",
    name: "Alex Rivera",
    email: "alex@acme.internal",
    role: "owner",
    joinedAt: "2026-01-10",
  },
  {
    id: "usr-2",
    name: "Sarah Chen",
    email: "sarah@acme.internal",
    role: "admin",
    joinedAt: "2026-03-15",
  },
  {
    id: "usr-3",
    name: "David Kim",
    email: "david@acme.internal",
    role: "viewer",
    joinedAt: "2026-05-20",
  },
];

export default function TeamSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-500" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Team & Role-Based Access Control
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage organization members, assign roles (Owner, Admin, Viewer), and enforce tenant isolation
          </p>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 gap-1.5">
          <UserPlus className="h-4 w-4" /> Invite Member
        </Button>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Organization Members</CardTitle>
          <CardDescription>
            All actions executed through Cirra adhere to role permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar fallback={member.name.substring(0, 2).toUpperCase()} />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {member.name}
                        </div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.role === "owner"
                          ? "default"
                          : member.role === "admin"
                          ? "secondary"
                          : "outline"
                      }
                      className="capitalize"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {member.joinedAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Edit Role
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
