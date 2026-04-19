import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AppUserProfileRow {
  selected_school_id?: string | null
  selected_department_id?: string | null
  selected_title_key?: string | null
}

function getFallbackName(email: string, metadataName?: string, metadataFullName?: string) {
  return metadataName || metadataFullName || email.split('@')[0] || 'user'
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
    .select('selected_school_id, selected_department_id, selected_title_key')
    .eq('id', user.id)
    .maybeSingle()

  if (profileQuery.error) {
    console.error('[GET /api/me] failed to fetch app_user', profileQuery.error)
  }

  const appUser = profileQuery.data as AppUserProfileRow | null
  const rawSelectedSchoolId = appUser?.selected_school_id ?? null
  const rawSelectedDepartmentId = appUser?.selected_department_id ?? null
  const selectedTitleKey = appUser?.selected_title_key ?? null

  let selectedSchoolId: string | null = null
  let selectedSchoolName: string | null = null
  let selectedDepartmentId: string | null = null
  let selectedDepartmentName: string | null = null

  if (rawSelectedSchoolId) {
    const schoolQuery = await supabase
      .from('school')
      .select('id, name')
      .eq('id', rawSelectedSchoolId)
      .maybeSingle()

    if (schoolQuery.error) {
      console.error('[GET /api/me] failed to fetch selected school', schoolQuery.error)
    } else if (schoolQuery.data) {
      selectedSchoolId = schoolQuery.data.id
      selectedSchoolName = schoolQuery.data.name
    }
  }

  if (rawSelectedDepartmentId && selectedSchoolId) {
    const departmentQuery = await supabase
      .from('department')
      .select('id, name, school_id')
      .eq('id', rawSelectedDepartmentId)
      .maybeSingle()

    if (departmentQuery.error) {
      console.error('[GET /api/me] failed to fetch selected department', departmentQuery.error)
    } else if (departmentQuery.data?.school_id === selectedSchoolId) {
      selectedDepartmentId = departmentQuery.data.id
      selectedDepartmentName = departmentQuery.data.name
    }
  }

  const fallbackName = getFallbackName(
    user.email ?? '',
    user.user_metadata?.name,
    user.user_metadata?.full_name,
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
      selectedTitleKey,
    },
  })
}
