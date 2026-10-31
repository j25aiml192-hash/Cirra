import { NextRequest } from 'next/server';
import { getAuthenticatedUser, unauthorized, apiError } from '@/app/api/_lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

interface RouteContext {
  params: {
    id: string;
  };
}

interface SavingsRow {
  id: string;
  tenant_id: string;
  status?: string | null;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const tenantId = (user.app_metadata?.tenant_id ||
      user.user_metadata?.tenant_id) as string | undefined;

    if (!tenantId) {
      return apiError('Tenant not found', 404);
    }

    const role = (user.app_metadata?.role ||
      user.user_metadata?.role ||
      'viewer') as string;

    if (role === 'viewer') {
      return Response.json(
        { data: null, error: 'Insufficient permissions', meta: null },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id) {
      return apiError('Savings entry ID is required', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: entry, error: fetchError } = await supabase
      .from('savings_entries')
      .select('id, tenant_id, status')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !entry) {
      return apiError('Savings entry not found', 404);
    }

    const typedEntry = entry as SavingsRow;
    if ((typedEntry.status || '').toLowerCase() !== 'identified') {
      return Response.json(
        {
          data: null,
          error: 'Can only approve entries with status: identified',
          meta: null,
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('savings_entries')
      .update({
        status: 'approved',
      })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (updateError) {
      console.error('Failed to approve savings entry:', updateError);
      return apiError('An unexpected error occurred', 500);
    }

    return Response.json({
      data: { id, status: 'approved' },
      error: null,
      meta: null,
      success: true,
    });
  } catch (error) {
    console.error('Savings approve error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}

