'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { signInWithGoogle } from '@/lib/auth/client'

export default function LoginPage() {
  const startedRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(true)
  const [hasError, setHasError] = useState(false)

  const startGoogleLogin = useCallback(async () => {
    if (startedRef.current) return
    startedRef.current = true
    setIsSubmitting(true)
    setHasError(false)

    try {
      const nextPath = new URLSearchParams(window.location.search).get('next')
      await signInWithGoogle(nextPath)
    } catch {
      toast.error('Google 로그인에 실패했어요. 다시 시도해주세요.')
      setHasError(true)
      setIsSubmitting(false)
      startedRef.current = false
    }
  }, [])

  useEffect(() => {
    void startGoogleLogin()
  }, [startGoogleLogin])

  return (
    <div className="mobile-canvas min-h-screen bg-background">
      <main className="px-4 py-10">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h1 className="text-xl font-bold text-foreground">Google 로그인으로 이동 중...</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            잠시만 기다려주세요.
          </p>

          {hasError ? (
            <Button
              type="button"
              onClick={() => void startGoogleLogin()}
              disabled={isSubmitting}
              className="mt-6 h-14 w-full rounded-[14px] bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? '다시 시도 중...' : '다시 시도'}
            </Button>
          ) : null}

          <Link
            href="/"
            className="mt-4 inline-flex text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            처음으로 돌아가기
          </Link>
        </section>
      </main>
    </div>
  )
}
