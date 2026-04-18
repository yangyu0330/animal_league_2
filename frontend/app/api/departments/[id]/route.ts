import { NextResponse } from 'next/server'
import { calculatePressureLevel, calculateStackCount } from '@/lib/domain'
import { createClient } from '@/lib/supabase/server'
import { getKstDayStartIso } from '@/lib/time'

interface SchoolRelation {
  name?: string
}

interface DepartmentRow {
  id: string
  school_id: string
  name: string
  normalized_name: string
  category: string
  template_id: string
  total_clicks: number
  school?: SchoolRelation | SchoolRelation[] | null
}

function resolveSchoolName(school: SchoolRelation | SchoolRelation[] | null | undefined): string {
  if (!school) return ''
  if (Array.isArray(school)) return school[0]?.name ?? ''
  return school.name ?? ''
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const departmentQuery = await supabase
      .from('department')
      .select(
        'id, school_id, name, normalized_name, category, template_id, total_clicks, school:school(name)',
      )
      .eq('id', id)
      .maybeSingle()

    if (departmentQuery.error) {
      console.error('[GET /api/departments/:id] department lookup failed', departmentQuery.error)
      return NextResponse.json(
        {
          code: 'INTERNAL_ERROR',
          error: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred.',
        },
        { status: 500 },
      )
    }

    if (!departmentQuery.data) {
      return NextResponse.json(
        {
          code: 'NOT_FOUND',
          error: 'NOT_FOUND',
          message: 'Department not found.',
        },
        { status: 404 },
      )
    }

    const department = departmentQuery.data as DepartmentRow
    const totalClicks = Number(department.total_clicks ?? 0)

    let todayClicks = 0
    const countQuery = await supabase
      .from('click_event')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', id)
      .eq('accepted', true)
      .gte('created_at', getKstDayStartIso())

    if (!countQuery.error) {
      todayClicks = Number(countQuery.count ?? 0)
    }

    return NextResponse.json({
      departmentId: department.id,
      departmentName: department.name,
      schoolName: resolveSchoolName(department.school),
      category: department.category,
      templateId: department.template_id,
      totalClicks,
      stackCount: calculateStackCount(totalClicks),
      pressureLevel: calculatePressureLevel(totalClicks),
      todayClicks,
      schoolId: department.school_id,
      normalizedName: department.normalized_name,
    })
  } catch (error) {
    console.error('[GET /api/departments/:id] unexpected error', error)

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
