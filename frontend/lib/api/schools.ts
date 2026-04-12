import { schools as catalogSchools, searchSchoolsByName } from '@/lib/catalog'
import { fetchJson, useMockApi } from '@/lib/api/client'
import type { School } from '@/lib/types'

interface SchoolSearchResponse {
  items: School[]
}

export async function searchSchools(query: string, limit = 30): Promise<School[]> {
  if (useMockApi()) {
    return searchSchoolsByName(query).slice(0, limit)
  }

  const params = new URLSearchParams()
  if (query.trim()) {
    params.set('q', query.trim())
  }
  params.set('limit', String(limit))

  const response = await fetchJson<SchoolSearchResponse>(`/api/schools?${params.toString()}`)
  return response.items
}

export function getSchoolByIdFromMock(schoolId: string): School | undefined {
  if (!useMockApi()) return undefined
  return catalogSchools.find((school) => school.id === schoolId)
}
