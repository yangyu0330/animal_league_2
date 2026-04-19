import { NextResponse } from 'next/server'
import { getTitleLabel } from '@/lib/title-missions'
import { createClient } from '@/lib/supabase/server'

interface TitleAwardRow {
  user_id: string
}

interface AppUserRow {
  id: string
  nickname: string | null
  selected_school_id?: string | null
  selected_department_id?: string | null
  selected_title_key?: string | null
}

interface SchoolRow {
  id: string
  name: string
}

interface DepartmentRow {
  id: string
  name: string
}

type Scope = 'national' | 'school'

function buildEmptyResponse(scope: Scope) {
  return NextResponse.json({
    scope,
    items: [],
    generatedAt: new Date().toISOString(),
  })
}

async function fetchAppUsers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  scope: Scope,
  schoolId?: string,
) {
  let queryWithTitle = supabase
    .from('app_user')
    .select('id, nickname, selected_school_id, selected_department_id, selected_title_key')

  if (scope === 'school' && schoolId) {
    queryWithTitle = queryWithTitle.eq('selected_school_id', schoolId)
  }

  const resultWithTitle = await queryWithTitle
  if (resultWithTitle.error?.code !== '42703') {
    return resultWithTitle
  }

  let fallbackQuery = supabase
    .from('app_user')
    .select('id, nickname, selected_school_id, selected_department_id')

  if (scope === 'school' && schoolId) {
    fallbackQuery = fallbackQuery.eq('selected_school_id', schoolId)
  }

  return fallbackQuery
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const scope: Scope = searchParams.get('scope') === 'school' ? 'school' : 'national'
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

    const awardsQuery = await supabase.from('user_title_award').select('user_id')
    if (awardsQuery.error?.code === '42P01' || awardsQuery.error?.code === '42703') {
      return buildEmptyResponse(scope)
    }
    if (awardsQuery.error) {
      console.error('[GET /api/rankings/titles] user_title_award query failed', awardsQuery.error)
      return NextResponse.json(
        {
          code: 'INTERNAL_ERROR',
          error: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred.',
        },
        { status: 500 },
      )
    }

    const titleCountByUser = new Map<string, number>()
    for (const row of (awardsQuery.data ?? []) as TitleAwardRow[]) {
      titleCountByUser.set(row.user_id, (titleCountByUser.get(row.user_id) ?? 0) + 1)
    }

    if (titleCountByUser.size === 0) {
      return buildEmptyResponse(scope)
    }

    const appUserQuery = await fetchAppUsers(supabase, scope, schoolId)
    if (appUserQuery.error) {
      console.error('[GET /api/rankings/titles] app_user query failed', appUserQuery.error)
      return NextResponse.json(
        {
          code: 'INTERNAL_ERROR',
          error: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred.',
        },
        { status: 500 },
      )
    }

    const appUsers = (appUserQuery.data ?? []) as AppUserRow[]
    if (appUsers.length === 0) {
      return buildEmptyResponse(scope)
    }

    const rankedUsers = appUsers
      .map((row) => ({
        row,
        titleCount: titleCountByUser.get(row.id) ?? 0,
      }))
      .filter((item) => item.titleCount > 0)
      .sort((a, b) => {
        if (a.titleCount !== b.titleCount) return b.titleCount - a.titleCount
        return a.row.id.localeCompare(b.row.id)
      })
      .slice(0, 5)

    if (rankedUsers.length === 0) {
      return buildEmptyResponse(scope)
    }

    const schoolIds = Array.from(
      new Set(
        rankedUsers
          .map((item) => item.row.selected_school_id)
          .filter((id): id is string => Boolean(id)),
      ),
    )
    const departmentIds = Array.from(
      new Set(
        rankedUsers
          .map((item) => item.row.selected_department_id)
          .filter((id): id is string => Boolean(id)),
      ),
    )

    const schoolMap = new Map<string, string>()
    const departmentMap = new Map<string, string>()

    if (schoolIds.length > 0) {
      const schoolsQuery = await supabase.from('school').select('id, name').in('id', schoolIds)
      if (schoolsQuery.error) {
        console.error('[GET /api/rankings/titles] school query failed', schoolsQuery.error)
        return NextResponse.json(
          {
            code: 'INTERNAL_ERROR',
            error: 'INTERNAL_ERROR',
            message: 'An unexpected server error occurred.',
          },
          { status: 500 },
        )
      }
      for (const school of (schoolsQuery.data ?? []) as SchoolRow[]) {
        schoolMap.set(school.id, school.name)
      }
    }

    if (departmentIds.length > 0) {
      const departmentsQuery = await supabase.from('department').select('id, name').in('id', departmentIds)
      if (departmentsQuery.error) {
        console.error('[GET /api/rankings/titles] department query failed', departmentsQuery.error)
        return NextResponse.json(
          {
            code: 'INTERNAL_ERROR',
            error: 'INTERNAL_ERROR',
            message: 'An unexpected server error occurred.',
          },
          { status: 500 },
        )
      }
      for (const department of (departmentsQuery.data ?? []) as DepartmentRow[]) {
        departmentMap.set(department.id, department.name)
      }
    }

    return NextResponse.json({
      scope,
      items: rankedUsers.map((item, index) => ({
        rank: index + 1,
        userId: item.row.id,
        nickname: item.row.nickname?.trim() || 'user',
        schoolName: item.row.selected_school_id ? schoolMap.get(item.row.selected_school_id) ?? '' : '',
        departmentName: item.row.selected_department_id
          ? departmentMap.get(item.row.selected_department_id) ?? ''
          : '',
        titleCount: item.titleCount,
        selectedTitleKey: item.row.selected_title_key ?? null,
        selectedTitleLabel: getTitleLabel(item.row.selected_title_key ?? null),
      })),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[GET /api/rankings/titles] unexpected error', error)
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
