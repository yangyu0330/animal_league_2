'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { categories, getTemplateByCategory } from '@/lib/catalog'
import { ApiError } from '@/lib/api/client'
import { createDepartment } from '@/lib/api/departments'
import { getTemplateIdByCategory, normalizeDepartmentName } from '@/lib/domain'
import { useAppStore } from '@/lib/store'
import type { DepartmentCategory } from '@/lib/types'

export default function NewDepartmentPage() {
  const router = useRouter()
  const { userState, user } = useAppStore()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<DepartmentCategory>('공학')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [duplicateDepartmentId, setDuplicateDepartmentId] = useState<string | null>(null)

  const templatePreview = useMemo(() => getTemplateByCategory(category), [category])
  const normalizedPreview = useMemo(() => normalizeDepartmentName(name), [name])

  useEffect(() => {
    if (userState === 'GUEST') {
      router.replace('/')
      return
    }
    if (userState === 'AUTH_NO_SCHOOL') {
      router.replace('/onboarding/school')
    }
  }, [router, userState])

  if (userState !== 'ACTIVE_USER') return null

  async function handleSubmit() {
    if (!name.trim() || !user?.selectedSchoolId || isSubmitting) return
    setIsSubmitting(true)
    setDuplicateDepartmentId(null)
    try {
      const response = await createDepartment({
        schoolId: user.selectedSchoolId,
        name: name.trim(),
        category,
        templateId: getTemplateIdByCategory(category),
      })

      if (response.created) {
        router.push(`/departments/${response.departmentId}`)
        return
      }

      setDuplicateDepartmentId(response.existingDepartmentId)
      toast.message('이미 등록된 학과가 있어요. 기존 학과로 이동할 수 있습니다.')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        toast.error('학과명과 카테고리를 다시 확인해 주세요.')
      } else {
        toast.error('학과 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mobile-canvas min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background px-4 py-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg p-2 -ml-2 hover:bg-muted" aria-label="뒤로가기">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">새 학과 등록</h1>
        </div>
      </header>

      <main className="space-y-6 px-4 py-6">
        <section>
          <p className="mb-2 text-sm font-medium text-foreground">학교</p>
          <div className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">{user?.selectedSchoolName}</div>
        </section>

        <section>
          <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="departmentName">
            학과명
          </label>
          <Input
            id="departmentName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="예: 컴퓨터공학과"
            className="h-12 rounded-xl"
          />
          {name.trim() ? (
            <p className="mt-2 text-xs text-muted-foreground">정규화 키 미리보기: {normalizedPreview}</p>
          ) : null}
        </section>

        <section>
          <p className="mb-2 text-sm font-medium text-foreground">카테고리 선택</p>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors ${
                  item === category ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-foreground hover:border-primary/30'
                }`}
              >
                {item}
                {item === category ? <Check className="h-4 w-4" /> : null}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">템플릿 미리보기</p>
          <h2 className="mt-1 text-base font-semibold text-foreground">{templatePreview.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{templatePreview.description}</p>
        </section>

        {duplicateDepartmentId ? (
          <section className="rounded-xl border border-pressure-3/70 bg-pressure-1/50 p-3">
            <p className="text-sm font-medium text-foreground">이미 등록된 학과예요.</p>
            <Link href={`/departments/${duplicateDepartmentId}`} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
              기존 학과 바로 열기
            </Link>
          </section>
        ) : null}
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background p-4 safe-bottom">
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || isSubmitting}
          className="h-14 w-full rounded-[14px] bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? '등록 중...' : '등록하고 바로 시작'}
        </Button>
      </div>
    </div>
  )
}
