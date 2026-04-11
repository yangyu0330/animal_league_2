export type UserState = 'GUEST' | 'AUTH_NO_SCHOOL' | 'ACTIVE_USER'

export type PressureLevel = 0 | 1 | 2 | 3 | 4

export type DepartmentCategory =
  | '공학'
  | '자연과학'
  | '인문'
  | '사회과학'
  | '경영/경제'
  | '예술/체육'
  | '교육'
  | '보건/의학'

export interface School {
  id: string
  name: string
}

export interface DepartmentTemplate {
  id: string
  category: DepartmentCategory
  label: string
  description: string
}

export interface Department {
  id: string
  schoolId: string
  schoolName: string
  name: string
  normalizedName: string
  category: DepartmentCategory
  templateId: string
  totalClicks: number
  todayClicks: number
  stackCount: number
  pressureLevel: PressureLevel
}

export interface RankingItem {
  rank: number
  departmentId: string
  departmentName: string
  schoolName: string
  totalClicks: number
  stackCount: number
  pressureLevel: PressureLevel
}

export interface RankingResponse {
  scope: 'national' | 'school'
  items: RankingItem[]
  generatedAt: string
}

export interface TrendingItem {
  departmentId: string
  departmentName: string
  schoolName: string
  todayClicks: number
}

export interface ClickActivity {
  id: string
  departmentId: string
  departmentName: string
  schoolName: string
  createdAt: string
  accepted: boolean
  refSource: 'direct' | 'share'
  reason?: string
}

export interface User {
  id: string
  email: string
  name: string
  selectedSchoolId: string | null
  selectedSchoolName: string | null
  selectedDepartmentId: string | null
  selectedDepartmentName: string | null
}

export interface SearchDepartmentsParams {
  q: string
  schoolId?: string
  limit?: number
}

export interface SearchDepartmentsResponse {
  items: Array<{
    departmentId: string
    name: string
    schoolName: string
    category: DepartmentCategory
    totalClicks: number
    stackCount: number
    pressureLevel: PressureLevel
  }>
}

export interface CreateDepartmentRequest {
  schoolId: string
  name: string
  category: DepartmentCategory
  templateId?: string
}

export type CreateDepartmentResponse =
  | { created: true; departmentId: string }
  | { created: false; reason: 'DUPLICATE'; existingDepartmentId: string }

export interface ClickDepartmentRequest {
  deviceHash: string
  refSource: 'direct' | 'share'
}

export interface ClickDepartmentResponse {
  accepted: boolean
  newTotalClicks: number
  stackCount: number
  pressureLevel: PressureLevel
  reason?: string
}

export interface MyActivityResponse {
  todayCount: number
  items: ClickActivity[]
}
