import { NextResponse } from 'next/server'
import { calculatePressureLevel, calculateStackCount } from '@/lib/domain'
import { createClient } from '@/lib/supabase/server'

interface SchoolRelation {
  name?: string
}

interface DepartmentSearchRow {
  id: string
  name: string
  category: string
  total_clicks: number
  school?: SchoolRelation | SchoolRelation[] | null
}

function resolveSchoolName(school: SchoolRelation | SchoolRelation[] | null | undefined): string {
  if (!school) return ''
  if (Array.isArray(school)) return school[0]?.name ?? ''
  return school.name ?? ''
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() ?? ''
    const schoolId = searchParams.get('schoolId')?.trim() || undefined
    const limitParam = Number(searchParams.get('limit') ?? '20')
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(50, limitParam)) : 20

    const supabase = await createClient()

    let query = supabase
      .from('department')
      .select('id, name, category, total_clicks, school:school(name)')
      .order('total_clicks', { ascending: false })
      .limit(limit)

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

    if (q) {
      query = query.ilike('name', `%${q}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[GET /api/departments/search] query failed', error)
      return NextResponse.json(
        {
          code: 'INTERNAL_ERROR',
          error: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred.',
        },
        { status: 500 },
      )
    }

    const items = ((data ?? []) as DepartmentSearchRow[]).map((row) => {
      const totalClicks = Number(row.total_clicks ?? 0)

      return {
        departmentId: row.id,
        name: row.name,
        schoolName: resolveSchoolName(row.school),
        category: row.category,
        totalClicks,
        stackCount: calculateStackCount(totalClicks),
        pressureLevel: calculatePressureLevel(totalClicks),
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('[GET /api/departments/search] unexpected error', error)
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
