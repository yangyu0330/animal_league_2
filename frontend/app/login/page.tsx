'use client'

import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { signInWithGoogle } from '@/lib/auth/client'

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleGoogleLogin = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const nextPath = new URLSearchParams(window.location.search).get('next')
      await signInWithGoogle(nextPath)
    } catch {
      toast.error('Google login failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mobile-canvas min-h-screen bg-background">
      <main className="px-4 py-10">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h1 className="text-xl font-bold text-foreground">Login and start boosting</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with Google to continue to your department page.
          </p>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="mt-6 h-14 w-full rounded-[14px] bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? 'Redirecting to Google...' : 'Continue with Google'}
          </Button>

          <Link
            href="/"
            className="mt-4 inline-flex text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Back to home
          </Link>
        </section>
      </main>
    </div>
  )
}
