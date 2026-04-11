'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { RankingCard } from '@/components/ranking-card'
import { SchoolSelector } from '@/components/school-selector'
import { TrendingCard } from '@/components/trending-card'
import { getRankings, getTrendingDepartments } from '@/lib/api/rankings'
import { ApiError } from '@/lib/api/client'
import { useAppStore } from '@/lib/store'
import type { RankingItem, TrendingItem } from '@/lib/types'

export default function HomePage() {
  const router = useRouter()
  const { userState, user, authLoaded } = useAppStore()
  const [schoolFilter, setSchoolFilter] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState<string | null>(null)
  const [nationalRankings, setNationalRankings] = useState<RankingItem[]>([])
  const [schoolRankings, setSchoolRankings] = useState<RankingItem[]>([])
  const [trending, setTrending] = useState<TrendingItem[]>([])

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
    async function load() {
      try {
        const [nationalResponse, schoolResponse, trendingItems] = await Promise.all([
          getRankings({ scope: 'national' }),
          schoolFilter ? getRankings({ scope: 'school', schoolId: schoolFilter }) : Promise.resolve(null),
          getTrendingDepartments(),
        ])

        setNationalRankings(nationalResponse.items.slice(0, 10))
        setSchoolRankings(schoolResponse?.items.slice(0, 5) ?? [])
        setTrending(trendingItems)
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
          <SchoolSelector value={schoolFilter} onChange={handleSchoolChange} />
          <Link href="/departments/search" className="rounded-lg p-2 hover:bg-muted" aria-label="학과 검색">
            <Search className="h-5 w-5 text-foreground" />
          </Link>
        </header>

        <section className="mb-6">
          <h1 className="text-xl font-bold text-foreground">전국 학과 압박 TOP 10</h1>
          <p className="text-sm text-muted-foreground">실시간 누적 클릭 기준</p>
        </section>

        <section className="space-y-2 mb-7">
          {nationalRankings.map((item) => (
            <RankingCard key={item.departmentId} item={item} />
          ))}
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
        <section className="space-y-2">
          {schoolRankings.map((item) => (
            <RankingCard key={item.departmentId} item={item} />
          ))}
          {schoolRankings.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              학교를 선택하면 학교별 TOP 5를 볼 수 있어요.
            </div>
          ) : null}
        </section>
      </div>
    </AppShell>
  )
}
