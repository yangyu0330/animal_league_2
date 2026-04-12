import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function sanitizeNextPath(nextPath: string | null): string | null {
  if (!nextPath) return null
  if (!nextPath.startsWith('/')) return null
  if (nextPath.startsWith('//')) return null
  return nextPath
}

function buildLoginRedirect(origin: string, nextPath: string | null): string {
  const loginUrl = new URL('/login', origin)
  if (nextPath) {
    loginUrl.searchParams.set('next', nextPath)
  }
  return loginUrl.toString()
}

async function getUserSelection(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data, error } = await supabase
    .from('app_user')
    .select('selected_school_id, selected_department_id')
    .eq('id', userId)
    .maybeSingle()

  if (!error) {
    const selectedSchoolId = data?.selected_school_id ?? null
    const selectedDepartmentId = data?.selected_department_id ?? null

    if (!selectedSchoolId || !selectedDepartmentId) {
      return {
        selectedSchoolId,
        selectedDepartmentId: null,
        error: null as unknown,
      }
    }

    const departmentQuery = await supabase
      .from('department')
      .select('school_id')
      .eq('id', selectedDepartmentId)
      .maybeSingle()

    return {
      selectedSchoolId,
      selectedDepartmentId:
        departmentQuery.data?.school_id === selectedSchoolId ? selectedDepartmentId : null,
      error: departmentQuery.error,
    }
  }

  if (error.code !== '42703') {
    return {
      selectedSchoolId: null,
      selectedDepartmentId: null,
      error,
    }
  }

  const fallback = await supabase
    .from('app_user')
    .select('selected_school_id')
    .eq('id', userId)
    .maybeSingle()

  return {
    selectedSchoolId: fallback.data?.selected_school_id ?? null,
    selectedDepartmentId: null,
    error: fallback.error,
  }
}

async function ensureAppUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    userId: string
    nickname: string
  },
) {
  const { userId, nickname } = input
  const profilePayload = {
    provider: 'google',
    nickname,
    updated_at: new Date().toISOString(),
  }

  const existingProfile = await supabase
    .from('app_user')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existingProfile.error) {
    return existingProfile.error
  }

  if (existingProfile.data) {
    const updateResult = await supabase
      .from('app_user')
      .update(profilePayload)
      .eq('id', userId)
    return updateResult.error
  }

  const insertResult = await supabase
    .from('app_user')
    .insert({
      id: userId,
      ...profilePayload,
    })

  if (insertResult.error?.code === '23505') {
    const retryUpdate = await supabase
      .from('app_user')
      .update(profilePayload)
      .eq('id', userId)
    return retryUpdate.error
  }

  return insertResult.error
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get('next'))
  const origin = requestUrl.origin

  if (!code) {
    return NextResponse.redirect(buildLoginRedirect(origin, nextPath))
  }

  const supabase = await createClient()

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    console.error('[auth/callback] exchangeCodeForSession failed', exchangeError)
    return NextResponse.redirect(buildLoginRedirect(origin, nextPath))
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[auth/callback] getUser failed', userError)
    return NextResponse.redirect(buildLoginRedirect(origin, nextPath))
  }

  const nickname =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'user'

  const upsertError = await ensureAppUser(supabase, {
    userId: user.id,
    nickname,
  })

  if (upsertError) {
    console.error('[auth/callback] app_user ensure failed', upsertError)
    return NextResponse.redirect(buildLoginRedirect(origin, nextPath))
  }

  const selection = await getUserSelection(supabase, user.id)
  if (selection.error) {
    console.error('[auth/callback] failed to fetch selected school/department', selection.error)
    return NextResponse.redirect(buildLoginRedirect(origin, nextPath))
  }

  if (selection.selectedSchoolId && selection.selectedDepartmentId) {
    return NextResponse.redirect(new URL('/home', origin).toString())
  }

  const onboardingUrl = new URL('/onboarding/school', origin)
  if (nextPath) {
    onboardingUrl.searchParams.set('next', nextPath)
  }
  return NextResponse.redirect(onboardingUrl.toString())
}
