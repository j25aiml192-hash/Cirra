import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return { supabaseUrl, supabaseAnonKey }
}

/**
 * Creates a Supabase client for use in Client Components.
 */
export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Creates a Supabase client for use in Server Components, Route Handlers,
 * and Server Actions using cookies from next/headers.
 */
export async function createServerSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if middleware is refreshing user sessions.
        }
      },
    },
  })
}
