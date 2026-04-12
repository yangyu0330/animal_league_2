import { fetchJson } from '@/lib/api/client'
import type { MyActivityResponse } from '@/lib/types'

export async function getMyActivity(limit = 20): Promise<MyActivityResponse> {
  return fetchJson<MyActivityResponse>(`/api/me/activity?limit=${limit}`)
}
