import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function getAuthenticatedUser(_request?: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) return null
    return user
  } catch {
    return null
  }
}

export function unauthorized() {
  return Response.json({ data: null, error: 'Unauthorized', meta: null }, { status: 401 })
}

export function apiError(message: string, status: number): Response {
  return Response.json({ data: null, error: message, meta: null }, { status })
}


