import { categories, getSchoolById, seedDepartments } from '@/lib/catalog'
import {
  calculatePressureLevel,
  calculateStackCount,
  getTemplateIdByCategory,
  normalizeDepartmentName,
} from '@/lib/domain'
import type {
  ClickActivity,
  ClickDepartmentRequest,
  ClickDepartmentResponse,
  CreateDepartmentRequest,
  CreateDepartmentResponse,
  Department,
  DepartmentCategory,
  MyActivityResponse,
  SearchDepartmentsResponse,
} from '@/lib/types'

const TEN_SECONDS_MS = 10_000

interface DepartmentApiState {
  departments: Department[]
  activities: ClickActivity[]
}

declare global {
  var __animalLeagueDepartmentApiState: DepartmentApiState | undefined
}

function cloneSeedDepartments(): Department[] {
  return seedDepartments.map((department) => ({ ...department }))
}

function getState(): DepartmentApiState {
  if (!globalThis.__animalLeagueDepartmentApiState) {
    globalThis.__animalLeagueDepartmentApiState = {
      departments: cloneSeedDepartments(),
      activities: [],
    }
  }

  return globalThis.__animalLeagueDepartmentApiState
}

function isDepartmentCategory(value: unknown): value is DepartmentCategory {
  return typeof value === 'string' && categories.includes(value as DepartmentCategory)
}

function updateComputedFields(department: Department): Department {
  return {
    ...department,
    stackCount: calculateStackCount(department.totalClicks),
    pressureLevel: calculatePressureLevel(department.totalClicks),
  }
}

function createDepartmentId(): string {
  return `dep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function createActivityId(): string {
  return `activity_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function isCreateDepartmentRequest(body: unknown): body is CreateDepartmentRequest {
  if (!body || typeof body !== 'object') return false

  const candidate = body as Partial<CreateDepartmentRequest>
  return (
    typeof candidate.schoolId === 'string' &&
    typeof candidate.name === 'string' &&
    isDepartmentCategory(candidate.category) &&
    (candidate.templateId === undefined || typeof candidate.templateId === 'string')
  )
}

function isClickDepartmentRequest(body: unknown): body is ClickDepartmentRequest {
  if (!body || typeof body !== 'object') return false

  const candidate = body as Partial<ClickDepartmentRequest>
  return (
    typeof candidate.deviceHash === 'string' &&
    (candidate.refSource === 'direct' || candidate.refSource === 'share')
  )
}

export function validateCreateDepartmentPayload(body: unknown): CreateDepartmentRequest | null {
  if (!isCreateDepartmentRequest(body)) return null

  const name = body.name.trim()
  if (!name) return null

  return {
    schoolId: body.schoolId,
    name,
    category: body.category,
    templateId: body.templateId?.trim() || undefined,
  }
}

export function createDepartmentRecord(payload: CreateDepartmentRequest): CreateDepartmentResponse {
  const state = getState()
  const normalizedName = normalizeDepartmentName(payload.name)
  const duplicate = state.departments.find(
    (department) =>
      department.schoolId === payload.schoolId && department.normalizedName === normalizedName,
  )

  if (duplicate) {
    return {
      created: false,
      reason: 'DUPLICATE',
      existingDepartmentId: duplicate.id,
    }
  }

  const department: Department = updateComputedFields({
    id: createDepartmentId(),
    schoolId: payload.schoolId,
    schoolName: getSchoolById(payload.schoolId)?.name ?? '',
    name: payload.name,
    normalizedName,
    category: payload.category,
    templateId: payload.templateId ?? getTemplateIdByCategory(payload.category),
    totalClicks: 0,
    todayClicks: 0,
    stackCount: 0,
    pressureLevel: 0,
  })

  state.departments.push(department)

  return {
    created: true,
    departmentId: department.id,
  }
}

export function searchDepartmentRecords(
  q: string,
  schoolId?: string,
  limit = 20,
): SearchDepartmentsResponse {
  const state = getState()
  const keyword = q.trim().toLowerCase()

  const items = state.departments
    .filter((department) => (schoolId ? department.schoolId === schoolId : true))
    .filter((department) => {
      if (!keyword) return true
      return (
        department.name.toLowerCase().includes(keyword) ||
        department.schoolName.toLowerCase().includes(keyword)
      )
    })
    .sort((a, b) => b.totalClicks - a.totalClicks)
    .slice(0, limit)
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

export function getDepartmentRecordById(id: string) {
  const department = getState().departments.find((item) => item.id === id)
  if (!department) return null

  return {
    departmentId: department.id,
    departmentName: department.name,
    schoolName: department.schoolName,
    category: department.category,
    templateId: department.templateId,
    totalClicks: department.totalClicks,
    stackCount: department.stackCount,
    pressureLevel: department.pressureLevel,
    todayClicks: department.todayClicks,
    schoolId: department.schoolId,
    normalizedName: department.normalizedName,
  }
}

export function validateClickDepartmentPayload(body: unknown): ClickDepartmentRequest | null {
  if (!isClickDepartmentRequest(body)) return null

  return body
}

export function clickDepartmentRecord(
  departmentId: string,
  payload: ClickDepartmentRequest,
): ClickDepartmentResponse | null {
  const state = getState()
  const departmentIndex = state.departments.findIndex((department) => department.id === departmentId)
  if (departmentIndex === -1) return null

  const now = Date.now()
  const recentCount = state.activities.filter(
    (activity) =>
      activity.departmentId === departmentId &&
      now - new Date(activity.createdAt).getTime() <= TEN_SECONDS_MS,
  ).length

  const accepted = recentCount < 60
  const reason = accepted ? (recentCount > 25 ? 'WARN_BURST' : undefined) : 'BURST_OVER_60'

  let department = state.departments[departmentIndex]

  if (accepted) {
    department = updateComputedFields({
      ...department,
      totalClicks: department.totalClicks + 1,
      todayClicks: department.todayClicks + 1,
    })

    state.departments[departmentIndex] = department
  }

  const activity: ClickActivity = {
    id: createActivityId(),
    departmentId,
    departmentName: department.name,
    schoolName: department.schoolName,
    createdAt: new Date(now).toISOString(),
    accepted,
    refSource: payload.refSource,
    reason,
  }

  state.activities.unshift(activity)
  state.activities = state.activities.slice(0, 100)

  return {
    accepted,
    newTotalClicks: department.totalClicks,
    stackCount: department.stackCount,
    pressureLevel: department.pressureLevel,
    reason,
  }
}

export function getMyActivityRecords(limit = 20): MyActivityResponse {
  const state = getState()
  const now = new Date()

  const todayCount = state.activities.filter((activity) => {
    if (!activity.accepted) return false

    const createdAt = new Date(activity.createdAt)
    return (
      createdAt.getFullYear() === now.getFullYear() &&
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getDate() === now.getDate()
    )
  }).length

  return {
    todayCount,
    items: state.activities.slice(0, limit),
  }
}
