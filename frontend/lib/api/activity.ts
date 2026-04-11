import { useAppStore } from '@/lib/store'
import { fetchJson, useMockApi } from '@/lib/api/client'
import type { MyActivityResponse } from '@/lib/types'

function isSameDay(lhs: Date, rhs: Date): boolean {
  return (
    lhs.getFullYear() === rhs.getFullYear() &&
    lhs.getMonth() === rhs.getMonth() &&
    lhs.getDate() === rhs.getDate()
  )
}

export async function getMyActivity(limit = 20): Promise<MyActivityResponse> {
  if (!useMockApi()) {
    return fetchJson<MyActivityResponse>(`/api/me/activity?limit=${limit}`)
  }

  const now = new Date()
  const activities = useAppStore.getState().activities
  const todayCount = activities.filter((activity) => activity.accepted && isSameDay(new Date(activity.createdAt), now)).length

  return {
    todayCount,
    items: [...activities].slice(0, limit),
  }
}
