import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ClickEventRow {
  id: string
  department_id: string
  created_at: string
  accepted: boolean
  ref_source: 'direct' | 'share'
  reason: string | null
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

function todayStartIso(): string {
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)
  return date.toISOString()
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = Number(searchParams.get('limit') ?? '20')
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(100, limitParam)) : 20

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', error: 'UNAUTHORIZED', message: 'Authentication is required.' },
        { status: 401 },
      )
    }

    const eventsQuery = await supabase
      .from('click_event')
      .select('id, department_id, created_at, accepted, ref_source, reason')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (eventsQuery.error) {
      console.error('[GET /api/me/activity] click_event query failed', eventsQuery.error)
      return NextResponse.json(
        {
          code: 'INTERNAL_ERROR',
          error: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred.',
        },
        { status: 500 },
      )
    }

    const events = (eventsQuery.data ?? []) as ClickEventRow[]
    const departmentIds = Array.from(new Set(events.map((event) => event.department_id)))

    let departmentMap = new Map<string, { name: string; schoolName: string }>()

    if (departmentIds.length > 0) {
      const departmentsQuery = await supabase
        .from('department')
        .select('id, name, school:school(name)')
        .in('id', departmentIds)

      if (departmentsQuery.error) {
        console.error('[GET /api/me/activity] department query failed', departmentsQuery.error)
        return NextResponse.json(
          {
            code: 'INTERNAL_ERROR',
            error: 'INTERNAL_ERROR',
            message: 'An unexpected server error occurred.',
          },
          { status: 500 },
        )
      }

      departmentMap = new Map(
        ((departmentsQuery.data ?? []) as DepartmentRow[]).map((department) => [
          department.id,
          {
            name: department.name,
            schoolName: resolveSchoolName(department.school),
          },
        ]),
      )
    }

    const todayCountQuery = await supabase
      .from('click_event')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('accepted', true)
      .gte('created_at', todayStartIso())

    if (todayCountQuery.error) {
      console.error('[GET /api/me/activity] today count query failed', todayCountQuery.error)
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
      todayCount: Number(todayCountQuery.count ?? 0),
      items: events.map((event) => {
        const department = departmentMap.get(event.department_id)
        return {
          id: event.id,
          departmentId: event.department_id,
          departmentName: department?.name ?? 'Unknown Department',
          schoolName: department?.schoolName ?? '',
          createdAt: event.created_at,
          accepted: event.accepted,
          refSource: event.ref_source,
          reason: event.reason ?? undefined,
        }
      }),
    })
  } catch (error) {
    console.error('[GET /api/me/activity] unexpected error', error)
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
