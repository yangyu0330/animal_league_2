import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function buildValidationError(message: string) {
  return NextResponse.json(
    { code: 'VALIDATION_ERROR', error: 'VALIDATION_ERROR', message },
    { status: 400 },
  )
}

function resolveUserName(email: string, metadataName?: string, metadataFullName?: string) {
  return metadataName || metadataFullName || email.split('@')[0] || 'user'
}

interface SavedProfileRow {
  selected_school_id: string | null
  selected_department_id?: string | null
}

async function saveUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    userId: string
    nickname: string
    schoolId: string
    hasDepartmentField: boolean
    departmentId: string | null | undefined
  },
) {
  const updatePayload: {
    selected_school_id: string
    selected_department_id?: string | null
    updated_at: string
  } = {
    selected_school_id: input.schoolId,
    updated_at: new Date().toISOString(),
  }

  if (input.hasDepartmentField) {
    updatePayload.selected_department_id = input.departmentId ?? null
  }

  const updateResult = await supabase
    .from('app_user')
    .update(updatePayload)
    .eq('id', input.userId)
    .select('selected_school_id, selected_department_id')
    .maybeSingle()

  if (updateResult.error) {
    return updateResult
  }

  if (updateResult.data) {
    return updateResult
  }

  const insertResult = await supabase
    .from('app_user')
    .insert({
      id: input.userId,
      provider: 'google',
      nickname: input.nickname,
      ...updatePayload,
    })
    .select('selected_school_id, selected_department_id')
    .maybeSingle()

  if (insertResult.error?.code !== '23505') {
    return insertResult
  }

  return supabase
    .from('app_user')
    .update(updatePayload)
    .eq('id', input.userId)
    .select('selected_school_id, selected_department_id')
    .maybeSingle()
}

export async function PATCH(request: Request) {
  const supabase = await createClient()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return buildValidationError('Invalid JSON body.')
  }

  const payload = body as Partial<{ schoolId: unknown; departmentId: unknown }>
  const schoolId = typeof payload.schoolId === 'string' ? payload.schoolId.trim() : ''
  const hasDepartmentField = Object.prototype.hasOwnProperty.call(payload, 'departmentId')
  const departmentId =
    payload.departmentId === null
      ? null
      : typeof payload.departmentId === 'string'
        ? payload.departmentId.trim()
        : undefined

  if (!schoolId) {
    return buildValidationError('schoolId is required.')
  }

  if (hasDepartmentField && payload.departmentId !== null && typeof payload.departmentId !== 'string') {
    return buildValidationError('departmentId must be string or null.')
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ code: 'UNAUTHORIZED', error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const schoolQuery = await supabase.from('school').select('id, name').eq('id', schoolId).maybeSingle()
  if (schoolQuery.error) {
    console.error('[PATCH /api/me/profile] school lookup failed', schoolQuery.error)
    return NextResponse.json({ code: 'INTERNAL_ERROR', error: 'INTERNAL_ERROR' }, { status: 500 })
  }
  if (!schoolQuery.data) {
    return buildValidationError('School not found.')
  }

  let departmentName: string | null = null
  if (hasDepartmentField && departmentId) {
    const departmentQuery = await supabase
      .from('department')
      .select('id, name, school_id')
      .eq('id', departmentId)
      .maybeSingle()

    if (departmentQuery.error) {
      console.error('[PATCH /api/me/profile] department lookup failed', departmentQuery.error)
      return NextResponse.json({ code: 'INTERNAL_ERROR', error: 'INTERNAL_ERROR' }, { status: 500 })
    }
    if (!departmentQuery.data) {
      return buildValidationError('Department not found.')
    }
    if (departmentQuery.data.school_id !== schoolId) {
      return buildValidationError('Department does not belong to selected school.')
    }
    departmentName = departmentQuery.data.name
  }

  const fallbackName = resolveUserName(
    user.email ?? '',
    user.user_metadata?.name,
    user.user_metadata?.full_name,
  )

  const saveResult = await saveUserProfile(supabase, {
    userId: user.id,
    nickname: fallbackName,
    schoolId,
    hasDepartmentField,
    departmentId,
  })

  if (saveResult.error || !saveResult.data) {
    console.error('[PATCH /api/me/profile] app_user save failed', saveResult.error)
    return NextResponse.json({ code: 'INTERNAL_ERROR', error: 'INTERNAL_ERROR' }, { status: 500 })
  }

  const savedProfile = saveResult.data as SavedProfileRow
  const expectedDepartmentId = hasDepartmentField ? departmentId ?? null : savedProfile.selected_department_id ?? null

  if (
    savedProfile.selected_school_id !== schoolId ||
    (hasDepartmentField && (savedProfile.selected_department_id ?? null) !== expectedDepartmentId)
  ) {
    console.error('[PATCH /api/me/profile] saved profile mismatch', {
      expectedSchoolId: schoolId,
      expectedDepartmentId,
      savedProfile,
    })
    return NextResponse.json({ code: 'INTERNAL_ERROR', error: 'INTERNAL_ERROR' }, { status: 500 })
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? '',
      name: fallbackName,
      selectedSchoolId: savedProfile.selected_school_id,
      selectedSchoolName: schoolQuery.data.name,
      selectedDepartmentId: savedProfile.selected_department_id ?? null,
      selectedDepartmentName: hasDepartmentField ? departmentName : null,
    },
  })
}
