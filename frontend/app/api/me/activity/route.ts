import { NextResponse } from 'next/server'
import { getMyActivityRecords } from '../../departments/store'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = Number(searchParams.get('limit') ?? '20')
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(100, limitParam)) : 20

    return NextResponse.json(getMyActivityRecords(limit))
  } catch (error) {
    console.error('[GET /api/me/activity]', error)

    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        error: 'INTERNAL_ERROR',
        message: 'An unexpected server error occurred.',
      },
      { status: 500 },
    )
  }
}
