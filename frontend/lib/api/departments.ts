import { calculatePressureLevel, calculateStackCount, normalizeDepartmentName } from '@/lib/domain'
import { fetchJson } from '@/lib/api/client'
import type {
  ClickDepartmentRequest,
  ClickDepartmentResponse,
  CreateDepartmentRequest,
  CreateDepartmentResponse,
  Department,
  SearchDepartmentsParams,
  SearchDepartmentsResponse,
} from '@/lib/types'

interface DepartmentSearchItem {
  departmentId: string
  name: string
  schoolName: string
  category: Department['category']
  totalClicks: number
  stackCount?: number
  pressureLevel?: Department['pressureLevel']
}

interface DepartmentDetailResponse {
  departmentId: string
  departmentName: string
  schoolName: string
  category: Department['category']
  templateId: string
  totalClicks: number
  stackCount?: number
  pressureLevel?: Department['pressureLevel']
  todayClicks: number
  schoolId: string
  normalizedName?: string
}

export async function searchDepartments(params: SearchDepartmentsParams): Promise<SearchDepartmentsResponse> {
  const search = new URLSearchParams()
  search.set('q', params.q)
  if (params.schoolId) search.set('schoolId', params.schoolId)
  search.set('limit', String(params.limit ?? 20))

  const response = await fetchJson<{ items: DepartmentSearchItem[] }>(
    `/api/departments/search?${search.toString()}`,
  )

  return {
    items: response.items.map((item) => ({
      ...item,
      stackCount: item.stackCount ?? calculateStackCount(item.totalClicks),
      pressureLevel: item.pressureLevel ?? calculatePressureLevel(item.totalClicks),
    })),
  }
}

export async function getDepartmentById(id: string): Promise<Department | null> {
  const response = await fetchJson<DepartmentDetailResponse>(`/api/departments/${id}`)

  return {
    id: response.departmentId,
    schoolId: response.schoolId,
    schoolName: response.schoolName,
    name: response.departmentName,
    normalizedName: response.normalizedName ?? normalizeDepartmentName(response.departmentName),
    category: response.category,
    templateId: response.templateId,
    totalClicks: response.totalClicks,
    stackCount: response.stackCount ?? calculateStackCount(response.totalClicks),
    pressureLevel: response.pressureLevel ?? calculatePressureLevel(response.totalClicks),
    todayClicks: response.todayClicks,
  }
}

export async function createDepartment(payload: CreateDepartmentRequest): Promise<CreateDepartmentResponse> {
  return fetchJson<CreateDepartmentResponse>('/api/departments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function clickDepartment(
  departmentId: string,
  payload: ClickDepartmentRequest,
): Promise<ClickDepartmentResponse> {
  return fetchJson<ClickDepartmentResponse>(`/api/departments/${departmentId}/click`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
