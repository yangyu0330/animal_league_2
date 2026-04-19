export type UserState = 'GUEST' | 'AUTH_NO_SCHOOL' | 'ACTIVE_USER'

export type PressureLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6

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

export interface ComboRankingItem {
  rank: number
  userId: string
  nickname: string
  schoolName: string
  departmentName: string
  maxCombo: number
  selectedTitleKey: string | null
  selectedTitleLabel: string | null
}

export interface ComboRankingResponse {
  items: ComboRankingItem[]
  generatedAt: string
}

export interface TitleRankingItem {
  rank: number
  userId: string
  nickname: string
  schoolName: string
  departmentName: string
  titleCount: number
  selectedTitleKey: string | null
  selectedTitleLabel: string | null
}

export interface TitleRankingResponse {
  scope: 'national' | 'school'
  items: TitleRankingItem[]
  generatedAt: string
}

export type MissionUnit = 'click' | 'combo' | 'rank' | 'level'

export interface MissionProgress {
  missionKey: string
  titleKey: string
  titleLabel: string
  category: 'personal' | 'team'
  description: string
  currentValue: number
  targetValue: number
  unit: MissionUnit
  progressRatio: number
  completed: boolean
  claimed: boolean
  claimable: boolean
  blockedReason?: string
}

export interface ActivitySelectedDepartmentSummary {
  id: string
  name: string
  schoolName: string
  totalClicks: number
  stackCount: number
  pressureLevel: PressureLevel
  todayClicks: number
}

export interface SchoolWarSummary {
  rank: number
  totalDepartments: number
  rivalDepartmentName: string | null
  rivalClicks: number | null
  clicksToNextRank: number
  clicksToFirst: number
}

export interface User {
  id: string
  email: string
  name: string
  selectedSchoolId: string | null
  selectedSchoolName: string | null
  selectedDepartmentId: string | null
  selectedDepartmentName: string | null
  selectedTitleKey: string | null
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
  maxCombo: number
  selectedTitleKey: string | null
  earnedTitleKeys: string[]
  myDepartmentContributionClicks: number
  schoolTotalClicks: number
  selectedDepartment: ActivitySelectedDepartmentSummary | null
  schoolWar: SchoolWarSummary | null
  personalMissions: MissionProgress[]
  teamMissions: MissionProgress[]
}
