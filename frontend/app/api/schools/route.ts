import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() ?? ''
  const limitParam = Number(searchParams.get('limit') ?? '50')
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(200, limitParam)) : 50

  const supabase = await createClient()

  let schoolQuery = supabase.from('school').select('id, name').order('name', { ascending: true }).limit(limit)
  if (query) {
    schoolQuery = schoolQuery.ilike('name', `%${query}%`)
  }

  const { data, error } = await schoolQuery
  if (error) {
    console.error('[GET /api/schools] failed to fetch schools', error)
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        error: 'INTERNAL_ERROR',
        message: 'An unexpected server error occurred.',
      },
      { status: 500 },
    )
  }

  return NextResponse.json({
    items: (data ?? []).map((school) => ({
      id: school.id,
      name: school.name,
    })),
  })
}
