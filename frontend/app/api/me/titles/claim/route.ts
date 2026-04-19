import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadActivityData } from '../../activity-data'

interface ClaimTitlePayload {
  titleKey?: unknown
}

function buildValidationError(message: string) {
  return NextResponse.json(
    { code: 'VALIDATION_ERROR', error: 'VALIDATION_ERROR', message },
    { status: 400 },
  )
}

export async function POST(request: Request) {
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

    let body: ClaimTitlePayload
    try {
      body = (await request.json()) as ClaimTitlePayload
    } catch {
      return buildValidationError('Invalid JSON body.')
    }

    const titleKey = typeof body.titleKey === 'string' ? body.titleKey.trim() : ''
    if (!titleKey) {
      return buildValidationError('titleKey is required.')
    }

    const activityData = await loadActivityData(supabase, user.id)
    const targetMission = [...activityData.personalMissions, ...activityData.teamMissions].find(
      (mission) => mission.titleKey === titleKey,
    )

    if (!targetMission) {
      return buildValidationError('Unknown titleKey.')
    }

    if (targetMission.claimed) {
      return NextResponse.json({ awarded: false, reason: 'ALREADY_CLAIMED', titleKey })
    }

    if (!targetMission.claimable) {
      return NextResponse.json(
        {
          code: 'NOT_ELIGIBLE',
          error: 'NOT_ELIGIBLE',
          message: targetMission.blockedReason ?? 'Mission requirements are not met.',
        },
        { status: 409 },
      )
    }

    const claimQuery = await supabase
      .from('user_title_award')
      .insert({
        user_id: user.id,
        title_key: titleKey,
      })

    if (claimQuery.error?.code === '23505') {
      return NextResponse.json({ awarded: false, reason: 'ALREADY_CLAIMED', titleKey })
    }

    if (claimQuery.error?.code === '42P01' || claimQuery.error?.code === '42703') {
      return NextResponse.json(
        {
          code: 'MIGRATION_REQUIRED',
          error: 'MIGRATION_REQUIRED',
          message: 'Run B-9_title_missions_migration.sql before claiming titles.',
        },
        { status: 500 },
      )
    }

    if (claimQuery.error) {
      console.error('[POST /api/me/titles/claim] insert failed', claimQuery.error)
      return NextResponse.json(
        {
          code: 'INTERNAL_ERROR',
          error: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred.',
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ awarded: true, titleKey })
  } catch (error) {
    console.error('[POST /api/me/titles/claim] unexpected error', error)
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
