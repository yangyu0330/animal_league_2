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
  'Pressure Bronze',
  'Pressure Silver',
  'Pressure Gold',
  'Pressure Platinum',
  'Pressure Diamond',
  'Pressure Master',
  'Pressure Grandmaster',
  'Pressure Challenger',
  'Pressure Legend',
]

const PERSONAL_COMBO_THRESHOLDS = [50, 100, 150, 300, 500, 1000, 1500, 3000, 5000]
const PERSONAL_COMBO_LABELS = [
  'Combo Bronze',
  'Combo Silver',
  'Combo Gold',
  'Combo Platinum',
  'Combo Diamond',
  'Combo Master',
  'Combo Grandmaster',
  'Combo Challenger',
  'Combo Legend',
]

const TEAM_MISSIONS: MissionDefinition[] = [
  {
    missionKey: 'team_rank_top_10',
    titleKey: 'team_rank_top_10',
    titleLabel: 'War Vanguard I',
    category: 'team',
    description: 'Reach school top 10 with your selected department',
    source: 'school_rank',
    targetValue: 10,
    unit: 'rank',
    requiresContribution: true,
  },
  {
    missionKey: 'team_rank_top_3',
    titleKey: 'team_rank_top_3',
    titleLabel: 'War Vanguard II',
    category: 'team',
    description: 'Reach school top 3 with your selected department',
    source: 'school_rank',
    targetValue: 3,
    unit: 'rank',
    requiresContribution: true,
  },
  {
    missionKey: 'team_rank_top_1',
    titleKey: 'team_rank_top_1',
    titleLabel: 'War Vanguard III',
    category: 'team',
    description: 'Reach school rank #1 with your selected department',
    source: 'school_rank',
    targetValue: 1,
    unit: 'rank',
    requiresContribution: true,
  },
  {
    missionKey: 'team_pressure_level_3',
    titleKey: 'team_pressure_level_3',
    titleLabel: 'Alert Commander',
    category: 'team',
    description: 'Push selected department to pressure level 3',
    source: 'pressure_level',
    targetValue: 3,
    unit: 'level',
    requiresContribution: true,
  },
  {
    missionKey: 'team_pressure_level_6',
    titleKey: 'team_pressure_level_6',
    titleLabel: 'Final Alarm Commander',
    category: 'team',
    description: 'Push selected department to pressure level 6',
    source: 'pressure_level',
    targetValue: 6,
    unit: 'level',
    requiresContribution: true,
  },
  {
    missionKey: 'team_school_clicks_10000',
    titleKey: 'team_school_clicks_10000',
    titleLabel: 'School Siege I',
    category: 'team',
    description: 'School total clicks reaches 10,000',
    source: 'school_total_clicks',
    targetValue: 10000,
    unit: 'click',
    requiresContribution: true,
  },
  {
    missionKey: 'team_school_clicks_20000',
    titleKey: 'team_school_clicks_20000',
    titleLabel: 'School Siege II',
    category: 'team',
    description: 'School total clicks reaches 20,000',
    source: 'school_total_clicks',
    targetValue: 20000,
    unit: 'click',
    requiresContribution: true,
  },
  {
    missionKey: 'team_school_clicks_50000',
    titleKey: 'team_school_clicks_50000',
    titleLabel: 'School Siege III',
    category: 'team',
    description: 'School total clicks reaches 50,000',
    source: 'school_total_clicks',
    targetValue: 50000,
    unit: 'click',
    requiresContribution: true,
  },
  {
    missionKey: 'team_school_clicks_100000',
    titleKey: 'team_school_clicks_100000',
    titleLabel: 'School Siege IV',
    category: 'team',
    description: 'School total clicks reaches 100,000',
    source: 'school_total_clicks',
    targetValue: 100000,
    unit: 'click',
    requiresContribution: true,
  },
  {
    missionKey: 'team_school_clicks_200000',
    titleKey: 'team_school_clicks_200000',
    titleLabel: 'School Siege V',
    category: 'team',
    description: 'School total clicks reaches 200,000',
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
    description: `Contribute ${targetValue.toLocaleString()} clicks to your selected department`,
    source: 'department_clicks' as const,
    targetValue,
    unit: 'click' as const,
  })),
  ...PERSONAL_COMBO_THRESHOLDS.map((targetValue, index) => ({
    missionKey: `personal_combo_${targetValue}`,
    titleKey: `personal_combo_${targetValue}`,
    titleLabel: PERSONAL_COMBO_LABELS[index],
    category: 'personal' as const,
    description: `Reach max combo x${targetValue.toLocaleString()}`,
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
      ? 'Contribute at least 1 accepted click to your selected department first.'
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
