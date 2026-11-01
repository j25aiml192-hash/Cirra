import { mockUser } from '@/lib/mock-session'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ user: mockUser })
}
