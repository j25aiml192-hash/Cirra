import { NextResponse } from "next/server";
import { mockAllocationRules } from "@/lib/mockData";

export async function GET() {
  return NextResponse.json(mockAllocationRules);
}

