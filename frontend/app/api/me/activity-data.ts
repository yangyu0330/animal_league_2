import { calculatePressureLevel, calculateStackCount } from '@/lib/domain'
import { createClient } from '@/lib/supabase/server'
import { evaluateTitleMissions } from '@/lib/title-missions'
import { getKstDayStartIso } from '@/lib/time'
import type {
  ActivitySelectedDepartmentSummary,
  MissionProgress,
  SchoolWarSummary,
} from '@/lib/types'

interface AppUserProfileRow {
  max_combo?: number | null
  selected_school_id?: string | null
  selected_department_id?: string | null
  selected_title_key?: string | null
}

interface TitleAwardRow {
  title_key: string
}

interface SchoolRelation {
  name?: string
}

interface DepartmentRow {
  id: string
  name: string
  school_id: string
  total_clicks: number
  pressure_level: number
  school?: SchoolRelation | SchoolRelation[] | null
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

function resolveSchoolName(school: SchoolRelation | SchoolRelation[] | null | undefined): string {
  if (!school) return ''
  if (Array.isArray(school)) return school[0]?.name ?? ''
  return school.name ?? ''
}

export interface ActivityDataPayload {
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

export async function loadActivityData(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<ActivityDataPayload> {
  const appUserQuery = await supabase
    .from('app_user')
    .select('max_combo, selected_school_id, selected_department_id, selected_title_key')
    .eq('id', userId)
    .maybeSingle()

  let appUser: AppUserProfileRow | null = null

  if (appUserQuery.error?.code === '42703') {
    const fallbackQuery = await supabase
      .from('app_user')
      .select('max_combo, selected_school_id, selected_department_id')
      .eq('id', userId)
      .maybeSingle()

    if (fallbackQuery.error) {
      throw fallbackQuery.error
    }

    appUser = fallbackQuery.data as AppUserProfileRow | null
  } else if (appUserQuery.error) {
    throw appUserQuery.error
  } else {
    appUser = appUserQuery.data as AppUserProfileRow | null
  }

  const maxCombo = Number(appUser?.max_combo ?? 0)
  const selectedSchoolId = appUser?.selected_school_id ?? null
  const selectedDepartmentId = appUser?.selected_department_id ?? null
  const selectedTitleKey = appUser?.selected_title_key ?? null

  const earnedTitlesQuery = await supabase
    .from('user_title_award')
    .select('title_key')
    .eq('user_id', userId)

  let earnedTitleKeys: string[] = []
  if (earnedTitlesQuery.error?.code === '42P01' || earnedTitlesQuery.error?.code === '42703') {
    earnedTitleKeys = []
  } else if (earnedTitlesQuery.error) {
    throw earnedTitlesQuery.error
  } else {
    earnedTitleKeys = ((earnedTitlesQuery.data ?? []) as TitleAwardRow[]).map((row) => row.title_key)
  }

  const todayCountQuery = await supabase
    .from('click_event')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('accepted', true)
    .gte('created_at', getKstDayStartIso())

  if (todayCountQuery.error) {
    throw todayCountQuery.error
  }

  let selectedDepartment: ActivitySelectedDepartmentSummary | null = null
  let schoolWar: SchoolWarSummary | null = null
  let schoolTotalClicks = 0
  let myDepartmentContributionClicks = 0

  if (selectedDepartmentId) {
    const contributionQuery = await supabase
      .from('click_event')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('department_id', selectedDepartmentId)
      .eq('accepted', true)

    if (contributionQuery.error) {
      throw contributionQuery.error
    }
    myDepartmentContributionClicks = Number(contributionQuery.count ?? 0)

    const selectedDepartmentQuery = await supabase
      .from('department')
      .select('id, name, school_id, total_clicks, pressure_level, school:school(name)')
      .eq('id', selectedDepartmentId)
      .maybeSingle()

    if (selectedDepartmentQuery.error) {
      throw selectedDepartmentQuery.error
    }

    const selectedDepartmentRow = selectedDepartmentQuery.data as DepartmentRow | null

    if (selectedDepartmentRow) {
      const selectedDepartmentTodayQuery = await supabase
        .from('click_event')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', selectedDepartmentRow.id)
        .eq('accepted', true)
        .gte('created_at', getKstDayStartIso())

      if (selectedDepartmentTodayQuery.error) {
        throw selectedDepartmentTodayQuery.error
      }

      const totalClicks = Number(selectedDepartmentRow.total_clicks ?? 0)
      const pressureLevel = Number(selectedDepartmentRow.pressure_level ?? calculatePressureLevel(totalClicks))

      selectedDepartment = {
        id: selectedDepartmentRow.id,
        name: selectedDepartmentRow.name,
        schoolName: resolveSchoolName(selectedDepartmentRow.school),
        totalClicks,
        stackCount: calculateStackCount(totalClicks),
        pressureLevel: calculatePressureLevel(totalClicks) ?? pressureLevel,
        todayClicks: Number(selectedDepartmentTodayQuery.count ?? 0),
      }

      const schoolDepartmentsQuery = await supabase
        .from('department')
        .select('id, name, total_clicks')
        .eq('school_id', selectedDepartmentRow.school_id)

      if (schoolDepartmentsQuery.error) {
        throw schoolDepartmentsQuery.error
      }

      const schoolDepartments = (schoolDepartmentsQuery.data ?? []) as Array<{
        id: string
        name: string
        total_clicks: number
      }>

      schoolTotalClicks = schoolDepartments.reduce(
        (sum, department) => sum + Number(department.total_clicks ?? 0),
        0,
      )

      const myClicks = Number(selectedDepartmentRow.total_clicks ?? 0)
      const higherDepartments = schoolDepartments
        .filter((department) => Number(department.total_clicks ?? 0) > myClicks)
        .sort((a, b) => Number(a.total_clicks ?? 0) - Number(b.total_clicks ?? 0))

      const rank = higherDepartments.length + 1
      const rival = higherDepartments[0] ?? null
      const topClicks = schoolDepartments.reduce(
        (max, department) => Math.max(max, Number(department.total_clicks ?? 0)),
        0,
      )

      schoolWar = {
        rank,
        totalDepartments: schoolDepartments.length,
        rivalDepartmentName: rival?.name ?? null,
        rivalClicks: rival ? Number(rival.total_clicks ?? 0) : null,
        clicksToNextRank: rival ? Number(rival.total_clicks ?? 0) - myClicks + 1 : 0,
        clicksToFirst: rank === 1 ? 0 : topClicks - myClicks + 1,
      }
    }
  }

  const missionContext = {
    departmentContributionClicks: myDepartmentContributionClicks,
    maxCombo,
    schoolRank: schoolWar?.rank ?? null,
    pressureLevel: selectedDepartment?.pressureLevel ?? null,
    schoolTotalClicks,
    hasDepartmentContribution: myDepartmentContributionClicks > 0,
  }

  const { personalMissions, teamMissions } = evaluateTitleMissions(missionContext, earnedTitleKeys)

  return {
    todayCount: Number(todayCountQuery.count ?? 0),
    maxCombo,
    selectedTitleKey,
    earnedTitleKeys,
    myDepartmentContributionClicks,
    schoolTotalClicks,
    selectedDepartment,
    schoolWar,
    personalMissions,
    teamMissions,
  }
}
