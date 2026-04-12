'use client'

import { useState } from 'react'
import { toast } from 'sonner'
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
    <main>
      <button type="button" onClick={handleGoogleLogin} disabled={isSubmitting}>
        {isSubmitting ? 'Redirecting...' : 'Sign in with Google'}
      </button>
    </main>
  )
}
