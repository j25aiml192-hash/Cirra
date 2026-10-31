import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized } from '@/app/api/_lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const tenantId = user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID missing on user' }, { status: 400 })
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Failed to delete connection:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

