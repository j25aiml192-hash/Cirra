import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser, unauthorized } from '@/app/api/_lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const body = await request.json().catch(() => ({}));
    const orgName = body.orgName || (user.email ? `${user.email.split('@')[0]}'s Team` : 'My Organization');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase service role configuration missing' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Step 1 — Create tenant in Supabase via service role client
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: orgName,
        plan: 'free',
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      console.error('Failed to create tenant:', tenantError);
      return NextResponse.json(
        { error: tenantError?.message || 'Failed to create tenant' },
        { status: 500 }
      );
    }

    // Ensure user row exists in metadata users table
    if (user.email) {
      await supabaseAdmin.from('users').upsert({
        id: user.id,
        tenant_id: tenant.id,
        email: user.email,
        role: 'owner',
      });
    }

    // Step 2 — Set tenant_id in user’s app_metadata and user_metadata via service role
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: { tenant_id: tenant.id },
        user_metadata: { ...user.user_metadata, tenant_id: tenant.id },
      }
    );

    if (updateError) {
      console.error('Failed to update user app_metadata:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tenantId: tenant.id,
    });
  } catch (error) {
    console.error('Onboarding failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

