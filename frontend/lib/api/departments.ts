import { calculatePressureLevel, calculateStackCount, getTemplateIdByCategory, normalizeDepartmentName } from '@/lib/domain'
import { getSchoolById } from '@/lib/catalog'
import { fetchJson, useMockApi } from '@/lib/api/client'
import { useAppStore } from '@/lib/store'
import type {
  ClickActivity,
  ClickDepartmentRequest,
  ClickDepartmentResponse,
  CreateDepartmentRequest,
  CreateDepartmentResponse,
  Department,
  SearchDepartmentsParams,
  SearchDepartmentsResponse,
} from '@/lib/types'

const TEN_SECONDS_MS = 10_000

function nowIsoString(): string {
  return new Date().toISOString()
}

function countRecentDepartmentClicks(departmentId: string): number {
  const now = Date.now()
  return useAppStore
    .getState()
    .activities.filter((activity) => activity.departmentId === departmentId)
    .filter((activity) => now - new Date(activity.createdAt).getTime() <= TEN_SECONDS_MS).length
}

function updateDepartmentComputedFields(department: Department): Department {
  const stackCount = calculateStackCount(department.totalClicks)
  const pressureLevel = calculatePressureLevel(department.totalClicks)
  return {
    ...department,
    stackCount,
    pressureLevel,
  }
}

export async function searchDepartments(params: SearchDepartmentsParams): Promise<SearchDepartmentsResponse> {
  if (!useMockApi()) {
    const search = new URLSearchParams()
    search.set('q', params.q)
    if (params.schoolId) search.set('schoolId', params.schoolId)
    search.set('limit', String(params.limit ?? 20))

    const response = await fetchJson<{ items: Array<{
      departmentId: string
      name: string
      schoolName: string
      category: Department['category']
      totalClicks: number
      stackCount?: number
      pressureLevel?: Department['pressureLevel']
    }> }>(`/api/departments/search?${search.toString()}`)

    return {
      items: response.items.map((item) => ({
        ...item,
        stackCount: item.stackCount ?? calculateStackCount(item.totalClicks),
        pressureLevel: item.pressureLevel ?? calculatePressureLevel(item.totalClicks),
      })),
    }
  }

  const keyword = params.q.trim().toLowerCase()
  const items = useAppStore
    .getState()
    .departments.filter((department) => (params.schoolId ? department.schoolId === params.schoolId : true))
    .filter((department) => {
      if (!keyword) return true
      return department.name.toLowerCase().includes(keyword) || department.schoolName.toLowerCase().includes(keyword)
    })
    .sort((a, b) => b.totalClicks - a.totalClicks)
    .slice(0, params.limit ?? 20)
    .map((department) => ({
      departmentId: department.id,
      name: department.name,
      schoolName: department.schoolName,
      category: department.category,
      totalClicks: department.totalClicks,
      stackCount: department.stackCount,
      pressureLevel: department.pressureLevel,
    }))

  return { items }
}

export async function getDepartmentById(id: string): Promise<Department | null> {
  if (!useMockApi()) {
    const response = await fetchJson<{
      departmentId: string
      departmentName: string
      schoolName: string
      category: Department['category']
      templateId: string
      totalClicks: number
      stackCount: number
      pressureLevel: Department['pressureLevel']
      todayClicks: number
      schoolId?: string
      normalizedName?: string
    }>(`/api/departments/${id}`)

    const existing = useAppStore.getState().departments.find((item) => item.id === id)
    return {
      id: response.departmentId,
      schoolId: response.schoolId ?? existing?.schoolId ?? '',
      schoolName: response.schoolName,
      name: response.departmentName,
      normalizedName: response.normalizedName ?? existing?.normalizedName ?? normalizeDepartmentName(response.departmentName),
      category: response.category,
      templateId: response.templateId,
      totalClicks: response.totalClicks,
      stackCount: response.stackCount ?? calculateStackCount(response.totalClicks),
      pressureLevel: response.pressureLevel ?? calculatePressureLevel(response.totalClicks),
      todayClicks: response.todayClicks,
    }
  }

  const department = useAppStore.getState().departments.find((item) => item.id === id)
  if (!department) return null
  return updateDepartmentComputedFields(department)
}

export async function createDepartment(payload: CreateDepartmentRequest): Promise<CreateDepartmentResponse> {
  if (!useMockApi()) {
    return fetchJson<CreateDepartmentResponse>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  const state = useAppStore.getState()
  const normalizedName = normalizeDepartmentName(payload.name)
  const duplicate = state.departments.find(
    (department) => department.schoolId === payload.schoolId && department.normalizedName === normalizedName,
  )

  if (duplicate) {
    return {
      created: false,
      reason: 'DUPLICATE',
      existingDepartmentId: duplicate.id,
    }
  }

  const schoolName = getSchoolById(payload.schoolId)?.name ?? state.user?.selectedSchoolName ?? ''
  const newDepartment: Department = {
    id: `dep_${Date.now()}`,
    schoolId: payload.schoolId,
    schoolName,
    name: payload.name.trim(),
    normalizedName,
    category: payload.category,
    templateId: payload.templateId ?? getTemplateIdByCategory(payload.category),
    totalClicks: 0,
    todayClicks: 0,
    stackCount: 0,
    pressureLevel: 0,
  }

  state.addDepartment(newDepartment)
  return {
    created: true,
    departmentId: newDepartment.id,
  }
}

export async function clickDepartment(
  departmentId: string,
  payload: ClickDepartmentRequest,
): Promise<ClickDepartmentResponse> {
  if (!useMockApi()) {
    return fetchJson<ClickDepartmentResponse>(`/api/departments/${departmentId}/click`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  const state = useAppStore.getState()
  const target = state.departments.find((department) => department.id === departmentId)
  if (!target) {
    throw new Error('NOT_FOUND')
  }

  const recentCount = countRecentDepartmentClicks(departmentId)
  const accepted = recentCount < 60
  const reason = accepted ? (recentCount > 25 ? 'WARN_BURST' : undefined) : 'BURST_OVER_60'

  if (accepted) {
    state.updateDepartment(departmentId, (department) =>
      updateDepartmentComputedFields({
        ...department,
        totalClicks: department.totalClicks + 1,
        todayClicks: department.todayClicks + 1,
      }),
    )
  }

  const updated = useAppStore.getState().departments.find((department) => department.id === departmentId) ?? target
  const activity: ClickActivity = {
    id: `activity_${Date.now()}`,
    departmentId,
    departmentName: updated.name,
    schoolName: updated.schoolName,
    createdAt: nowIsoString(),
    accepted,
    refSource: payload.refSource,
    reason,
  }
  state.addActivity(activity)

  return {
    accepted,
    newTotalClicks: updated.totalClicks,
    stackCount: updated.stackCount,
    pressureLevel: updated.pressureLevel,
    reason,
  }
}
