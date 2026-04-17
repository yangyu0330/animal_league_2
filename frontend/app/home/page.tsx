'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { PressureBadge } from '@/components/pressure-badge'
import { RankingCard } from '@/components/ranking-card'
import { SchoolSelector } from '@/components/school-selector'
import { TrendingCard } from '@/components/trending-card'
import { getDepartmentById } from '@/lib/api/departments'
import { getComboRankings, getRankings, getTrendingDepartments } from '@/lib/api/rankings'
import { ApiError } from '@/lib/api/client'
import { calculateCurrentStudentCount } from '@/lib/domain'
import { useAppStore } from '@/lib/store'
import type { ComboRankingItem, Department, RankingItem, TrendingItem } from '@/lib/types'

export default function HomePage() {
  const router = useRouter()
  const { userState, user, authLoaded } = useAppStore()
  const [schoolFilter, setSchoolFilter] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState<string | null>(null)
  const [myDepartment, setMyDepartment] = useState<Department | null>(null)
  const [myDepartmentError, setMyDepartmentError] = useState(false)
  const [nationalRankings, setNationalRankings] = useState<RankingItem[]>([])
  const [schoolRankings, setSchoolRankings] = useState<RankingItem[]>([])
  const [trending, setTrending] = useState<TrendingItem[]>([])
  const [comboRankings, setComboRankings] = useState<ComboRankingItem[]>([])

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

  useEffect(() => {
    if (!user?.selectedSchoolId) return
    setSchoolFilter(user.selectedSchoolId)
    setSchoolName(user.selectedSchoolName)
  }, [user?.selectedSchoolId, user?.selectedSchoolName])

  useEffect(() => {
    const departmentId = user?.selectedDepartmentId
    if (typeof departmentId !== 'string' || departmentId.length === 0) {
      setMyDepartment(null)
      setMyDepartmentError(false)
      return
    }
    const activeDepartmentId = departmentId

    let cancelled = false

    async function loadMyDepartment() {
      try {
        const department = await getDepartmentById(activeDepartmentId)
        if (cancelled) return
        setMyDepartment(department)
        setMyDepartmentError(false)
      } catch {
        if (cancelled) return
        setMyDepartment(null)
        setMyDepartmentError(true)
      }
    }

    void loadMyDepartment()
    return () => {
      cancelled = true
    }
  }, [user?.selectedDepartmentId])

  useEffect(() => {
    async function load() {
      try {
        const [nationalResponse, schoolResponse, trendingItems, comboResponse] = await Promise.all([
          getRankings({ scope: 'national' }),
          schoolFilter ? getRankings({ scope: 'school', schoolId: schoolFilter }) : Promise.resolve(null),
          getTrendingDepartments(),
          getComboRankings(),
        ])

        setNationalRankings(nationalResponse.items.slice(0, 10))
        setSchoolRankings(schoolResponse?.items.slice(0, 5) ?? [])
        setTrending(trendingItems)
        setComboRankings(comboResponse.items.slice(0, 5))
      } catch (error) {
        const message = error instanceof ApiError ? '랭킹을 불러오지 못했습니다.' : '네트워크 상태를 확인해 주세요.'
        toast.error(message)
      }
    }

    void load()
  }, [schoolFilter])

  function handleSchoolChange(nextId: string | null, nextName: string | null) {
    setSchoolFilter(nextId)
    setSchoolName(nextName)
  }

  if (!authLoaded || userState !== 'ACTIVE_USER') return null

  return (
    <AppShell>
      <div className="px-4 py-6">
        <header className="mb-5 flex items-center justify-between">
          <SchoolSelector value={schoolFilter} valueLabel={schoolName} onChange={handleSchoolChange} />
          <Link href="/departments/search" className="rounded-lg p-2 hover:bg-muted" aria-label="학과 검색">
            <Search className="h-5 w-5 text-foreground" />
          </Link>
        </header>

        <section className="mb-6">
          <h1 className="text-xl font-bold text-foreground">내 학과</h1>
          <p className="text-sm text-muted-foreground">현재 선택한 학과 기준</p>
        </section>

        <section className="mb-7">
          {myDepartment ? (
            <Link
              href={`/departments/${myDepartment.id}`}
              className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-foreground">{myDepartment.name}</h2>
                  <p className="truncate text-sm text-muted-foreground">{myDepartment.schoolName}</p>
                </div>
                <PressureBadge level={myDepartment.pressureLevel} size="sm" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[11px] text-muted-foreground">총 클릭</p>
                  <p className="number-display text-sm font-bold text-foreground">{myDepartment.totalClicks.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">현재 학생</p>
                  <p className="number-display text-sm font-bold text-foreground">
                    {calculateCurrentStudentCount(myDepartment.totalClicks)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">오늘 클릭</p>
                  <p className="number-display text-sm font-bold text-foreground">{myDepartment.todayClicks.toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              {myDepartmentError
                ? '내 학과 정보를 불러오지 못했습니다.'
                : '내 학과 정보를 준비하고 있습니다.'}
            </div>
          )}
        </section>

        <section className="mb-7">
          <h2 className="mb-3 text-base font-semibold text-foreground">오늘 급상승</h2>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {trending.map((item) => (
              <TrendingCard key={item.departmentId} item={item} />
            ))}
          </div>
        </section>

        <section className="mb-3">
          <h2 className="text-base font-semibold text-foreground">학교별 TOP 5</h2>
          {schoolFilter ? <p className="text-sm text-muted-foreground">{schoolName} 기준</p> : null}
        </section>
        <section className="space-y-2 mb-7">
          {schoolRankings.map((item) => (
            <RankingCard key={item.departmentId} item={item} />
          ))}
          {schoolRankings.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              학교를 선택하면 학교별 TOP 5를 볼 수 있어요.
            </div>
          ) : null}
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold text-foreground">전국 학과 압박 TOP 10</h2>
          <p className="text-sm text-muted-foreground">실시간 누적 클릭 기준</p>
        </section>

        <section className="space-y-2 mb-7">
          {nationalRankings.map((item) => (
            <RankingCard key={item.departmentId} item={item} />
          ))}
        </section>

        <section className="mb-3">
          <h2 className="text-base font-semibold text-foreground">Max Combo TOP 5</h2>
        </section>
        <section className="space-y-2">
          {comboRankings.map((item) => (
            <div
              key={item.userId}
              className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2"
            >
              <div className="w-8 flex-shrink-0 text-center">
                <span className={`number-display text-xl font-bold ${item.rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.rank}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{item.nickname}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[item.schoolName, item.departmentName].filter(Boolean).join(' / ') || 'School/Department not set'}
                </p>
              </div>
              <div className="text-right">
                <p className="number-display text-base font-bold text-primary">x{item.maxCombo}</p>
                <p className="text-[11px] text-muted-foreground">Max Combo</p>
              </div>
            </div>
          ))}
          {comboRankings.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              No combo records yet.
            </div>
          ) : null}
        </section>
      </div>
    </AppShell>
  )
}
