import { fetchJson } from '@/lib/api/client'
import type { MyActivityResponse } from '@/lib/types'

interface ClaimTitleResponse {
  awarded: boolean
  titleKey: string
  reason?: string
}

interface SelectTitleResponse {
  selectedTitleKey: string | null
}

export async function getMyActivity(): Promise<MyActivityResponse> {
  return fetchJson<MyActivityResponse>('/api/me/activity')
}

export async function claimMyTitle(titleKey: string): Promise<ClaimTitleResponse> {
  return fetchJson<ClaimTitleResponse>('/api/me/titles/claim', {
    method: 'POST',
    body: JSON.stringify({ titleKey }),
  })
}

export async function selectMyTitle(titleKey: string | null): Promise<SelectTitleResponse> {
  return fetchJson<SelectTitleResponse>('/api/me/title', {
    method: 'PATCH',
    body: JSON.stringify({ titleKey }),
  })
}
