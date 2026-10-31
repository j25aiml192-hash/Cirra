import { NextResponse } from "next/server";
import { mockSavings } from "@/lib/mockData";

export async function GET() {
  return NextResponse.json(mockSavings);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, action: body.action || "approved" });
  } catch {
    return NextResponse.json({ success: true });
  }
}

