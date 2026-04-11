'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Plus, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getSchoolById, searchSchoolsByName } from '@/lib/catalog'
import { searchDepartments } from '@/lib/api/departments'
import { selectUserDepartment, selectUserSchool } from '@/lib/auth/client'
import { ApiError } from '@/lib/api/client'
import { useAppStore } from '@/lib/store'
import type { School, SearchDepartmentsResponse } from '@/lib/types'

interface SelectedDepartment {
  id: string
  name: string
}

export default function SchoolOnboardingPage() {
  const router = useRouter()
  const { userState, user, authLoaded } = useAppStore()
  const [schoolQuery, setSchoolQuery] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [departmentQuery, setDepartmentQuery] = useState('')
  const [departmentResults, setDepartmentResults] = useState<SearchDepartmentsResponse['items']>([])
  const [selectedDepartment, setSelectedDepartment] = useState<SelectedDepartment | null>(null)
  const [isDepartmentLoading, setIsDepartmentLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isEditMode, setIsEditMode] = useState(false)
  const [nextPath, setNextPath] = useState<string | null>(null)
  const [isQueryReady, setIsQueryReady] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setIsEditMode(params.get('mode') === 'edit')
    setNextPath(params.get('next'))
    setIsQueryReady(true)
  }, [])

  useEffect(() => {
    if (!authLoaded) return
    if (!isQueryReady) return
    if (userState === 'GUEST') {
      router.replace('/')
      return
    }
    if (userState === 'ACTIVE_USER' && !isEditMode) {
      router.replace('/home')
    }
  }, [authLoaded, isEditMode, isQueryReady, router, userState])

  useEffect(() => {
    if (!user) return
    if (user.selectedSchoolId) {
      const school = getSchoolById(user.selectedSchoolId)
      if (school) {
        setSelectedSchool(school)
      }
    }
    if (user.selectedDepartmentId && user.selectedDepartmentName) {
      setSelectedDepartment({
        id: user.selectedDepartmentId,
        name: user.selectedDepartmentName,
      })
      setDepartmentQuery(user.selectedDepartmentName)
    }
  }, [user])

  const schools = useMemo(() => searchSchoolsByName(schoolQuery), [schoolQuery])

  useEffect(() => {
    if (!selectedSchool?.id) {
      setDepartmentResults([])
      return
    }
    const selectedSchoolId = selectedSchool.id

    let cancelled = false
    async function loadDepartments() {
      setIsDepartmentLoading(true)
      try {
        const response = await searchDepartments({
          q: departmentQuery,
          schoolId: selectedSchoolId,
          limit: 20,
        })
        if (!cancelled) {
          setDepartmentResults(response.items)
        }
      } catch (error) {
        if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
          router.replace('/')
          return
        }
        toast.error('학과 목록을 불러오지 못했습니다.')
      } finally {
        if (!cancelled) {
          setIsDepartmentLoading(false)
        }
      }
    }

    void loadDepartments()
    return () => {
      cancelled = true
    }
  }, [departmentQuery, router, selectedSchool?.id])

  function handleSchoolSelect(school: School) {
    setSelectedSchool(school)
    setSchoolQuery(school.name)
    if (selectedDepartment) {
      setSelectedDepartment(null)
      setDepartmentQuery('')
    }
  }

  function handleDepartmentSelect(item: SearchDepartmentsResponse['items'][number]) {
    setSelectedDepartment({
      id: item.departmentId,
      name: item.name,
    })
    setDepartmentQuery(item.name)
  }

  async function handleCreateDepartment() {
    if (!selectedSchool || isSubmitting) return
    setIsSubmitting(true)
    try {
      if (user?.selectedSchoolId !== selectedSchool.id) {
        await selectUserSchool(selectedSchool.id)
      }
      const fallbackNext = nextPath ?? '/home'
      router.push(`/departments/new?next=${encodeURIComponent(fallbackNext)}`)
    } catch {
      toast.error('학교 선택을 저장하지 못했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleComplete() {
    if (!selectedSchool || !selectedDepartment || isSubmitting) return
    setIsSubmitting(true)
    try {
      if (user?.selectedSchoolId !== selectedSchool.id) {
        await selectUserSchool(selectedSchool.id)
      }
      await selectUserDepartment(selectedDepartment.id, selectedDepartment.name)
      router.push(nextPath ?? '/home')
    } catch {
      toast.error('학교/학과 저장에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!authLoaded || userState === 'GUEST') return null

  return (
    <div className="mobile-canvas min-h-screen bg-background">
      <main className="px-4 py-6">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-foreground">{isEditMode ? '학교/학과 수정' : '학교와 학과 선택'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">본인 학과에서만 압박 올리기를 사용할 수 있습니다.</p>
        </header>

        {selectedSchool ? (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm text-primary">
            <Check className="h-4 w-4" />
            <span className="font-semibold">{selectedSchool.name}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedSchool(null)
                setSelectedDepartment(null)
                setDepartmentQuery('')
              }}
              className="rounded-full p-0.5 hover:bg-primary/20"
              aria-label="학교 선택 해제"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}

        <div className="mb-4 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={schoolQuery}
            onChange={(event) => setSchoolQuery(event.target.value)}
            placeholder="학교 검색"
            className="h-12 rounded-xl pl-9"
          />
        </div>

        <section className="mb-6 space-y-2">
          {schools.map((school) => (
            <button
              type="button"
              key={school.id}
              onClick={() => handleSchoolSelect(school)}
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

        <section>
          <p className="mb-2 text-sm font-medium text-foreground">학과 선택</p>
          {!selectedSchool ? (
            <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              먼저 학교를 선택해 주세요.
            </p>
          ) : (
            <>
              {selectedDepartment ? (
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm text-primary">
                  <Check className="h-4 w-4" />
                  <span className="font-semibold">{selectedDepartment.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDepartment(null)}
                    className="rounded-full p-0.5 hover:bg-primary/20"
                    aria-label="학과 선택 해제"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : null}

              <div className="mb-3 relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={departmentQuery}
                  onChange={(event) => setDepartmentQuery(event.target.value)}
                  placeholder="학과 검색"
                  className="h-12 rounded-xl pl-9"
                />
              </div>

              {isDepartmentLoading ? (
                <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                  학과를 불러오는 중...
                </p>
              ) : departmentResults.length === 0 ? (
                <div className="rounded-xl border border-border bg-card px-4 py-4">
                  <p className="text-sm text-muted-foreground">결과가 없나요?</p>
                  <button
                    type="button"
                    onClick={handleCreateDepartment}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    <Plus className="h-4 w-4" />
                    새 학과 등록
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {departmentResults.map((item) => (
                    <button
                      type="button"
                      key={item.departmentId}
                      onClick={() => handleDepartmentSelect(item)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                        selectedDepartment?.id === item.departmentId
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{item.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.schoolName}</p>
                      </div>
                      {selectedDepartment?.id === item.departmentId ? <Check className="h-4 w-4 text-primary" /> : null}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background p-4 safe-bottom">
        <Button
          onClick={handleComplete}
          disabled={!selectedSchool || !selectedDepartment || isSubmitting}
          className="h-14 w-full rounded-[14px] bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? '저장 중...' : '학교/학과 선택 완료'}
        </Button>
      </div>
    </div>
  )
}
