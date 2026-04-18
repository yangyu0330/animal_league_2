import { NextResponse } from 'next/server'
import { calculatePressureLevel, calculateStackCount } from '@/lib/domain'
import { createClient } from '@/lib/supabase/server'

interface SchoolRelation {
  name?: string
}

interface DepartmentRankingRow {
  id: string
  name: string
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
    const scope = searchParams.get('scope') === 'school' ? 'school' : 'national'
    const schoolId = searchParams.get('schoolId')?.trim() || undefined

    if (scope === 'school' && !schoolId) {
      return NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          error: 'VALIDATION_ERROR',
          message: 'schoolId is required when scope=school.',
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    let query = supabase
      .from('department')
      .select('id, name, total_clicks, school:school(name)')
      .order('total_clicks', { ascending: false })
      .limit(10)

    if (scope === 'school' && schoolId) {
      query = query.eq('school_id', schoolId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[GET /api/rankings] query failed', error)
      return NextResponse.json(
        {
          code: 'INTERNAL_ERROR',
          error: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred.',
        },
        { status: 500 },
      )
    }

    const rows = (data ?? []) as DepartmentRankingRow[]
    const items = rows.map((row, index) => {
      const totalClicks = Number(row.total_clicks ?? 0)

      return {
        rank: index + 1,
        departmentId: row.id,
        departmentName: row.name,
        schoolName: resolveSchoolName(row.school),
        totalClicks,
        stackCount: calculateStackCount(totalClicks),
        pressureLevel: calculatePressureLevel(totalClicks),
      }
    })

    return NextResponse.json({
      scope,
      items,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[GET /api/rankings] unexpected error', error)
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
