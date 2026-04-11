import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const supabase = await createClient()

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    console.error('[auth/callback] exchangeCodeForSession failed', exchangeError)
    return NextResponse.redirect(`${origin}/login`)
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[auth/callback] getUser failed', userError)
    return NextResponse.redirect(`${origin}/login`)
  }

  const nickname =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'user'

  const { data: appUser, error: upsertError } = await supabase
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
    .select('selected_school_id')
    .single()

  if (upsertError) {
    console.error('[auth/callback] app_user upsert failed', upsertError)
    return NextResponse.redirect(`${origin}/login`)
  }

  if (appUser?.selected_school_id) {
    return NextResponse.redirect(`${origin}/home`)
  }

  return NextResponse.redirect(`${origin}/onboarding/school`)
}
