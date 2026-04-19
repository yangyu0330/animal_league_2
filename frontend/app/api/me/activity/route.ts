import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadActivityData } from '../activity-data'

export async function GET() {
  try {
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

    const activityData = await loadActivityData(supabase, user.id)
    return NextResponse.json(activityData)
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
