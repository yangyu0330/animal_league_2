import { fetchJson } from '@/lib/api/client'
import type { RankingResponse, TrendingItem } from '@/lib/types'

interface TrendingResponse {
  items: TrendingItem[]
  generatedAt: string
}

export async function getRankings(params: {
  scope: 'national' | 'school'
  schoolId?: string
}): Promise<RankingResponse> {
  const search = new URLSearchParams()
  search.set('scope', params.scope)
  if (params.schoolId) search.set('schoolId', params.schoolId)
  return fetchJson<RankingResponse>(`/api/rankings?${search.toString()}`)
}

export async function getTrendingDepartments(): Promise<TrendingItem[]> {
  const response = await fetchJson<TrendingResponse>('/api/rankings/trending')
  return response.items
}
