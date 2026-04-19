import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SelectTitlePayload {
  titleKey?: unknown
}

function buildValidationError(message: string) {
  return NextResponse.json(
    { code: 'VALIDATION_ERROR', error: 'VALIDATION_ERROR', message },
    { status: 400 },
  )
}

function resolveUserName(email: string, metadataName?: string, metadataFullName?: string) {
  return metadataName || metadataFullName || email.split('@')[0] || 'user'
}

export async function PATCH(request: Request) {
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

    let body: SelectTitlePayload
    try {
      body = (await request.json()) as SelectTitlePayload
    } catch {
      return buildValidationError('Invalid JSON body.')
    }

    const titleKey =
      body.titleKey === null
        ? null
        : typeof body.titleKey === 'string'
          ? body.titleKey.trim()
          : undefined

    if (typeof titleKey === 'undefined') {
      return buildValidationError('titleKey must be string or null.')
    }

    if (titleKey) {
      const earnedTitleQuery = await supabase
        .from('user_title_award')
        .select('title_key')
        .eq('user_id', user.id)
        .eq('title_key', titleKey)
        .maybeSingle()

      if (earnedTitleQuery.error?.code === '42P01' || earnedTitleQuery.error?.code === '42703') {
        return NextResponse.json(
          {
            code: 'MIGRATION_REQUIRED',
            error: 'MIGRATION_REQUIRED',
            message: 'Run B-9_title_missions_migration.sql before selecting titles.',
          },
          { status: 500 },
        )
      }

      if (earnedTitleQuery.error) {
        console.error('[PATCH /api/me/title] lookup failed', earnedTitleQuery.error)
        return NextResponse.json(
          {
            code: 'INTERNAL_ERROR',
            error: 'INTERNAL_ERROR',
            message: 'An unexpected server error occurred.',
          },
          { status: 500 },
        )
      }

      if (!earnedTitleQuery.data) {
        return NextResponse.json(
          {
            code: 'TITLE_NOT_OWNED',
            error: 'TITLE_NOT_OWNED',
            message: 'Claim this title before selecting it.',
          },
          { status: 409 },
        )
      }
    }

    let updateQuery = await supabase
      .from('app_user')
      .update({
        selected_title_key: titleKey,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('selected_title_key')
      .maybeSingle()

    if (updateQuery.error?.code === '42703') {
      return NextResponse.json(
        {
          code: 'MIGRATION_REQUIRED',
          error: 'MIGRATION_REQUIRED',
          message: 'Run B-9_title_missions_migration.sql before selecting titles.',
        },
        { status: 500 },
      )
    }

    if (!updateQuery.error && updateQuery.data) {
      return NextResponse.json({ selectedTitleKey: updateQuery.data.selected_title_key ?? null })
    }

    const fallbackName = resolveUserName(
      user.email ?? '',
      user.user_metadata?.name,
      user.user_metadata?.full_name,
    )

    const insertQuery = await supabase
      .from('app_user')
      .insert({
        id: user.id,
        provider: 'google',
        nickname: fallbackName,
        selected_title_key: titleKey,
      })
      .select('selected_title_key')
      .maybeSingle()

    if (insertQuery.error?.code !== '23505') {
      if (insertQuery.error) {
        console.error('[PATCH /api/me/title] insert failed', insertQuery.error)
      }
      return NextResponse.json(
        {
          code: 'INTERNAL_ERROR',
          error: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred.',
        },
        { status: 500 },
      )
    }

    updateQuery = await supabase
      .from('app_user')
      .update({
        selected_title_key: titleKey,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('selected_title_key')
      .maybeSingle()

    if (updateQuery.error || !updateQuery.data) {
      if (updateQuery.error) {
        console.error('[PATCH /api/me/title] retry update failed', updateQuery.error)
      }
      return NextResponse.json(
        {
          code: 'INTERNAL_ERROR',
          error: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred.',
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ selectedTitleKey: updateQuery.data.selected_title_key ?? null })
  } catch (error) {
    console.error('[PATCH /api/me/title] unexpected error', error)
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
