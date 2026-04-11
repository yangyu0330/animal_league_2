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

function resolveSchoolName(school: SchoolRelation): string | null {
  if (!school) return null
  if (Array.isArray(school)) {
    return school[0]?.name ?? null
  }
  return school.name ?? null
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

  const { data: appUser, error: appUserError } = await supabase
    .from('app_user')
    .select('selected_school_id, school:school(id, name)')
    .eq('id', user.id)
    .maybeSingle()

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

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? '',
      name: fallbackName,
      selectedSchoolId,
      selectedSchoolName,
      selectedDepartmentId: null,
      selectedDepartmentName: null,
    },
  })
}
