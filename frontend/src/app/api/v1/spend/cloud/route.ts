import { NextResponse } from "next/server";
import { mockCloudSpend } from "@/lib/mockData";

export async function GET() {
  return NextResponse.json(mockCloudSpend);
}

