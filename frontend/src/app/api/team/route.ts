import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser, unauthorized } from '@/app/api/_lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const tenantId = user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json([])
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Failed to fetch team members:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const tenantId = user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID missing on user' }, { status: 400 })
    }

    const body = await request.json()
    const { email, role } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const validRoles = ['admin', 'viewer'] as const
    const assignedRole = role && validRoles.includes(role) ? role : 'viewer'

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase service role configuration is missing')
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        tenant_id: tenantId,
        role: assignedRole,
      },
    })

    if (error) {
      console.error('Failed to invite user:', error)
      return NextResponse.json({ error: error.message || 'Failed to invite user' }, { status: 400 })
    }

    return NextResponse.json({ invited: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

