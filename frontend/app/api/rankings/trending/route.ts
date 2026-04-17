import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getKstDayStartIso } from '@/lib/time'

interface ClickEventDepartmentRow {
  department_id: string
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

export async function GET() {
  try {
    const supabase = await createClient()
    const clickCounts = new Map<string, number>()
    const startOfKstDay = getKstDayStartIso()
    const pageSize = 1000
    let from = 0

    while (true) {
      const to = from + pageSize - 1
      const todayClicksQuery = await supabase
        .from('click_event')
        .select('department_id')
        .eq('accepted', true)
        .gte('created_at', startOfKstDay)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (todayClicksQuery.error) {
        console.error('[GET /api/rankings/trending] click_event query failed', todayClicksQuery.error)
        return NextResponse.json(
          {
            code: 'INTERNAL_ERROR',
            error: 'INTERNAL_ERROR',
            message: 'An unexpected server error occurred.',
          },
          { status: 500 },
        )
      }

      const rows = (todayClicksQuery.data ?? []) as ClickEventDepartmentRow[]
      for (const row of rows) {
        clickCounts.set(row.department_id, (clickCounts.get(row.department_id) ?? 0) + 1)
      }

      if (rows.length < pageSize) break
      from += pageSize
    }

    const rankedCounts = Array.from(clickCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const departmentIds = rankedCounts.map(([departmentId]) => departmentId)
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
      items: rankedCounts.map(([departmentId, todayClicks]) => {
        const department = departmentMap.get(departmentId)
        return {
          departmentId,
          departmentName: department?.name ?? 'Unknown Department',
          schoolName: department?.schoolName ?? '',
          todayClicks,
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
