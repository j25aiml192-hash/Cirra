import { NextResponse } from "next/server";
import { mockAiSpend } from "@/lib/mockData";

export async function GET() {
  return NextResponse.json(mockAiSpend);
}

