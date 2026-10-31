import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized } from '@/app/api/_lib/auth'
import { getAllocationCoverage } from '@/lib/clickhouse-queries'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const tenantId = user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({
        allocatedPct: 0,
        unallocatedPct: 100,
        byService: [],
      })
    }

    const coverage = await getAllocationCoverage(tenantId)
    return NextResponse.json(coverage)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

