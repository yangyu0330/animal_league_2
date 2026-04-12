'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { MascotCard } from '@/components/mascot-card'
import { PressureBadge } from '@/components/pressure-badge'
import { ApiError } from '@/lib/api/client'
import { clickDepartment, getDepartmentById } from '@/lib/api/departments'
import { signInWithGoogle } from '@/lib/auth/client'
import { getOrCreateDeviceId } from '@/lib/device'
import { calculatePressureLevel, calculateStackCount } from '@/lib/domain'
import { useAppStore } from '@/lib/store'
import type { Department } from '@/lib/types'

export default function DepartmentDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()
  const { userState, user, authLoaded } = useAppStore()
  const [department, setDepartment] = useState<Department | null>(null)
  const [isCountBumping, setIsCountBumping] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isShareRef, setIsShareRef] = useState(false)
  const pendingBoostsRef = useRef(0)
  const optimisticBoostsRef = useRef(0)
  const isFlushingBoostsRef = useRef(false)
  const bumpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const paramsFromUrl = new URLSearchParams(window.location.search)
    setIsShareRef(paramsFromUrl.get('ref') === 'share')
  }, [])

  useEffect(() => {
    if (!id) return
    async function loadDepartment() {
      try {
        const response = await getDepartmentById(id)
        setDepartment(response)
      } catch (error) {
        if (error instanceof ApiError && error.code === 'NOT_FOUND') {
          toast.error('학과를 찾을 수 없습니다.')
          router.replace('/home')
          return
        }
        toast.error('학과 정보를 불러오지 못했습니다.')
      }
    }

    void loadDepartment()
  }, [id, router])

  useEffect(() => {
    if (!authLoaded) return
    if (!id) return
    if (userState === 'GUEST' && !isShareRef) {
      router.replace('/')
      return
    }
    if (userState === 'AUTH_NO_SCHOOL') {
      router.replace(`/onboarding/school?next=${encodeURIComponent(`/departments/${id}`)}`)
    }
  }, [authLoaded, id, isShareRef, router, userState])

  useEffect(() => {
    return () => {
      if (bumpTimeoutRef.current) {
        clearTimeout(bumpTimeoutRef.current)
      }
    }
  }, [])

  const canBoost = user?.selectedDepartmentId === department?.id

  const triggerCountBump = useCallback(() => {
    if (bumpTimeoutRef.current) {
      clearTimeout(bumpTimeoutRef.current)
    }
    setIsCountBumping(true)
    bumpTimeoutRef.current = setTimeout(() => {
      setIsCountBumping(false)
      bumpTimeoutRef.current = null
    }, 300)
  }, [])

  const rollbackOptimisticBoost = useCallback((departmentId: string) => {
    optimisticBoostsRef.current = Math.max(optimisticBoostsRef.current - 1, 0)
    setDepartment((prev) => {
      if (!prev || prev.id !== departmentId) return prev
      const totalClicks = Math.max(prev.totalClicks - 1, 0)
      return {
        ...prev,
        totalClicks,
        stackCount: calculateStackCount(totalClicks),
        pressureLevel: calculatePressureLevel(totalClicks),
        todayClicks: Math.max(prev.todayClicks - 1, 0),
      }
    })
  }, [])

  const flushBoostQueue = useCallback(
    async (departmentId: string) => {
      if (isFlushingBoostsRef.current) return
      isFlushingBoostsRef.current = true
      const deviceId = getOrCreateDeviceId()
      let showedFailureToast = false

      try {
        while (pendingBoostsRef.current > 0) {
          pendingBoostsRef.current -= 1

          try {
            const response = await clickDepartment(departmentId, {
              deviceHash: deviceId,
              refSource: isShareRef ? 'share' : 'direct',
            })

            optimisticBoostsRef.current = Math.max(optimisticBoostsRef.current - 1, 0)
            setDepartment((prev) => {
              if (!prev || prev.id !== departmentId) return prev
              const totalClicks = response.newTotalClicks + optimisticBoostsRef.current
              return {
                ...prev,
                totalClicks,
                stackCount:
                  optimisticBoostsRef.current === 0 ? response.stackCount : calculateStackCount(totalClicks),
                pressureLevel:
                  optimisticBoostsRef.current === 0
                    ? response.pressureLevel
                    : calculatePressureLevel(totalClicks),
                todayClicks: prev.todayClicks,
              }
            })
          } catch (error) {
            rollbackOptimisticBoost(departmentId)
            if (error instanceof ApiError && error.code === 'RATE_LIMITED') {
              if (!showedFailureToast) {
                toast.message('짧은 시간에 클릭이 너무 많아 일부가 제외되었어요.')
                showedFailureToast = true
              }
            } else if (error instanceof ApiError && error.code === 'NOT_FOUND') {
              toast.error('학과를 찾을 수 없습니다.')
              router.replace('/home')
              pendingBoostsRef.current = 0
            } else if (!showedFailureToast) {
              toast.error('일부 클릭 반영에 실패했습니다. 다시 시도해 주세요.')
              setStatusMessage('일부 클릭 반영에 실패했습니다. 다시 시도해 주세요.')
              showedFailureToast = true
            }
          }
        }
      } finally {
        isFlushingBoostsRef.current = false
        if (pendingBoostsRef.current > 0) {
          void flushBoostQueue(departmentId)
        }
      }
    },
    [isShareRef, rollbackOptimisticBoost, router],
  )

  const handleBoost = useCallback(() => {
    if (!department || !canBoost) return
    setStatusMessage(null)
    pendingBoostsRef.current += 1
    optimisticBoostsRef.current += 1
    setDepartment((prev) => {
      if (!prev || prev.id !== department.id) return prev
      const totalClicks = prev.totalClicks + 1
      return {
        ...prev,
        totalClicks,
        stackCount: calculateStackCount(totalClicks),
        pressureLevel: calculatePressureLevel(totalClicks),
        todayClicks: prev.todayClicks + 1,
      }
    })
    triggerCountBump()
    void flushBoostQueue(department.id)
  }, [canBoost, department, flushBoostQueue, triggerCountBump])

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/departments/${id}?ref=share`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${department?.schoolName ?? ''} ${department?.name ?? ''}`,
          text: '학과 압박 상태를 확인해보세요.',
          url: shareUrl,
        })
        return
      } catch {
        // User canceled system share.
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setStatusMessage('공유 링크를 복사했어요.')
      toast.success('공유 링크를 복사했습니다.')
    } catch {
      toast.error('공유 링크 복사에 실패했습니다.')
    }
  }, [department?.name, department?.schoolName, id])

  async function handleContinueLogin() {
    if (!id) return
    try {
      await signInWithGoogle(`/departments/${id}`)
    } catch {
      toast.error('Google login failed. Please try again.')
    }
  }

  if (!id) return null

  if (!department) {
    return (
      <div className="mobile-canvas flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">학과를 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (userState === 'GUEST' && isShareRef) {
    return (
      <div className="mobile-canvas min-h-screen bg-background">
        <header className="px-4 py-5">
          <h1 className="text-lg font-bold text-foreground">{`${department.schoolName} ${department.name}`}</h1>
          <p className="mt-1 text-sm text-muted-foreground">공유 링크로 들어온 학과 미리보기입니다.</p>
        </header>

        <main className="px-4 pb-6">
          <MascotCard
            category={department.category}
            pressureLevel={department.pressureLevel}
            totalClicks={department.totalClicks}
            stackCount={department.stackCount}
          />
        </main>

        <div className="sticky bottom-0 border-t border-border bg-background p-4 safe-bottom">
          <Button
            onClick={handleContinueLogin}
            className="h-14 w-full rounded-[14px] bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            로그인 후 계속
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-canvas min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 border-b border-border bg-background px-4 py-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="-ml-2 rounded-lg p-2 hover:bg-muted" aria-label="뒤로가기">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-foreground">{`${department.schoolName} ${department.name}`}</h1>
            <p className="text-xs text-muted-foreground">오늘 클릭 {department.todayClicks.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <main className="space-y-4 px-4 py-5">
        <MascotCard
          category={department.category}
          pressureLevel={department.pressureLevel}
          totalClicks={department.totalClicks}
          stackCount={department.stackCount}
        />

        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">압박 단계</p>
            <PressureBadge level={department.pressureLevel} size="md" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[11px] text-muted-foreground">총 클릭</p>
              <p className={`number-display text-lg font-bold text-foreground ${isCountBumping ? 'count-bump' : ''}`}>
                {department.totalClicks.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">학생 스택</p>
              <p className={`number-display text-lg font-bold text-foreground ${isCountBumping ? 'count-bump' : ''}`}>
                {department.stackCount}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">오늘 클릭</p>
              <p className="number-display text-lg font-bold text-foreground">{department.todayClicks.toLocaleString()}</p>
            </div>
          </div>
        </section>

        {statusMessage ? <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{statusMessage}</p> : null}
      </main>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[390px] -translate-x-1/2 border-t border-border bg-background p-4 safe-bottom">
        {canBoost ? (
          <Button
            onClick={handleBoost}
            className="h-14 w-full rounded-[14px] bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.99]"
          >
            <Zap className="mr-2 h-5 w-5" />
            압박 올리기
          </Button>
        ) : (
          <p className="text-center text-xs text-muted-foreground">본인 학과에서만 압박 올리기를 사용할 수 있어요.</p>
        )}
        <Button
          variant="outline"
          onClick={handleShare}
          className={`${canBoost ? 'mt-2' : 'mt-3'} h-11 w-full rounded-[14px] border-border bg-transparent text-sm font-semibold text-foreground hover:bg-card`}
        >
          공유하기
        </Button>
      </div>
    </div>
  )
}
