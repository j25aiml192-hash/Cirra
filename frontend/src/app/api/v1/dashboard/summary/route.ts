import { NextResponse } from "next/server";
import { mockDashboardData } from "@/lib/mockData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "30d";

  // Customize if needed based on period, or return standard FOCUS summary
  return NextResponse.json(mockDashboardData);
}

