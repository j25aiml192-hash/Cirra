import { NextResponse } from "next/server";
import { mockAnomalies } from "@/lib/mockData";

export async function GET() {
  return NextResponse.json(mockAnomalies);
}

