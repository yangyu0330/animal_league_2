'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/app-shell'
import { ApiError } from '@/lib/api/client'
import { getMyActivity } from '@/lib/api/activity'
import { signOut } from '@/lib/auth/client'
import { useAppStore } from '@/lib/store'
import type { ClickActivity } from '@/lib/types'

export default function ActivityPage() {
  const router = useRouter()
  const { userState, user, authLoaded } = useAppStore()
  const [todayCount, setTodayCount] = useState(0)
  const [items, setItems] = useState<ClickActivity[]>([])

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
    if (!authLoaded || userState !== 'ACTIVE_USER') return

    async function loadActivity() {
      try {
        const response = await getMyActivity(20)
        setTodayCount(response.todayCount)
        setItems(response.items)
      } catch (error) {
        if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
          router.replace('/')
          return
        }
        toast.error('내 활동을 불러오지 못했습니다.')
      }
    }

    void loadActivity()
  }, [authLoaded, router, user?.id, userState])

  async function handleSignOut() {
    await signOut()
    router.replace('/')
  }

  if (!authLoaded || userState !== 'ACTIVE_USER') return null

  function formatActivityTime(createdAt: string): string {
    return new Date(createdAt).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  return (
    <AppShell>
      <div className="px-4 py-6">
        <header className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">내 최근 클릭</h1>
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

        <section className="mb-5 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">오늘 클릭 수</p>
          <p className="number-display mt-1 text-3xl font-bold text-primary">{todayCount}</p>
        </section>

        {items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">아직 클릭 기록이 없어요.</p>
          </div>
        ) : (
          <section className="space-y-2">
            {items.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{activity.departmentName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {activity.schoolName} · {formatActivityTime(activity.createdAt)} ·{' '}
                    {activity.accepted ? '랭킹 반영' : '랭킹 제외'}
                  </p>
                </div>
                <Link
                  href={`/departments/${activity.departmentId}`}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  다시 누르기
                </Link>
              </div>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  )
}
