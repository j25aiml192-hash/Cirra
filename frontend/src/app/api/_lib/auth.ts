import { mockUser } from '@/lib/mock-session'
import { NextRequest } from 'next/server'

export async function getAuthenticatedUser(_request?: Request | NextRequest) {
  // TEMPORARY: bypassing auth for demo
  return Object.assign(
    { ...mockUser },
    {
      user: mockUser,
      error: null,
    }
  )
}

export function unauthorized() {
  return Response.json({ data: null, error: 'Unauthorized', meta: null }, { status: 401 })
}

export function apiError(message: string, status: number): Response {
  return Response.json({ data: null, error: message, meta: null }, { status })
}
