import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser, unauthorized, apiError } from '@/app/api/_lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

interface RouteContext {
  params: {
    id: string;
  };
}

interface UpdateRoleBody {
  role?: string;
}

interface UserRow {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role configuration is missing');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const tenantId = (user.app_metadata?.tenant_id ||
      user.user_metadata?.tenant_id) as string | undefined;

    if (!tenantId) {
      return apiError('Tenant not found', 404);
    }

    const currentRole = (user.app_metadata?.role ||
      user.user_metadata?.role ||
      'viewer') as string;

    // Only owner may change roles (not admin)
    if (currentRole !== 'owner') {
      return Response.json(
        { data: null, error: 'Only owners may change roles', meta: null },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id) {
      return apiError('User ID is required', 400);
    }

    // Prevent self-role-change
    if (id === user.id) {
      return Response.json(
        { data: null, error: 'Cannot change your own role', meta: null },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as UpdateRoleBody;
    if (body.role !== 'admin' && body.role !== 'viewer') {
      return Response.json(
        { data: null, error: "Role must be 'admin' or 'viewer'", meta: null },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, tenant_id, email, role')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !targetUser) {
      return apiError('Team member not found', 404);
    }

    const typedTarget = targetUser as UserRow;
    if (typedTarget.role === 'owner') {
      return Response.json(
        { data: null, error: 'Cannot change the role of an owner', meta: null },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Update public.users
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ role: body.role })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (updateError) {
      console.error('Failed to update member role in users table:', updateError);
      return apiError('An unexpected error occurred', 500);
    }

    // Update auth app_metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        app_metadata: { role: body.role },
        user_metadata: { role: body.role },
      });
    } catch (authErr) {
      console.error('Failed to update member role in auth:', authErr);
    }

    return Response.json({
      data: { id, role: body.role },
      error: null,
      meta: null,
    });
  } catch (error) {
    console.error('Team member PATCH error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const tenantId = (user.app_metadata?.tenant_id ||
      user.user_metadata?.tenant_id) as string | undefined;

    if (!tenantId) {
      return apiError('Tenant not found', 404);
    }

    const currentRole = (user.app_metadata?.role ||
      user.user_metadata?.role ||
      'viewer') as string;

    // Only owner may remove members
    if (currentRole !== 'owner') {
      return Response.json(
        { data: null, error: 'Only owners may remove members', meta: null },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id) {
      return apiError('User ID is required', 400);
    }

    // Prevent self-removal
    if (id === user.id) {
      return Response.json(
        { data: null, error: 'Cannot remove yourself', meta: null },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, tenant_id, role')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !targetUser) {
      return apiError('Team member not found', 404);
    }

    const typedTarget = targetUser as UserRow;
    if (typedTarget.role === 'owner') {
      return Response.json(
        { data: null, error: 'Cannot remove another owner', meta: null },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('Failed to remove member from users table:', deleteError);
      return apiError('An unexpected error occurred', 500);
    }

    return Response.json({
      data: { id, removed: true },
      error: null,
      meta: null,
      success: true,
    });
  } catch (error) {
    console.error('Team member DELETE error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}

