import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized } from '@/app/api/_lib/auth'
import { getCloudSpend } from '@/lib/clickhouse-queries'
import { CloudSpendFilters } from '@/types/clickhouse'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const tenantId = user.user_metadata?.tenant_id
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1', 10) || 1
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10) || 50

    if (!tenantId) {
      return NextResponse.json({
        rows: [],
        total: 0,
        page,
        pageSize,
      })
    }

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

    const filters: CloudSpendFilters = {
      dateFrom,
      dateTo,
      page,
      pageSize,
    }

    const provider = searchParams.get('provider')
    if (provider) filters.provider = provider

    const service = searchParams.get('service')
    if (service) filters.service = service

    const region = searchParams.get('region')
    if (region) filters.region = region

    const team = searchParams.get('team')
    if (team) filters.team = team

    const result = await getCloudSpend(tenantId, filters)
    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

