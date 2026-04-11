import { useAppStore } from '@/lib/store'
import { fetchJson, useMockApi } from '@/lib/api/client'
import type { Department, RankingResponse, TrendingItem } from '@/lib/types'

function rankDepartments(departments: Department[]) {
  return [...departments].sort((a, b) => b.totalClicks - a.totalClicks)
}

export async function getRankings(params: {
  scope: 'national' | 'school'
  schoolId?: string
}): Promise<RankingResponse> {
  if (!useMockApi()) {
    const search = new URLSearchParams()
    search.set('scope', params.scope)
    if (params.schoolId) search.set('schoolId', params.schoolId)
    return fetchJson<RankingResponse>(`/api/rankings?${search.toString()}`)
  }

  const departments = useAppStore.getState().departments
  const filtered =
    params.scope === 'school' && params.schoolId
      ? departments.filter((department) => department.schoolId === params.schoolId)
      : departments

  const ranked = rankDepartments(filtered).slice(0, 10)

  return {
    scope: params.scope,
    items: ranked.map((department, index) => ({
      rank: index + 1,
      departmentId: department.id,
      departmentName: department.name,
      schoolName: department.schoolName,
      totalClicks: department.totalClicks,
      stackCount: department.stackCount,
      pressureLevel: department.pressureLevel,
    })),
    generatedAt: new Date().toISOString(),
  }
}

export async function getTrendingDepartments(): Promise<TrendingItem[]> {
  if (!useMockApi()) {
    const response = await getRankings({ scope: 'national' })
    return response.items.slice(0, 5).map((item) => ({
      departmentId: item.departmentId,
      departmentName: item.departmentName,
      schoolName: item.schoolName,
      todayClicks: 0,
    }))
  }

  return [...useAppStore.getState().departments]
    .sort((a, b) => b.todayClicks - a.todayClicks)
    .slice(0, 5)
    .map((department) => ({
      departmentId: department.id,
      departmentName: department.name,
      schoolName: department.schoolName,
      todayClicks: department.todayClicks,
    }))
}
