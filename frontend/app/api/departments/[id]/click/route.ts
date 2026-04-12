import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ClickPayload {
  deviceHash: string
  refSource: 'direct' | 'share'
}

interface RecordClickRow {
  accepted: boolean
  new_total_clicks: number
  stack_count: number
  pressure_level: number
}

function buildError(code: string, message: string, status: number) {
  return NextResponse.json({ code, error: code, message }, { status })
}

function parsePayload(body: unknown): ClickPayload | null {
  if (!body || typeof body !== 'object') return null
  const payload = body as Partial<ClickPayload>
  if (typeof payload.deviceHash !== 'string') return null
  if (payload.refSource !== 'direct' && payload.refSource !== 'share') return null

  const deviceHash = payload.deviceHash.trim()
  if (!deviceHash) return null

  return {
    deviceHash,
    refSource: payload.refSource,
  }
}

function getIpHash(headers: Headers): string {
  const raw =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip')?.trim() ||
    'unknown'
  return createHash('sha256').update(raw).digest('hex')
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return buildError('VALIDATION_ERROR', 'Invalid JSON body.', 400)
  }

  const payload = parsePayload(body)
  if (!payload) {
    return buildError('VALIDATION_ERROR', 'Invalid request. Check deviceHash and refSource.', 400)
  }

  const { id } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return buildError('UNAUTHORIZED', 'Authentication is required.', 401)
  }

  const profileQuery = await supabase
    .from('app_user')
    .select('selected_department_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileQuery.error) {
    console.error('[POST /api/departments/:id/click] app_user lookup failed', profileQuery.error)
    return buildError('INTERNAL_ERROR', 'An unexpected server error occurred.', 500)
  }

  if (!profileQuery.data?.selected_department_id || profileQuery.data.selected_department_id !== id) {
    return buildError('FORBIDDEN', 'You can only boost your selected department.', 403)
  }

  const clickResult = await supabase
    .rpc('record_department_click', {
      p_user_id: user.id,
      p_department_id: id,
      p_device_hash: payload.deviceHash,
      p_ip_hash: getIpHash(req.headers),
      p_ref_source: payload.refSource,
    })
    .single()

  if (clickResult.error) {
    if (clickResult.error.message.includes('DEPARTMENT_NOT_FOUND')) {
      return buildError('NOT_FOUND', 'Department not found.', 404)
    }
    console.error('[POST /api/departments/:id/click] record click failed', clickResult.error)
    return buildError('INTERNAL_ERROR', 'An unexpected server error occurred.', 500)
  }

  const result = clickResult.data as RecordClickRow

  return NextResponse.json({
    accepted: result.accepted,
    newTotalClicks: Number(result.new_total_clicks ?? 0),
    stackCount: Number(result.stack_count ?? 0),
    pressureLevel: Number(result.pressure_level ?? 0),
  })
}
