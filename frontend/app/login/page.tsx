'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleGoogleLogin = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
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
