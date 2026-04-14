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
      toast.error('Google 濡쒓렇?몄뿉 ?ㅽ뙣?덉뼱?? ?ㅼ떆 ?쒕룄?댁＜?몄슂.')
      setIsSigningIn(false)
    }
  }

  const ctaLabel = !authLoaded
    ? '?곹깭 ?뺤씤 以?..'
    : isSigningIn
      ? 'Google 濡쒓렇?몄쑝濡??대룞 以?..'
      : userState === 'ACTIVE_USER'
        ? '?덉쑝濡??대룞?섍린'
        : userState === 'AUTH_NO_SCHOOL'
          ? '?숆탳/?숆낵 ?좏깮?섍퀬 ?쒖옉?섍린'
          : '濡쒓렇?명븯怨??뺣컯 ?쒖옉?섍린'

  return (
    <div className="mobile-canvas min-h-screen bg-background">
      <main className="px-4 py-6">
        <section>
          <h1 className="text-2xl font-bold text-foreground">怨쇱젣媛 留롮븘???섎뱾?댁슂???</h1>
          <p className="mt-2 text-base font-semibold text-foreground">援먯닔?섏뿉寃뚮룄 ?뺣컯??媛?대킄??!</p>
          <p className="mt-2 text-sm text-muted-foreground">
            ?뱀떊???대┃???좎닔濡??뱀떊 ?숆낵 援먯닔?섏씠 ?섎뱾?댁쭛?덈떎
          </p>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
            <Image
              src="/new-professor.webp.png"
              alt="과제 압박에 힘들어진 교수님"
              width={864}
              height={1152}
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
          <h2 className="text-base font-semibold text-foreground">?꾩옱 ?꾧뎅 ?쒖씪 ?섎뱺 ?숆낵 TOP 5</h2>
          <p className="mt-1 text-sm text-muted-foreground">珥??대┃ ??湲곗?</p>

          <div className="mt-3 space-y-2">
            {isRankingLoading ? (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                ??궧??遺덈윭?ㅻ뒗 以?..
              </div>
            ) : null}

            {!isRankingLoading && rankingLoadFailed ? (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                ??궧??遺덈윭?ㅼ? 紐삵뻽?댁슂.
              </div>
            ) : null}

            {!isRankingLoading && !rankingLoadFailed && topItems.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                ?쒖떆????궧 ?곗씠?곌? ?놁뼱??
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
