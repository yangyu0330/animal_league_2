import { fetchJson } from '@/lib/api/client'
import type { School } from '@/lib/types'

interface SchoolSearchResponse {
  items: School[]
}

export async function searchSchools(query: string, limit = 30): Promise<School[]> {
  const params = new URLSearchParams()
  if (query.trim()) {
    params.set('q', query.trim())
  }
  params.set('limit', String(limit))

  const response = await fetchJson<SchoolSearchResponse>(`/api/schools?${params.toString()}`)
  return response.items
}
