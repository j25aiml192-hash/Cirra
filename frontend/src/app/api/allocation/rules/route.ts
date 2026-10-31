import { NextRequest, NextResponse } from 'next/server'
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
      .from('allocation_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('priority', { ascending: true })

    if (error) {
      console.error('Failed to fetch allocation rules:', error)
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
    const {
      name,
      condition,
      team,
      priority,
      match_type,
      match_value,
      assign_team,
      assign_customer,
      assign_feature,
    } = body

    let resolvedMatchType: string =
      match_type ||
      condition?.match_type ||
      condition?.type ||
      'tag'

    let resolvedMatchValue: string =
      match_value ||
      condition?.match_value ||
      condition?.value ||
      (condition ? (typeof condition === 'string' ? condition : JSON.stringify(condition)) : '')

    if (!resolvedMatchValue) {
      resolvedMatchValue = '*'
    }

    const resolvedTeam = team || assign_team || null

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('allocation_rules')
      .insert({
        tenant_id: tenantId,
        name: name || null,
        priority: typeof priority === 'number' ? priority : 1,
        match_type: resolvedMatchType,
        match_value: resolvedMatchValue,
        assign_team: resolvedTeam,
        assign_customer: assign_customer || null,
        assign_feature: assign_feature || null,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Failed to create allocation rule:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

