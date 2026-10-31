import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized } from '@/app/api/_lib/auth'
import { getAiSpend } from '@/lib/clickhouse-queries'
import { AiSpendFilters } from '@/types/clickhouse'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const tenantId = user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({
        rows: [],
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
      })
    }

    const { searchParams } = new URL(request.url)
    const now = new Date()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const dateFrom =
      searchParams.get('startDate') ||
      searchParams.get('dateFrom') ||
      searchParams.get('from') ||
      thirtyDaysAgo.toISOString()

    const dateTo =
      searchParams.get('endDate') ||
      searchParams.get('dateTo') ||
      searchParams.get('to') ||
      now.toISOString()

    const filters: AiSpendFilters = {
      dateFrom,
      dateTo,
    }

    const model = searchParams.get('model')
    if (model) filters.model = model

    const apiKey = searchParams.get('apiKey') || searchParams.get('api_key')
    if (apiKey) filters.apiKey = apiKey

    const team = searchParams.get('team')
    if (team) filters.team = team

    const result = await getAiSpend(tenantId, filters)
    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

