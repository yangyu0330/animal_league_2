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
    return {
      selectedSchoolId: data?.selected_school_id ?? null,
      selectedDepartmentId: data?.selected_department_id ?? null,
      error: null as unknown,
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

  const { error: upsertError } = await supabase
    .from('app_user')
    .upsert(
      {
        id: user.id,
        provider: 'google',
        nickname,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )

  if (upsertError) {
    console.error('[auth/callback] app_user upsert failed', upsertError)
    return NextResponse.redirect(buildLoginRedirect(origin, nextPath))
  }

  const selection = await getUserSelection(supabase, user.id)
  if (selection.error) {
    console.error('[auth/callback] failed to fetch selected school/department', selection.error)
    return NextResponse.redirect(buildLoginRedirect(origin, nextPath))
  }

  if (selection.selectedSchoolId && selection.selectedDepartmentId) {
    const target = nextPath ?? '/home'
    return NextResponse.redirect(new URL(target, origin).toString())
  }

  const onboardingUrl = new URL('/onboarding/school', origin)
  if (nextPath) {
    onboardingUrl.searchParams.set('next', nextPath)
  }
  return NextResponse.redirect(onboardingUrl.toString())
}
