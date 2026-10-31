import { NextResponse } from "next/server";
import { mockSuggestedRules } from "@/lib/mockData";

export async function GET() {
  return NextResponse.json(mockSuggestedRules);
}

