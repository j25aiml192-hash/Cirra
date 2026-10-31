import { NextResponse } from "next/server";
import { mockConnections } from "@/lib/mockData";

export async function GET() {
  return NextResponse.json(mockConnections);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newConnection = {
      id: `conn-${Date.now()}`,
      tenant_id: "tenant-acme",
      name: body.name || "Cloud Connection",
      provider: body.provider || "aws",
      status: "connected",
      last_synced_at: "Just now",
      created_at: new Date().toISOString(),
      ...body,
    };
    return NextResponse.json(newConnection, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid connection payload" }, { status: 400 });
  }
}

