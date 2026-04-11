'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getRankings } from '@/lib/api/rankings'
import { useAppStore } from '@/lib/store'
import type { RankingItem } from '@/lib/types'

export default function LandingPage() {
  const router = useRouter()
  const { userState, authLoaded } = useAppStore()
  const [previewItems, setPreviewItems] = useState<RankingItem[]>([])

  useEffect(() => {
    if (!authLoaded) return
    if (userState === 'ACTIVE_USER') {
      router.replace('/home')
      return
    }
    if (userState === 'AUTH_NO_SCHOOL') {
      router.replace('/onboarding/school')
    }
  }, [authLoaded, router, userState])

  useEffect(() => {
    if (!authLoaded) return
    async function loadPreview() {
      const response = await getRankings({ scope: 'national' })
      setPreviewItems(response.items.slice(0, 5))
    }

    void loadPreview()
  }, [authLoaded])

  if (!authLoaded) return null

  function handleSignIn() {
    const nextPath = new URLSearchParams(window.location.search).get('next')
    router.push(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login')
  }

  return (
    <div className="mobile-canvas min-h-screen bg-background">
      <main className="px-4 py-6">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">학과 과제 압박 랭킹</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            과제 압박을 느낄 때 학과를 탭하고 전국 랭킹을 확인하세요.
          </p>
        </header>

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">샘플 랭킹 미리보기</h2>
          <div className="space-y-2">
            {previewItems.map((department, index) => (
              <article
                key={department.departmentId}
                className="flex h-[72px] items-center gap-3 rounded-2xl border border-border bg-card px-3"
              >
                <p className="number-display w-8 text-center text-lg font-bold text-primary">
                  {index + 1}
                </p>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {department.departmentName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{department.schoolName}</p>
                </div>
                <div className="text-right">
                  <p className="number-display text-sm font-bold text-foreground">
                    {department.totalClicks.toLocaleString()}
                  </p>
                  <p className="number-display text-[11px] text-muted-foreground">
                    스택 {department.stackCount}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background p-4 safe-bottom">
        <Button
          onClick={handleSignIn}
          className="h-14 w-full rounded-[14px] bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Google로 시작하기
        </Button>
      </div>
    </div>
  )
}
