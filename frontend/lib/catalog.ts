import { calculatePressureLevel, calculateStackCount, getTemplateIdByCategory, normalizeDepartmentName } from '@/lib/domain'
import type { Department, DepartmentCategory, DepartmentTemplate, School } from '@/lib/types'

export const schools: School[] = [
  { id: 'school_001', name: '서울대학교' },
  { id: 'school_002', name: '연세대학교' },
  { id: 'school_003', name: '고려대학교' },
  { id: 'school_004', name: '서강대학교' },
  { id: 'school_005', name: '성균관대학교' },
  { id: 'school_006', name: '한양대학교' },
  { id: 'school_007', name: '중앙대학교' },
  { id: 'school_008', name: '경희대학교' },
  { id: 'school_009', name: '한국외국어대학교' },
  { id: 'school_010', name: '서울시립대학교' },
  { id: 'school_011', name: '이화여자대학교' },
  { id: 'school_012', name: '건국대학교' },
  { id: 'school_013', name: '동국대학교' },
  { id: 'school_014', name: '홍익대학교' },
  { id: 'school_015', name: '부산대학교' },
  { id: 'school_016', name: '경북대학교' },
  { id: 'school_017', name: '전남대학교' },
  { id: 'school_018', name: '충남대학교' },
  { id: 'school_019', name: '전북대학교' },
  { id: 'school_020', name: '인하대학교' },
]

export const categories: DepartmentCategory[] = [
  '공학',
  '자연과학',
  '인문',
  '사회과학',
  '경영/경제',
  '예술/체육',
  '교육',
  '보건/의학',
]

export const departmentTemplates: DepartmentTemplate[] = [
  { id: 'eng_default_01', category: '공학', label: '공학 템플릿', description: '기계 패널, 게이지, 강한 대비' },
  { id: 'science_default_01', category: '자연과학', label: '자연과학 템플릿', description: '실험 노트, 스코프 HUD, 데이터 점멸' },
  { id: 'humanities_default_01', category: '인문', label: '인문 템플릿', description: '책장 패턴, 필기 질감, 안정된 톤' },
  { id: 'social_default_01', category: '사회과학', label: '사회과학 템플릿', description: '분석 보드, 네트워크 노드, 정보 카드' },
  { id: 'biz_default_01', category: '경영/경제', label: '경영/경제 템플릿', description: '틱커 보드, 수치 위젯, 상승/하락 신호' },
  { id: 'arts_default_01', category: '예술/체육', label: '예술/체육 템플릿', description: '컬러 스플래시, 리듬 라인, 퍼포먼스 배지' },
  { id: 'edu_default_01', category: '교육', label: '교육 템플릿', description: '칠판 레이어, 스탬프, 학습 미터' },
  { id: 'health_default_01', category: '보건/의학', label: '보건/의학 템플릿', description: '모니터 파형, 생체 신호, 응급 알림' },
]

const seedRows: Array<{
  schoolName: string
  departmentName: string
  category: DepartmentCategory
  totalClicks: number
  todayClicks: number
}> = [
  { schoolName: '서울대학교', departmentName: '컴퓨터공학과', category: '공학', totalClicks: 12340, todayClicks: 901 },
  { schoolName: '연세대학교', departmentName: '경영학과', category: '경영/경제', totalClicks: 11902, todayClicks: 844 },
  { schoolName: '고려대학교', departmentName: '전기전자공학과', category: '공학', totalClicks: 9880, todayClicks: 702 },
  { schoolName: '부산대학교', departmentName: '기계공학과', category: '공학', totalClicks: 6420, todayClicks: 496 },
  { schoolName: '이화여자대학교', departmentName: '심리학과', category: '사회과학', totalClicks: 4980, todayClicks: 384 },
  { schoolName: '성균관대학교', departmentName: '반도체시스템공학과', category: '공학', totalClicks: 4310, todayClicks: 305 },
  { schoolName: '한양대학교', departmentName: '산업공학과', category: '공학', totalClicks: 3890, todayClicks: 267 },
  { schoolName: '경희대학교', departmentName: '국제학과', category: '사회과학', totalClicks: 3420, todayClicks: 229 },
  { schoolName: '전남대학교', departmentName: '간호학과', category: '보건/의학', totalClicks: 2890, todayClicks: 201 },
  { schoolName: '홍익대학교', departmentName: '시각디자인과', category: '예술/체육', totalClicks: 2455, todayClicks: 176 },
  { schoolName: '중앙대학교', departmentName: '국어국문학과', category: '인문', totalClicks: 1880, todayClicks: 138 },
  { schoolName: '인하대학교', departmentName: '항공우주공학과', category: '공학', totalClicks: 1670, todayClicks: 121 },
]

export const seedDepartments: Department[] = seedRows.map((row, index) => {
  const school = schools.find((item) => item.name === row.schoolName)
  const schoolId = school?.id ?? 'unknown'
  const stackCount = calculateStackCount(row.totalClicks)
  const pressureLevel = calculatePressureLevel(row.totalClicks)

  return {
    id: `dep_${String(index + 1).padStart(3, '0')}`,
    schoolId,
    schoolName: row.schoolName,
    name: row.departmentName,
    normalizedName: normalizeDepartmentName(row.departmentName),
    category: row.category,
    templateId: getTemplateIdByCategory(row.category),
    totalClicks: row.totalClicks,
    todayClicks: row.todayClicks,
    stackCount,
    pressureLevel,
  }
})

export function getSchoolById(id: string): School | undefined {
  return schools.find((school) => school.id === id)
}

export function searchSchoolsByName(query: string): School[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return schools
  return schools.filter((school) => school.name.toLowerCase().includes(normalized))
}

export function getTemplateByCategory(category: DepartmentCategory): DepartmentTemplate {
  return departmentTemplates.find((template) => template.category === category) ?? departmentTemplates[0]
}
