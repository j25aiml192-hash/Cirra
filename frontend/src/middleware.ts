import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(_request: NextRequest) {
  // TEMPORARY: auth bypassed for demo
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
