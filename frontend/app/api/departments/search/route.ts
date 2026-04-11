import { NextResponse } from 'next/server'
import { searchDepartmentRecords } from '../store'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') ?? ''
    const schoolId = searchParams.get('schoolId') ?? undefined
    const limitParam = Number(searchParams.get('limit') ?? '20')
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(50, limitParam)) : 20

    return NextResponse.json(searchDepartmentRecords(q, schoolId, limit))
  } catch (error) {
    console.error('[GET /api/departments/search]', error)

    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
