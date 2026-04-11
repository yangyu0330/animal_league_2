import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { schoolId } = body

  if (!schoolId) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'schoolId is required' },
      { status: 400 }
    )
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { error: updateError } = await supabase
    .from('app_user')
    .update({
      selected_school_id: schoolId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}