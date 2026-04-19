import type { MissionProgress, MissionUnit } from '@/lib/types'

type MissionSource =
  | 'department_clicks'
  | 'max_combo'
  | 'school_rank'
  | 'pressure_level'
  | 'school_total_clicks'

interface MissionDefinition {
  missionKey: string
  titleKey: string
  titleLabel: string
  category: 'personal' | 'team'
  description: string
  source: MissionSource
  targetValue: number
  unit: MissionUnit
  requiresContribution?: boolean
}

export interface TitleMissionContext {
  departmentContributionClicks: number
  maxCombo: number
  schoolRank: number | null
  pressureLevel: number | null
  schoolTotalClicks: number | null
  hasDepartmentContribution: boolean
}

const PERSONAL_CLICK_THRESHOLDS = [100, 300, 500, 1000, 2000, 5000, 10000, 15000, 20000]
const PERSONAL_CLICK_LABELS = [
  '압박 입문자',
  '압박 훈련병',
  '압박 해결사',
  '압박 선봉장',
  '압박 지휘관',
  '압박 전술가',
  '압박 돌격대장',
  '압박 전설',
  '압박 신화',
]

const PERSONAL_COMBO_THRESHOLDS = [50, 100, 150, 300, 500, 1000, 1500, 3000, 5000]
const PERSONAL_COMBO_LABELS = [
  '콤보 입문자',
  '콤보 훈련병',
  '콤보 해결사',
  '콤보 선봉장',
  '콤보 지휘관',
  '콤보 전술가',
  '콤보 돌격대장',
  '콤보 전설',
  '콤보 신화',
]

const TEAM_MISSIONS: MissionDefinition[] = [
  {
    missionKey: 'team_rank_top_10',
    titleKey: 'team_rank_top_10',
    titleLabel: '전선 개척자 I',
    category: 'team',
    description: '선택 학과를 학교 내 TOP 10에 올리기',
    source: 'school_rank',
    targetValue: 10,
    unit: 'rank',
    requiresContribution: true,
  },
  {
    missionKey: 'team_rank_top_3',
    titleKey: 'team_rank_top_3',
    titleLabel: '전선 개척자 II',
    category: 'team',
    description: '선택 학과를 학교 내 TOP 3에 올리기',
    source: 'school_rank',
    targetValue: 3,
    unit: 'rank',
    requiresContribution: true,
  },
  {
    missionKey: 'team_rank_top_1',
    titleKey: 'team_rank_top_1',
    titleLabel: '전선 개척자 III',
    category: 'team',
    description: '선택 학과를 학교 내 1위로 만들기',
    source: 'school_rank',
    targetValue: 1,
    unit: 'rank',
    requiresContribution: true,
  },
  {
    missionKey: 'team_pressure_level_3',
    titleKey: 'team_pressure_level_3',
    titleLabel: '경보 지휘관',
    category: 'team',
    description: '선택 학과 압박 레벨 3 달성',
    source: 'pressure_level',
    targetValue: 3,
    unit: 'level',
    requiresContribution: true,
  },
  {
    missionKey: 'team_pressure_level_6',
    titleKey: 'team_pressure_level_6',
    titleLabel: '최종 경보 지휘관',
    category: 'team',
    description: '선택 학과 압박 레벨 6 달성',
    source: 'pressure_level',
    targetValue: 6,
    unit: 'level',
    requiresContribution: true,
  },
  {
    missionKey: 'team_school_clicks_10000',
    titleKey: 'team_school_clicks_10000',
    titleLabel: '학교 공성 I',
    category: 'team',
    description: '학교 전체 압박 수 10,000 달성',
    source: 'school_total_clicks',
    targetValue: 10000,
    unit: 'click',
    requiresContribution: true,
  },
  {
    missionKey: 'team_school_clicks_20000',
    titleKey: 'team_school_clicks_20000',
    titleLabel: '학교 공성 II',
    category: 'team',
    description: '학교 전체 압박 수 20,000 달성',
    source: 'school_total_clicks',
    targetValue: 20000,
    unit: 'click',
    requiresContribution: true,
  },
  {
    missionKey: 'team_school_clicks_50000',
    titleKey: 'team_school_clicks_50000',
    titleLabel: '학교 공성 III',
    category: 'team',
    description: '학교 전체 압박 수 50,000 달성',
    source: 'school_total_clicks',
    targetValue: 50000,
    unit: 'click',
    requiresContribution: true,
  },
  {
    missionKey: 'team_school_clicks_100000',
    titleKey: 'team_school_clicks_100000',
    titleLabel: '학교 공성 IV',
    category: 'team',
    description: '학교 전체 압박 수 100,000 달성',
    source: 'school_total_clicks',
    targetValue: 100000,
    unit: 'click',
    requiresContribution: true,
  },
  {
    missionKey: 'team_school_clicks_200000',
    titleKey: 'team_school_clicks_200000',
    titleLabel: '학교 공성 V',
    category: 'team',
    description: '학교 전체 압박 수 200,000 달성',
    source: 'school_total_clicks',
    targetValue: 200000,
    unit: 'click',
    requiresContribution: true,
  },
]

const PERSONAL_MISSIONS: MissionDefinition[] = [
  ...PERSONAL_CLICK_THRESHOLDS.map((targetValue, index) => ({
    missionKey: `personal_click_${targetValue}`,
    titleKey: `personal_click_${targetValue}`,
    titleLabel: PERSONAL_CLICK_LABELS[index],
    category: 'personal' as const,
    description: `선택 학과에 압박 ${targetValue.toLocaleString()}회 기여`,
    source: 'department_clicks' as const,
    targetValue,
    unit: 'click' as const,
  })),
  ...PERSONAL_COMBO_THRESHOLDS.map((targetValue, index) => ({
    missionKey: `personal_combo_${targetValue}`,
    titleKey: `personal_combo_${targetValue}`,
    titleLabel: PERSONAL_COMBO_LABELS[index],
    category: 'personal' as const,
    description: `최대 콤보 x${targetValue.toLocaleString()} 달성`,
    source: 'max_combo' as const,
    targetValue,
    unit: 'combo' as const,
  })),
]

export const TITLE_MISSIONS: MissionDefinition[] = [...PERSONAL_MISSIONS, ...TEAM_MISSIONS]

export const TITLE_LABEL_BY_KEY = new Map(TITLE_MISSIONS.map((mission) => [mission.titleKey, mission.titleLabel]))
const TITLE_MISSION_BY_KEY = new Map(TITLE_MISSIONS.map((mission) => [mission.titleKey, mission]))

function readCurrentValue(context: TitleMissionContext, source: MissionSource): number | null {
  switch (source) {
    case 'department_clicks':
      return context.departmentContributionClicks
    case 'max_combo':
      return context.maxCombo
    case 'school_rank':
      return context.schoolRank
    case 'pressure_level':
      return context.pressureLevel
    case 'school_total_clicks':
      return context.schoolTotalClicks
    default:
      return null
  }
}

function calcProgressRatio(unit: MissionUnit, currentValue: number, targetValue: number): number {
  if (targetValue <= 0) return 1
  if (unit === 'rank') {
    if (currentValue <= 0) return 0
    if (currentValue <= targetValue) return 1
    return Math.min(targetValue / currentValue, 1)
  }
  return Math.min(currentValue / targetValue, 1)
}

function isCompleted(unit: MissionUnit, currentValue: number, targetValue: number): boolean {
  if (unit === 'rank') {
    return currentValue > 0 && currentValue <= targetValue
  }
  return currentValue >= targetValue
}

function buildMissionProgress(
  mission: MissionDefinition,
  context: TitleMissionContext,
  earnedTitleKeys: Set<string>,
): MissionProgress {
  const rawCurrentValue = readCurrentValue(context, mission.source)
  const currentValue = Math.max(rawCurrentValue ?? 0, 0)
  const blockedByContribution = mission.requiresContribution && !context.hasDepartmentContribution
  const completed = !blockedByContribution && isCompleted(mission.unit, currentValue, mission.targetValue)
  const claimed = earnedTitleKeys.has(mission.titleKey)
  const claimable = completed && !claimed

  return {
    missionKey: mission.missionKey,
    titleKey: mission.titleKey,
    titleLabel: mission.titleLabel,
    category: mission.category,
    description: mission.description,
    currentValue,
    targetValue: mission.targetValue,
    unit: mission.unit,
    progressRatio: calcProgressRatio(mission.unit, currentValue, mission.targetValue),
    completed,
    claimed,
    claimable,
    blockedReason: blockedByContribution
      ? '먼저 선택 학과에 인정 압박 1회를 기록해 주세요.'
      : undefined,
  }
}

export function evaluateTitleMissions(
  context: TitleMissionContext,
  earnedTitleKeys: Iterable<string>,
): { personalMissions: MissionProgress[]; teamMissions: MissionProgress[] } {
  const earned = new Set(earnedTitleKeys)

  const personalMissions = PERSONAL_MISSIONS.map((mission) => buildMissionProgress(mission, context, earned))
  const teamMissions = TEAM_MISSIONS.map((mission) => buildMissionProgress(mission, context, earned))

  return { personalMissions, teamMissions }
}

export function getMissionByTitleKey(titleKey: string): MissionDefinition | null {
  return TITLE_MISSION_BY_KEY.get(titleKey) ?? null
}

export function getTitleLabel(titleKey: string | null | undefined): string | null {
  if (!titleKey) return null
  return TITLE_LABEL_BY_KEY.get(titleKey) ?? null
}
