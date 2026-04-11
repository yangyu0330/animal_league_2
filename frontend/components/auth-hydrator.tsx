'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import type { User } from '@/lib/types'

interface MeResponse {
  user: User | null
}

export function AuthHydrator() {
  const setUser = useAppStore((state) => state.setUser)
  const setAuthLoaded = useAppStore((state) => state.setAuthLoaded)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function syncAuthState() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (cancelled) return

        if (error || !user) {
          setUser(null)
          setAuthLoaded(true)
          return
        }

        try {
          const response = await fetch('/api/me', { cache: 'no-store' })
          if (response.ok) {
            const payload = (await response.json()) as MeResponse
            if (!cancelled && payload.user) {
              setUser(payload.user)
              setAuthLoaded(true)
              return
            }
          }
        } catch (requestError) {
          console.error('[AuthHydrator] failed to fetch /api/me', requestError)
        }

        const fallbackName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'user'

        setUser({
          id: user.id,
          email: user.email ?? '',
          name: fallbackName,
          selectedSchoolId: null,
          selectedSchoolName: null,
          selectedDepartmentId: null,
          selectedDepartmentName: null,
        })
      } finally {
        if (!cancelled) {
          setAuthLoaded(true)
        }
      }
    }

    void syncAuthState()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncAuthState()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [setAuthLoaded, setUser])

  return null
}
