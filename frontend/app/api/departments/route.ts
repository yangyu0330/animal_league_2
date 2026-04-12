import { NextResponse } from 'next/server'
import { getTemplateIdByCategory, normalizeDepartmentName } from '@/lib/domain'
import { createClient } from '@/lib/supabase/server'
import type { DepartmentCategory } from '@/lib/types'

interface CreateDepartmentPayload {
  schoolId: string
  name: string
  category: string
  templateId?: string
}

function buildError(code: string, message: string, status: number) {
  return NextResponse.json({ code, error: code, message }, { status })
}

function parseBody(body: unknown): CreateDepartmentPayload | null {
  if (!body || typeof body !== 'object') return null
  const payload = body as Partial<CreateDepartmentPayload>
  if (typeof payload.schoolId !== 'string') return null
  if (typeof payload.name !== 'string') return null
  if (typeof payload.category !== 'string') return null
  if (payload.templateId !== undefined && typeof payload.templateId !== 'string') return null

  const schoolId = payload.schoolId.trim()
  const name = payload.name.trim()
  const category = payload.category.trim()

  if (!schoolId || !name || !category) return null

  return {
    schoolId,
    name,
    category,
    templateId: payload.templateId?.trim() || undefined,
  }
}

function resolveTemplateId(category: string, templateId?: string): string {
  if (templateId) return templateId

  try {
    const mapped = getTemplateIdByCategory(category as DepartmentCategory)
    return mapped || 'custom_default_01'
  } catch {
    return 'custom_default_01'
  }
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return buildError('VALIDATION_ERROR', 'Invalid JSON body.', 400)
  }

  const payload = parseBody(body)
  if (!payload) {
    return buildError(
      'VALIDATION_ERROR',
      'Invalid request. Check schoolId, name, and category.',
      400,
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return buildError('UNAUTHORIZED', 'Authentication is required.', 401)
  }

  const schoolQuery = await supabase
    .from('school')
    .select('id')
    .eq('id', payload.schoolId)
    .maybeSingle()

  if (schoolQuery.error) {
    console.error('[POST /api/departments] school lookup failed', schoolQuery.error)
    return buildError('INTERNAL_ERROR', 'An unexpected server error occurred.', 500)
  }
  if (!schoolQuery.data) {
    return buildError('VALIDATION_ERROR', 'School not found.', 400)
  }

  const normalizedName = normalizeDepartmentName(payload.name)
  const duplicateQuery = await supabase
    .from('department')
    .select('id')
    .eq('school_id', payload.schoolId)
    .eq('normalized_name', normalizedName)
    .maybeSingle()

  if (duplicateQuery.error) {
    console.error('[POST /api/departments] duplicate lookup failed', duplicateQuery.error)
    return buildError('INTERNAL_ERROR', 'An unexpected server error occurred.', 500)
  }

  if (duplicateQuery.data) {
    return NextResponse.json({
      created: false,
      reason: 'DUPLICATE',
      existingDepartmentId: duplicateQuery.data.id,
    })
  }

  const templateId = resolveTemplateId(payload.category, payload.templateId)
  const insertBase = {
    school_id: payload.schoolId,
    name: payload.name,
    normalized_name: normalizedName,
    category: payload.category,
    template_id: templateId,
    total_clicks: 0,
    pressure_level: 0,
    created_by: user.id,
  }

  let insertQuery = await supabase
    .from('department')
    .insert({
      ...insertBase,
      accepted_clicks: 0,
    })
    .select('id')
    .single()

  if (insertQuery.error?.code === '42703') {
    insertQuery = await supabase
      .from('department')
      .insert(insertBase)
      .select('id')
      .single()
  }

  if (insertQuery.error) {
    if (insertQuery.error.code === '23503') {
      return buildError('PRECONDITION_FAILED', 'app_user profile is required before creating a department.', 409)
    }
    console.error('[POST /api/departments] insert failed', insertQuery.error)
    return buildError('INTERNAL_ERROR', 'An unexpected server error occurred.', 500)
  }

  return NextResponse.json({
    created: true,
    departmentId: insertQuery.data.id,
  })
}
