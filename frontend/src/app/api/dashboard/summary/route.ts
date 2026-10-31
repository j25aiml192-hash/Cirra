import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized } from '@/app/api/_lib/auth'
import { getDashboardSummary } from '@/lib/clickhouse-queries'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const tenantId = user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({
        hasData: false,
        totalSpend: 0,
        momChange: 0,
        topServices: [],
        topAiKeys: [],
        unallocatedPct: 0,
        coverageScore: 100,
      })
    }

    const { searchParams } = new URL(request.url)
    const now = new Date()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const from =
      searchParams.get('from') ||
      searchParams.get('startDate') ||
      searchParams.get('dateFrom') ||
      thirtyDaysAgo.toISOString()

    const to =
      searchParams.get('to') ||
      searchParams.get('endDate') ||
      searchParams.get('dateTo') ||
      now.toISOString()

    const summary = await getDashboardSummary(tenantId, { from, to })
    return NextResponse.json(summary)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

