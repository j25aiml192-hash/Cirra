import { NextRequest } from 'next/server';
import { CostExplorerClient, GetDimensionValuesCommand } from '@aws-sdk/client-cost-explorer';
import { getAuthenticatedUser, unauthorized, apiError } from '@/app/api/_lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { decryptCredentials } from '@/lib/connectors/crypto';

interface RouteContext {
  params: {
    id: string;
  };
}

interface TestResult {
  ok: boolean;
  message: string;
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

    const { id } = params;
    if (!id) {
      return apiError('Connection ID is required', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: connection, error: fetchError } = await supabase
      .from('connections')
      .select('id, tenant_id, provider, credentials_encrypted, status')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !connection) {
      return apiError('Connection not found', 404);
    }

    let creds: Record<string, string>;
    try {
      creds = decryptCredentials(connection.credentials_encrypted);
    } catch {
      const failMsg = 'Failed to decrypt connection credentials';
      await supabase
        .from('connections')
        .update({ status: 'error', last_error: failMsg })
        .eq('id', id);

      return Response.json({
        data: { ok: false, message: failMsg },
        error: null,
      });
    }

    let testResult: TestResult = { ok: false, message: '' };

    try {
      switch (connection.provider?.toLowerCase()) {
        case 'openai': {
          const apiKey = creds.apiKey || creds.api_key;
          if (!apiKey) throw new Error('Missing OpenAI API key');

          const res = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
          });

          if (!res.ok) {
            throw new Error(`OpenAI API returned status ${res.status}`);
          }
          testResult = { ok: true, message: 'OpenAI connection verified successfully' };
          break;
        }

        case 'anthropic': {
          const apiKey = creds.apiKey || creds.api_key;
          if (!apiKey) throw new Error('Missing Anthropic API key');

          const res = await fetch('https://api.anthropic.com/v1/models', {
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
          });

          if (!res.ok) {
            throw new Error(`Anthropic API returned status ${res.status}`);
          }
          testResult = { ok: true, message: 'Anthropic connection verified successfully' };
          break;
        }

        case 'aws': {
          const accessKeyId = creds.accessKeyId || creds.access_key_id;
          const secretAccessKey = creds.secretAccessKey || creds.secret_access_key;
          const region = creds.region || 'us-east-1';

          if (!accessKeyId || !secretAccessKey) {
            throw new Error('Missing AWS access key or secret');
          }

          const client = new CostExplorerClient({
            region: 'us-east-1',
            credentials: { accessKeyId, secretAccessKey },
          });

          const end = new Date();
          const start = new Date(Date.now() - 86400000);
          const startStr = start.toISOString().split('T')[0];
          const endStr = end.toISOString().split('T')[0];

          await client.send(
            new GetDimensionValuesCommand({
              TimePeriod: { Start: startStr, End: endStr },
              Dimension: 'SERVICE',
            })
          );

          testResult = { ok: true, message: 'AWS Cost Explorer connection verified successfully' };
          break;
        }

        case 'gcp': {
          const saRaw = creds.service_account || creds.serviceAccount;
          const sa = typeof saRaw === 'string' ? JSON.parse(saRaw) : saRaw || creds;

          if (!sa || typeof sa !== 'object' || !sa.project_id) {
            throw new Error('Missing project_id in service account JSON');
          }
          testResult = { ok: true, message: 'GCP Service Account validated successfully' };
          break;
        }

        default:
          return Response.json({
            data: { ok: false, message: 'Provider not yet testable' },
            error: null,
          });
      }
    } catch (testErr: unknown) {
      const errMsg = testErr instanceof Error ? testErr.message : String(testErr);
      testResult = { ok: false, message: errMsg };
    }

    if (testResult.ok) {
      await supabase
        .from('connections')
        .update({
          status: 'connected',
          last_synced_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', id);
    } else {
      await supabase
        .from('connections')
        .update({
          status: 'error',
          last_error: testResult.message,
        })
        .eq('id', id);
    }

    return Response.json({
      data: testResult,
      error: null,
    });
  } catch (error) {
    console.error('Connection test error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}

