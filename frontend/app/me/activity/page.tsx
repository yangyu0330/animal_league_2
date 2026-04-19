'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { claimMyTitle, getMyActivity, selectMyTitle } from '@/lib/api/activity'
import { ApiError } from '@/lib/api/client'
import { signOut } from '@/lib/auth/client'
import { getTitleLabel } from '@/lib/title-missions'
import { useAppStore } from '@/lib/store'
import type { MissionProgress, MissionUnit, MyActivityResponse } from '@/lib/types'

export default function ActivityPage() {
  const router = useRouter()
  const { userState, user, authLoaded, setUser } = useAppStore()
  const [activity, setActivity] = useState<MyActivityResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [claimingTitleKey, setClaimingTitleKey] = useState<string | null>(null)
  const [selectingTitleKey, setSelectingTitleKey] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoaded) return
    if (userState === 'GUEST') {
      router.replace('/')
      return
    }
    if (userState === 'AUTH_NO_SCHOOL') {
      router.replace('/onboarding/school')
    }
  }, [authLoaded, router, userState])

  const loadActivity = useCallback(async () => {
    try {
      const response = await getMyActivity()
      setActivity(response)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
        router.replace('/')
        return
      }
      toast.error('내 활동을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!authLoaded || userState !== 'ACTIVE_USER') return
    setIsLoading(true)
    void loadActivity()
  }, [authLoaded, loadActivity, user?.id, userState])

  const allMissions = useMemo(
    () => [...(activity?.personalMissions ?? []), ...(activity?.teamMissions ?? [])],
    [activity?.personalMissions, activity?.teamMissions],
  )

  const claimedMissions = useMemo(
    () =>
      allMissions
        .filter((mission) => mission.claimed)
        .sort((a, b) => a.titleLabel.localeCompare(b.titleLabel)),
    [allMissions],
  )

  const titleLabelByKey = useMemo(() => {
    const map = new Map<string, string>()
    for (const mission of allMissions) {
      map.set(mission.titleKey, mission.titleLabel)
    }
    return map
  }, [allMissions])

  const selectedTitleKey = activity?.selectedTitleKey ?? user?.selectedTitleKey ?? null
  const selectedTitleLabel =
    titleLabelByKey.get(selectedTitleKey ?? '') ?? getTitleLabel(selectedTitleKey) ?? null

  async function handleSignOut() {
    await signOut()
    router.replace('/')
  }

  async function handleClaimTitle(titleKey: string) {
    if (claimingTitleKey || selectingTitleKey) return
    setClaimingTitleKey(titleKey)

    try {
      const result = await claimMyTitle(titleKey)
      if (!result.awarded && result.reason === 'ALREADY_CLAIMED') {
        toast.info('이미 획득한 칭호입니다.')
      } else {
        toast.success('칭호를 획득했습니다.')
      }
      await loadActivity()
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('칭호 획득에 실패했습니다.')
      }
    } finally {
      setClaimingTitleKey(null)
    }
  }

  async function handleSelectTitle(titleKey: string | null) {
    if (claimingTitleKey || selectingTitleKey) return
    const keyForLoading = titleKey ?? '__none__'
    setSelectingTitleKey(keyForLoading)

    try {
      const response = await selectMyTitle(titleKey)
      setActivity((prev) => (prev ? { ...prev, selectedTitleKey: response.selectedTitleKey } : prev))
      if (user) {
        setUser({ ...user, selectedTitleKey: response.selectedTitleKey })
      }
      toast.success(response.selectedTitleKey ? '대표 칭호를 선택했습니다.' : '대표 칭호 선택을 해제했습니다.')
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('칭호 선택에 실패했습니다.')
      }
    } finally {
      setSelectingTitleKey(null)
    }
  }

  if (!authLoaded || userState !== 'ACTIVE_USER') return null

  return (
    <AppShell>
      <div className="px-4 py-6">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">내 활동</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {user?.selectedSchoolName} · {user?.selectedDepartmentName}
            </p>
            <Link
              href="/onboarding/school?mode=edit&next=%2Fme%2Factivity"
              className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
            >
              학교/학과 수정
            </Link>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="rounded-xl border-border bg-transparent">
            로그아웃
          </Button>
        </header>

        {isLoading || !activity ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            활동 데이터를 불러오는 중입니다.
          </div>
        ) : (
          <>
            <section className="mb-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">오늘 클릭 수</p>
                <p className="number-display mt-1 text-3xl font-bold text-primary">{activity.todayCount}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">Max Combo</p>
                <p className="number-display mt-1 text-3xl font-bold text-primary">x{activity.maxCombo}</p>
              </div>
            </section>

            <section className="mb-5 rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">대표 칭호</p>
              <p className="mt-1 text-base font-semibold text-foreground">{selectedTitleLabel ?? '대표 칭호 없음'}</p>
              <p className="mt-1 text-xs text-muted-foreground">보유 칭호 {claimedMissions.length}개</p>
            </section>

            <section className="mb-5 rounded-xl border border-border bg-card p-4">
              <h2 className="text-base font-semibold text-foreground">칭호 선택</h2>
              {claimedMissions.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">아직 획득한 칭호가 없습니다.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant={selectedTitleKey === null ? 'default' : 'outline'}
                    size="sm"
                    disabled={selectingTitleKey !== null}
                    onClick={() => void handleSelectTitle(null)}
                    className="rounded-lg"
                  >
                    칭호 없음
                  </Button>
                  {claimedMissions.map((mission) => {
                    const isSelected = selectedTitleKey === mission.titleKey
                    const isSelecting = selectingTitleKey === mission.titleKey
                    return (
                      <Button
                        key={mission.titleKey}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        disabled={selectingTitleKey !== null}
                        onClick={() => void handleSelectTitle(mission.titleKey)}
                        className="rounded-lg"
                      >
                        {isSelecting ? '선택 중...' : mission.titleLabel}
                      </Button>
                    )
                  })}
                </div>
              )}
            </section>

            {activity.selectedDepartment ? (
              <section className="mb-5 rounded-xl border border-border bg-card p-4">
                <h2 className="text-base font-semibold text-foreground">팀 진행 현황</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  내 학과 기여 클릭 {activity.myDepartmentContributionClicks.toLocaleString()}회
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  학교 전체 클릭 {activity.schoolTotalClicks.toLocaleString()}회
                </p>
                {activity.schoolWar ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    현재 순위 {activity.schoolWar.rank} / {activity.schoolWar.totalDepartments}
                  </p>
                ) : null}
              </section>
            ) : null}

            <MissionSection
              title="개인 미션"
              missions={activity.personalMissions}
              selectedTitleKey={selectedTitleKey}
              claimingTitleKey={claimingTitleKey}
              selectingTitleKey={selectingTitleKey}
              onClaim={handleClaimTitle}
              onSelect={handleSelectTitle}
            />

            <MissionSection
              title="팀 미션"
              missions={activity.teamMissions}
              selectedTitleKey={selectedTitleKey}
              claimingTitleKey={claimingTitleKey}
              selectingTitleKey={selectingTitleKey}
              onClaim={handleClaimTitle}
              onSelect={handleSelectTitle}
            />
          </>
        )}
      </div>
    </AppShell>
  )
}

function MissionSection({
  title,
  missions,
  selectedTitleKey,
  claimingTitleKey,
  selectingTitleKey,
  onClaim,
  onSelect,
}: {
  title: string
  missions: MissionProgress[]
  selectedTitleKey: string | null
  claimingTitleKey: string | null
  selectingTitleKey: string | null
  onClaim: (titleKey: string) => Promise<void> | void
  onSelect: (titleKey: string | null) => Promise<void> | void
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-2">
        {missions.map((mission) => {
          const progressPercent = Math.min(100, Math.max(0, Math.round(mission.progressRatio * 100)))
          const isClaiming = claimingTitleKey === mission.titleKey
          const isSelecting = selectingTitleKey === mission.titleKey
          const isSelected = selectedTitleKey === mission.titleKey

          return (
            <div key={mission.missionKey} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{mission.titleLabel}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{mission.description}</p>
                </div>
                <MissionActionButton
                  mission={mission}
                  isClaiming={isClaiming}
                  isSelecting={isSelecting}
                  isSelected={isSelected}
                  disabled={claimingTitleKey !== null || selectingTitleKey !== null}
                  onClaim={onClaim}
                  onSelect={onSelect}
                />
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{formatMissionProgress(mission)}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              {mission.blockedReason ? (
                <p className="mt-2 text-[11px] text-muted-foreground">{mission.blockedReason}</p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function MissionActionButton({
  mission,
  isClaiming,
  isSelecting,
  isSelected,
  disabled,
  onClaim,
  onSelect,
}: {
  mission: MissionProgress
  isClaiming: boolean
  isSelecting: boolean
  isSelected: boolean
  disabled: boolean
  onClaim: (titleKey: string) => Promise<void> | void
  onSelect: (titleKey: string | null) => Promise<void> | void
}) {
  if (mission.claimed) {
    return (
      <Button
        variant={isSelected ? 'default' : 'outline'}
        size="sm"
        disabled={disabled}
        onClick={() => void onSelect(mission.titleKey)}
        className="rounded-lg"
      >
        {isSelecting ? '선택 중...' : isSelected ? '선택됨' : '칭호 선택'}
      </Button>
    )
  }

  if (mission.claimable) {
    return (
      <Button
        size="sm"
        disabled={disabled}
        onClick={() => void onClaim(mission.titleKey)}
        className="rounded-lg"
      >
        {isClaiming ? '획득 중...' : '칭호 받기'}
      </Button>
    )
  }

  return (
    <Button variant="outline" size="sm" disabled className="rounded-lg">
      진행 중
    </Button>
  )
}

function formatMissionProgress(mission: MissionProgress): string {
  const current = mission.currentValue.toLocaleString()
  const target = mission.targetValue.toLocaleString()

  return `${formatByUnit(mission.unit, current)} / ${formatByUnit(mission.unit, target)}`
}

function formatByUnit(unit: MissionUnit, value: string): string {
  switch (unit) {
    case 'click':
      return `${value} 클릭`
    case 'combo':
      return `${value} 콤보`
    case 'rank':
      return `TOP ${value}`
    case 'level':
      return `Lv ${value}`
    default:
      return value
  }
}
