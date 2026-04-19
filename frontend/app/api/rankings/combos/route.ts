import { NextResponse } from 'next/server'
import { getTitleLabel } from '@/lib/title-missions'
import { createClient } from '@/lib/supabase/server'

interface AppUserComboRankingRow {
  id: string
  nickname: string | null
  max_combo: number | null
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

function buildEmptyResponse() {
  return NextResponse.json({
    items: [],
    generatedAt: new Date().toISOString(),
  })
}

async function fetchComboRankingRows(supabase: Awaited<ReturnType<typeof createClient>>) {
  const queryWithTitle = await supabase
    .from('app_user')
    .select('id, nickname, max_combo, selected_school_id, selected_department_id, selected_title_key')
    .gt('max_combo', 0)
    .order('max_combo', { ascending: false })
    .order('id', { ascending: true })
    .limit(5)

  if (queryWithTitle.error?.code !== '42703') {
    return queryWithTitle
  }

  return supabase
    .from('app_user')
    .select('id, nickname, max_combo, selected_school_id, selected_department_id')
    .gt('max_combo', 0)
    .order('max_combo', { ascending: false })
    .order('id', { ascending: true })
    .limit(5)
}

export async function GET() {
  try {
    const supabase = await createClient()
    const rankingQuery = await fetchComboRankingRows(supabase)

    if (rankingQuery.error) {
      console.error('[GET /api/rankings/combos] app_user query failed', rankingQuery.error)
      return NextResponse.json(
        {
          code: 'INTERNAL_ERROR',
          error: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred.',
        },
        { status: 500 },
      )
    }

    const rows = (rankingQuery.data ?? []) as AppUserComboRankingRow[]
    if (rows.length === 0) {
      return buildEmptyResponse()
    }

    const schoolIds = Array.from(
      new Set(rows.map((row) => row.selected_school_id).filter((schoolId): schoolId is string => Boolean(schoolId))),
    )
    const departmentIds = Array.from(
      new Set(
        rows
          .map((row) => row.selected_department_id)
          .filter((departmentId): departmentId is string => Boolean(departmentId)),
      ),
    )

    const schoolMap = new Map<string, string>()
    const departmentMap = new Map<string, string>()

    if (schoolIds.length > 0) {
      const schoolsQuery = await supabase.from('school').select('id, name').in('id', schoolIds)

      if (schoolsQuery.error) {
        console.error('[GET /api/rankings/combos] school query failed', schoolsQuery.error)
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
        console.error('[GET /api/rankings/combos] department query failed', departmentsQuery.error)
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
      items: rows.map((row, index) => ({
        rank: index + 1,
        userId: row.id,
        nickname: row.nickname?.trim() || 'user',
        schoolName: row.selected_school_id ? schoolMap.get(row.selected_school_id) ?? '' : '',
        departmentName: row.selected_department_id ? departmentMap.get(row.selected_department_id) ?? '' : '',
        maxCombo: Number(row.max_combo ?? 0),
        selectedTitleKey: row.selected_title_key ?? null,
        selectedTitleLabel: getTitleLabel(row.selected_title_key ?? null),
      })),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[GET /api/rankings/combos] unexpected error', error)
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
