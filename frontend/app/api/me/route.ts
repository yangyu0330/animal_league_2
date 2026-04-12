import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type SchoolRelation =
  | {
      id?: string
      name?: string
    }
  | Array<{
      id?: string
      name?: string
    }>
  | null

type DepartmentRelation =
  | {
      id?: string
      name?: string
      school_id?: string
    }
  | Array<{
      id?: string
      name?: string
      school_id?: string
    }>
  | null

interface AppUserProfileRow {
  selected_school_id?: string | null
  selected_department_id?: string | null
  school?: SchoolRelation
  department?: DepartmentRelation
}

function resolveSchoolName(school: SchoolRelation): string | null {
  if (!school) return null
  if (Array.isArray(school)) {
    return school[0]?.name ?? null
  }
  return school.name ?? null
}

function resolveDepartmentName(department: DepartmentRelation): string | null {
  if (!department) return null
  if (Array.isArray(department)) {
    return department[0]?.name ?? null
  }
  return department.name ?? null
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ user: null })
  }

  const profileQuery = await supabase
    .from('app_user')
    .select('selected_school_id, selected_department_id, school:school(id, name), department:department(id, name, school_id)')
    .eq('id', user.id)
    .maybeSingle()

  let appUser: AppUserProfileRow | null = profileQuery.data as AppUserProfileRow | null
  let appUserError = profileQuery.error

  if (appUserError?.code === '42703') {
    const fallbackQuery = await supabase
      .from('app_user')
      .select('selected_school_id, school:school(id, name)')
      .eq('id', user.id)
      .maybeSingle()

    appUser = fallbackQuery.data as AppUserProfileRow | null
    appUserError = fallbackQuery.error
  }

  if (appUserError) {
    console.error('[GET /api/me] failed to fetch app_user', appUserError)
  }

  const fallbackName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'user'

  const selectedSchoolId = appUser?.selected_school_id ?? null
  const selectedSchoolName = resolveSchoolName((appUser?.school ?? null) as SchoolRelation)
  const selectedDepartmentId = appUser?.selected_department_id ?? null
  const selectedDepartmentName = resolveDepartmentName(
    (appUser?.department ?? null) as DepartmentRelation,
  )

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? '',
      name: fallbackName,
      selectedSchoolId,
      selectedSchoolName,
      selectedDepartmentId,
      selectedDepartmentName,
    },
  })
}
