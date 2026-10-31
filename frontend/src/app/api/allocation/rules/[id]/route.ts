import { NextRequest } from 'next/server';
import { getAuthenticatedUser, unauthorized, apiError } from '@/app/api/_lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { AllocationRule } from '@/types';

interface RouteContext {
  params: {
    id: string;
  };
}

interface UpdateRuleBody {
  priority?: number;
  match_type?: string;
  match_value?: string;
  assign_team?: string;
  assign_customer?: string;
  assign_feature?: string;
}

const ALLOWED_MATCH_TYPES = new Set(['tag', 'account', 'name_pattern']);

export async function PATCH(request: NextRequest, { params }: RouteContext) {
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
      return apiError('Rule ID is required', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: existingRule, error: fetchError } = await supabase
      .from('allocation_rules')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingRule) {
      return apiError('Allocation rule not found', 404);
    }

    const body = (await request.json().catch(() => ({}))) as UpdateRuleBody;
    const updates: Record<string, unknown> = {};

    if (body.priority !== undefined) {
      if (typeof body.priority !== 'number' || !Number.isInteger(body.priority) || body.priority <= 0) {
        return Response.json(
          { data: null, error: 'Priority must be a positive integer', meta: null },
          { status: 400 }
        );
      }
      updates.priority = body.priority;
    }

    if (body.match_type !== undefined) {
      if (!ALLOWED_MATCH_TYPES.has(body.match_type)) {
        return Response.json(
          {
            data: null,
            error: `Invalid match_type. Allowed types: ${Array.from(ALLOWED_MATCH_TYPES).join(', ')}`,
            meta: null,
          },
          { status: 400 }
        );
      }
      updates.match_type = body.match_type;
    }

    if (body.match_value !== undefined) {
      if (typeof body.match_value !== 'string' || !body.match_value.trim()) {
        return Response.json(
          { data: null, error: 'match_value must be a non-empty string', meta: null },
          { status: 400 }
        );
      }
      updates.match_value = body.match_value.trim();
    }

    if (body.assign_team !== undefined) {
      updates.assign_team = body.assign_team;
    }

    if (body.assign_customer !== undefined) {
      updates.assign_customer = body.assign_customer;
    }

    if (body.assign_feature !== undefined) {
      updates.assign_feature = body.assign_feature;
    }

    updates.updated_at = new Date().toISOString();

    const { data: updatedRule, error: updateError } = await supabase
      .from('allocation_rules')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (updateError || !updatedRule) {
      console.error('Update allocation rule error:', updateError);
      return apiError('An unexpected error occurred', 500);
    }

    return Response.json({
      data: updatedRule as AllocationRule,
      error: null,
      meta: null,
    });
  } catch (error) {
    console.error('Allocation rule PATCH error:', error);
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
      return apiError('Rule ID is required', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: existingRule, error: fetchError } = await supabase
      .from('allocation_rules')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingRule) {
      return apiError('Allocation rule not found', 404);
    }

    const { error: deleteError } = await supabase
      .from('allocation_rules')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('Delete allocation rule error:', deleteError);
      return apiError('An unexpected error occurred', 500);
    }

    return Response.json({
      data: { id, deleted: true },
      error: null,
      meta: null,
      success: true,
    });
  } catch (error) {
    console.error('Allocation rule DELETE error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}

