import type { DepartmentCategory, PressureLevel } from '@/lib/types'

const LEVEL_1_MIN = 1000
const LEVEL_2_MIN = 5000
const LEVEL_3_MIN = 10000
const LEVEL_4_MIN = 25000

const SYNONYM_MAP: Record<string, string> = {
  컴퓨터공학부: '컴퓨터공학과',
  컴공: '컴퓨터공학과',
  전자전기공학과: '전기전자공학과',
  경영학부: '경영학과',
  기계공학부: '기계공학과',
}

const TEMPLATE_BY_CATEGORY: Record<DepartmentCategory, string> = {
  공학: 'eng_default_01',
  자연과학: 'science_default_01',
  인문: 'humanities_default_01',
  사회과학: 'social_default_01',
  '경영/경제': 'biz_default_01',
  '예술/체육': 'arts_default_01',
  교육: 'edu_default_01',
  '보건/의학': 'health_default_01',
}

export function calculateStackCount(totalClicks: number): number {
  return Math.floor(Math.max(totalClicks, 0) / 1000)
}

export function calculateCurrentStudentCount(totalClicks: number): number {
  const safeClicks = Math.max(totalClicks, 0)
  const remainderClicks = safeClicks % 1000
  const isCycleComplete = safeClicks > 0 && remainderClicks === 0

  return isCycleComplete ? 10 : Math.floor(remainderClicks / 100)
}

export function calculatePressureLevel(totalClicks: number): PressureLevel {
  if (totalClicks < LEVEL_1_MIN) return 0
  if (totalClicks < LEVEL_2_MIN) return 1
  if (totalClicks < LEVEL_3_MIN) return 2
  if (totalClicks < LEVEL_4_MIN) return 3
  return 4
}

export function normalizeDepartmentName(rawName: string): string {
  const trimmed = rawName.trim().replace(/\s+/g, ' ')
  const noSpecial = trimmed.replace(/[-_.()/]/g, '')
  const noSpaces = noSpecial.replace(/\s/g, '')
  const lowered = noSpaces.toLowerCase()
  const synonym = SYNONYM_MAP[lowered] ?? SYNONYM_MAP[noSpaces]
  return synonym ?? noSpaces
}

export function getTemplateIdByCategory(category: DepartmentCategory): string {
  return TEMPLATE_BY_CATEGORY[category]
}
