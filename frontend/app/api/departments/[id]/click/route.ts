import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { calculatePressureLevel, calculateStackCount } from '@/lib/domain'
import { createClient } from '@/lib/supabase/server'

interface ClickPayload {
  deviceHash: string
  refSource: 'direct' | 'share'
}

interface DepartmentClickRow {
  id: string
  total_clicks: number
  pressure_level: number | null
}

type ClickReason =
  | 'OK'
  | 'WARN_BURST'
  | 'BURST_OVER_60'
  | 'REPEATED_PATTERN'
  | 'CLUSTER_PATTERN'
  | 'SAFE_FALLBACK'

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

function evaluateClickPolicy(recentCount: number): { accepted: boolean; reason: ClickReason } {
  try {
    if (recentCount >= 60) {
      return { accepted: false, reason: 'BURST_OVER_60' }
    }
    if (recentCount > 25) {
      return { accepted: true, reason: 'WARN_BURST' }
    }
    return { accepted: true, reason: 'OK' }
  } catch {
    return { accepted: true, reason: 'SAFE_FALLBACK' }
  }
}

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function windowStartIso(msWindow: number): string {
  return new Date(Date.now() - msWindow).toISOString()
}

async function incrementDailyStat(supabase: Awaited<ReturnType<typeof createClient>>, departmentId: string) {
  const dateKey = todayDateKey()
  const existing = await supabase
    .from('department_daily_stat')
    .select('accepted_clicks')
    .eq('date', dateKey)
    .eq('department_id', departmentId)
    .maybeSingle()

  if (existing.error) {
    console.error('[POST /api/departments/:id/click] daily stat lookup failed', existing.error)
    return
  }

  if (!existing.data) {
    const insertResult = await supabase.from('department_daily_stat').insert({
      date: dateKey,
      department_id: departmentId,
      accepted_clicks: 1,
    })

    if (!insertResult.error) return
    if (insertResult.error.code !== '23505') {
      console.error('[POST /api/departments/:id/click] daily stat insert failed', insertResult.error)
      return
    }
  }

  const nextCount = Number(existing.data?.accepted_clicks ?? 0) + 1
  const updateResult = await supabase
    .from('department_daily_stat')
    .update({ accepted_clicks: nextCount })
    .eq('date', dateKey)
    .eq('department_id', departmentId)

  if (updateResult.error) {
    console.error('[POST /api/departments/:id/click] daily stat update failed', updateResult.error)
  }
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

  const departmentQuery = await supabase
    .from('department')
    .select('id, total_clicks, pressure_level')
    .eq('id', id)
    .maybeSingle()

  if (departmentQuery.error) {
    console.error('[POST /api/departments/:id/click] department lookup failed', departmentQuery.error)
    return buildError('INTERNAL_ERROR', 'An unexpected server error occurred.', 500)
  }

  if (!departmentQuery.data) {
    return buildError('NOT_FOUND', 'Department not found.', 404)
  }

  const department = departmentQuery.data as DepartmentClickRow
  const recentCountQuery = await supabase
    .from('click_event')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('department_id', id)
    .gte('created_at', windowStartIso(10_000))

  if (recentCountQuery.error) {
    console.error('[POST /api/departments/:id/click] recent count query failed', recentCountQuery.error)
    return buildError('INTERNAL_ERROR', 'An unexpected server error occurred.', 500)
  }

  const decision = evaluateClickPolicy(Number(recentCountQuery.count ?? 0))
  const accepted = decision.accepted
  const reason = decision.reason

  const clickInsert = await supabase.from('click_event').insert({
    user_id: user.id,
    department_id: id,
    device_hash: payload.deviceHash,
    ip_hash: getIpHash(req.headers),
    accepted,
    reason,
    ref_source: payload.refSource,
  })

  if (clickInsert.error) {
    console.error('[POST /api/departments/:id/click] click insert failed', clickInsert.error)
    return buildError('INTERNAL_ERROR', 'An unexpected server error occurred.', 500)
  }

  const currentTotal = Number(department.total_clicks ?? 0)
  let newTotalClicks = currentTotal
  let pressureLevel = Number(department.pressure_level ?? calculatePressureLevel(currentTotal))

  if (accepted) {
    newTotalClicks = currentTotal + 1
    pressureLevel = calculatePressureLevel(newTotalClicks)

    let updateResult = await supabase
      .from('department')
      .update({
        total_clicks: newTotalClicks,
        pressure_level: pressureLevel,
      })
      .eq('id', id)

    if (updateResult.error?.code === '42703') {
      updateResult = await supabase
        .from('department')
        .update({
          total_clicks: newTotalClicks,
          pressure_level: pressureLevel,
        })
        .eq('id', id)
    }

    if (updateResult.error) {
      console.error('[POST /api/departments/:id/click] department update failed', updateResult.error)
      return buildError('INTERNAL_ERROR', 'An unexpected server error occurred.', 500)
    }

    await incrementDailyStat(supabase, id)
  }

  return NextResponse.json({
    accepted,
    newTotalClicks,
    stackCount: calculateStackCount(newTotalClicks),
    pressureLevel,
    reason: reason === 'OK' ? undefined : reason,
  })
}
