'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { searchSchoolsByName } from '@/lib/catalog'
import { selectUserSchool } from '@/lib/auth/client'
import { useAppStore } from '@/lib/store'
import type { School } from '@/lib/types'

export default function SchoolOnboardingPage() {
  const router = useRouter()
  const { userState } = useAppStore()
  const [query, setQuery] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (userState === 'GUEST') {
      router.replace('/')
      return
    }
    if (userState === 'ACTIVE_USER') {
      router.replace('/home')
    }
  }, [router, userState])

  const schools = useMemo(() => searchSchoolsByName(query), [query])

  async function handleComplete() {
    if (!selectedSchool || isSubmitting) return
    setIsSubmitting(true)
    try {
      await selectUserSchool(selectedSchool.id)
      const nextPath = new URLSearchParams(window.location.search).get('next')
      router.push(nextPath ?? '/home')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (userState === 'GUEST') return null

  return (
    <div className="mobile-canvas min-h-screen bg-background">
      <main className="px-4 py-6">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-foreground">학교 선택</h1>
          <p className="mt-1 text-sm text-muted-foreground">현재 학교를 선택하면 홈 랭킹과 검색이 활성화됩니다.</p>
        </header>

        {selectedSchool ? (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm text-primary">
            <Check className="h-4 w-4" />
            <span className="font-semibold">{selectedSchool.name}</span>
            <button
              type="button"
              onClick={() => setSelectedSchool(null)}
              className="rounded-full p-0.5 hover:bg-primary/20"
              aria-label="선택 해제"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}

        <div className="mb-4 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="학교 검색"
            className="h-12 rounded-xl pl-9"
          />
        </div>

        <section className="space-y-2">
          {schools.map((school) => (
            <button
              type="button"
              key={school.id}
              onClick={() => setSelectedSchool(school)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                selectedSchool?.id === school.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <span className="font-medium text-foreground">{school.name}</span>
              {selectedSchool?.id === school.id ? <Check className="h-4 w-4 text-primary" /> : null}
            </button>
          ))}
        </section>
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background p-4 safe-bottom">
        <Button
          onClick={handleComplete}
          disabled={!selectedSchool || isSubmitting}
          className="h-14 w-full rounded-[14px] bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? '학교 적용 중...' : '학교 선택 완료'}
        </Button>
      </div>
    </div>
  )
}
