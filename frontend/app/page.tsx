'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RankingCard } from '@/components/ranking-card'
import { Button } from '@/components/ui/button'
import { getRankings } from '@/lib/api/rankings'
import { signInWithGoogle } from '@/lib/auth/client'
import { useAppStore } from '@/lib/store'
import type { RankingItem } from '@/lib/types'

export default function LandingPage() {
  const router = useRouter()
  const { userState, authLoaded } = useAppStore()
  const [topItems, setTopItems] = useState<RankingItem[]>([])
  const [isRankingLoading, setIsRankingLoading] = useState(true)
  const [rankingLoadFailed, setRankingLoadFailed] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadTopRanking() {
      try {
        const response = await getRankings({ scope: 'national' })
        if (cancelled) return
        setTopItems(response.items.slice(0, 5))
        setRankingLoadFailed(false)
      } catch {
        if (cancelled) return
        setTopItems([])
        setRankingLoadFailed(true)
      } finally {
        if (!cancelled) setIsRankingLoading(false)
      }
    }

    void loadTopRanking()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCtaClick() {
    if (!authLoaded || isSigningIn) return

    if (userState === 'ACTIVE_USER') {
      router.push('/home')
      return
    }

    if (userState === 'AUTH_NO_SCHOOL') {
      router.push('/onboarding/school')
      return
    }

    try {
      setIsSigningIn(true)
      const nextPath = new URLSearchParams(window.location.search).get('next')
      await signInWithGoogle(nextPath)
    } catch {
      toast.error('Google 로그인에 실패했어요. 다시 시도해주세요.')
      setIsSigningIn(false)
    }
  }

  const ctaLabel = !authLoaded
    ? '상태 확인 중...'
    : isSigningIn
      ? 'Google 로그인으로 이동 중...'
      : userState === 'ACTIVE_USER'
        ? '홈으로 이동하기'
        : userState === 'AUTH_NO_SCHOOL'
          ? '학교/학과 선택하고 시작하기'
          : '로그인하고 압박 시작하기'

  return (
    <div className="mobile-canvas min-h-screen bg-background">
      <main className="px-4 py-6">
        <section>
          <h1 className="text-2xl font-bold text-foreground">과제가 많아서 힘들어요???</h1>
          <p className="mt-2 text-base font-semibold text-foreground">교수님에게도 압박을 가해봐요!!</p>
          <p className="mt-2 text-sm text-muted-foreground">
            당신이 클릭을 할수록 당신 학과 교수님이 힘들어집니다
          </p>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
            <Image
              src="/characters/professor-base.png"
              alt="과제 압박에 힘들어진 교수님"
              width={1200}
              height={1200}
              className="h-auto w-full object-cover"
              priority
            />
          </div>

          <Button
            onClick={() => void handleCtaClick()}
            disabled={!authLoaded || isSigningIn}
            className="mt-4 h-14 w-full rounded-[14px] bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {ctaLabel}
          </Button>
        </section>

        <section className="mt-8 pb-6">
          <h2 className="text-base font-semibold text-foreground">현재 전국 제일 힘든 학과 TOP 5</h2>
          <p className="mt-1 text-sm text-muted-foreground">총 클릭 수 기준</p>

          <div className="mt-3 space-y-2">
            {isRankingLoading ? (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                랭킹을 불러오는 중...
              </div>
            ) : null}

            {!isRankingLoading && rankingLoadFailed ? (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                랭킹을 불러오지 못했어요.
              </div>
            ) : null}

            {!isRankingLoading && !rankingLoadFailed && topItems.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                표시할 랭킹 데이터가 없어요.
              </div>
            ) : null}

            {!isRankingLoading && !rankingLoadFailed
              ? topItems.map((item) => <RankingCard key={item.departmentId} item={item} />)
              : null}
          </div>
        </section>
      </main>
    </div>
  )
}
