import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface DailyStatRow {
  department_id: string
  accepted_clicks: number
}

interface SchoolRelation {
  name?: string
}

interface DepartmentRow {
  id: string
  name: string
  school?: SchoolRelation | SchoolRelation[] | null
}

function resolveSchoolName(school: SchoolRelation | SchoolRelation[] | null | undefined): string {
  if (!school) return ''
  if (Array.isArray(school)) return school[0]?.name ?? ''
  return school.name ?? ''
}

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function GET() {
  try {
    const supabase = await createClient()
    const dailyQuery = await supabase
      .from('department_daily_stat')
      .select('department_id, accepted_clicks')
      .eq('date', todayDateKey())
      .order('accepted_clicks', { ascending: false })
      .limit(5)

    if (dailyQuery.error) {
      console.error('[GET /api/rankings/trending] daily stat query failed', dailyQuery.error)
      return NextResponse.json(
        {
          code: 'INTERNAL_ERROR',
          error: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred.',
        },
        { status: 500 },
      )
    }

    const dailyRows = (dailyQuery.data ?? []) as DailyStatRow[]
    const departmentIds = dailyRows.map((row) => row.department_id)
    if (departmentIds.length === 0) {
      return NextResponse.json({
        items: [],
        generatedAt: new Date().toISOString(),
      })
    }

    const departmentQuery = await supabase
      .from('department')
      .select('id, name, school:school(name)')
      .in('id', departmentIds)

    if (departmentQuery.error) {
      console.error('[GET /api/rankings/trending] department query failed', departmentQuery.error)
      return NextResponse.json(
        {
          code: 'INTERNAL_ERROR',
          error: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred.',
        },
        { status: 500 },
      )
    }

    const departmentMap = new Map(
      ((departmentQuery.data ?? []) as DepartmentRow[]).map((department) => [
        department.id,
        {
          name: department.name,
          schoolName: resolveSchoolName(department.school),
        },
      ]),
    )

    return NextResponse.json({
      items: dailyRows.map((row) => {
        const department = departmentMap.get(row.department_id)
        return {
          departmentId: row.department_id,
          departmentName: department?.name ?? 'Unknown Department',
          schoolName: department?.schoolName ?? '',
          todayClicks: Number(row.accepted_clicks ?? 0),
        }
      }),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[GET /api/rankings/trending] unexpected error', error)
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
