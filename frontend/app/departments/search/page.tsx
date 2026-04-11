'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { PressureBadge } from '@/components/pressure-badge'
import { SchoolSelector } from '@/components/school-selector'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api/client'
import { searchDepartments } from '@/lib/api/departments'
import { useAppStore } from '@/lib/store'
import type { SearchDepartmentsResponse } from '@/lib/types'

export default function DepartmentSearchPage() {
  const router = useRouter()
  const { userState, user } = useAppStore()
  const [query, setQuery] = useState('')
  const [schoolFilter, setSchoolFilter] = useState<string | null>(null)
  const [results, setResults] = useState<SearchDepartmentsResponse['items']>([])

  useEffect(() => {
    if (userState === 'GUEST') {
      router.replace('/')
      return
    }
    if (userState === 'AUTH_NO_SCHOOL') {
      router.replace('/onboarding/school')
    }
  }, [router, userState])

  useEffect(() => {
    if (!user?.selectedSchoolId) return
    setSchoolFilter(user.selectedSchoolId)
  }, [user?.selectedSchoolId])

  useEffect(() => {
    async function load() {
      try {
        const response = await searchDepartments({
          q: query,
          schoolId: schoolFilter ?? undefined,
          limit: 20,
        })
        setResults(response.items)
      } catch (error) {
        if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
          router.replace('/')
          return
        }
        toast.error('검색 결과를 불러오지 못했습니다.')
      }
    }

    void load()
  }, [query, router, schoolFilter])

  if (userState !== 'ACTIVE_USER') return null

  return (
    <AppShell>
      <div className="min-h-screen">
        <header className="sticky top-0 z-10 border-b border-border bg-background px-4 py-4">
          <div className="mb-3 flex items-center gap-3">
            <button type="button" onClick={() => router.back()} className="rounded-lg p-2 -ml-2 hover:bg-muted" aria-label="뒤로가기">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">학과 검색</h1>
          </div>

          <div className="mb-2">
            <SchoolSelector value={schoolFilter} onChange={(id, _name) => setSchoolFilter(id)} showAllOption={false} />
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="학과 검색"
              className="h-11 rounded-xl pl-9"
            />
          </div>
        </header>

        <main className="px-4 py-4">
          <p className="mb-3 text-xs text-muted-foreground">결과 {results.length}건</p>
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((department) => (
                <Link
                  key={department.departmentId}
                  href={`/departments/${department.departmentId}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/30"
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-foreground">{department.name}</h2>
                    <p className="truncate text-xs text-muted-foreground">{department.schoolName}</p>
                  </div>
                  <div className="text-right">
                    <p className="number-display text-sm font-semibold text-foreground">{department.totalClicks.toLocaleString()}</p>
                    <p className="number-display text-[11px] text-muted-foreground">스택 {department.stackCount}</p>
                  </div>
                  <PressureBadge level={department.pressureLevel} size="sm" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center">
              <p className="text-muted-foreground">결과가 없나요?</p>
              <Link
                href="/departments/new"
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card"
              >
                <Plus className="h-4 w-4" />
                새 학과 등록
              </Link>
            </div>
          )}
        </main>
      </div>
    </AppShell>
  )
}
