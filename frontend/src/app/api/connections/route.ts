import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getAuthenticatedUser, unauthorized } from '@/app/api/_lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

const ALLOWED_PROVIDERS = ['aws', 'openai', 'gcp', 'azure'] as const
type AllowedProvider = (typeof ALLOWED_PROVIDERS)[number]

function encryptCredentials(data: object): { iv: string; tag: string; ciphertext: string } {
  const encryptionKey = process.env.ENCRYPTION_KEY
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is missing')
  }
  const key = Buffer.from(encryptionKey, 'base64')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const json = JSON.stringify(data)
  const ciphertext = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  }
}

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
      .from('connections')
      .select('id, tenant_id, provider, name, status, last_synced_at, last_error, created_at')
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Failed to fetch connections:', error)
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
    const { provider, name, credentials } = body

    if (!provider || !ALLOWED_PROVIDERS.includes(provider as AllowedProvider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${ALLOWED_PROVIDERS.join(', ')}` },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Connection name is required' }, { status: 400 })
    }

    if (!credentials || typeof credentials !== 'object') {
      return NextResponse.json({ error: 'Credentials object is required' }, { status: 400 })
    }

    const credentials_encrypted = encryptCredentials(credentials)

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('connections')
      .insert({
        tenant_id: tenantId,
        provider,
        name,
        credentials_encrypted,
        status: 'pending',
      })
      .select('id, tenant_id, provider, name, status, last_synced_at, last_error, created_at')
      .single()

    if (error) {
      console.error('Failed to create connection:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

