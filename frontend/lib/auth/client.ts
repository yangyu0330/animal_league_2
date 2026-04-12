import { fetchJson } from '@/lib/api/client'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import type { User, UserState } from '@/lib/types'

interface ProfileResponse {
  user: User
}

function sanitizeNextPath(nextPath?: string | null): string | null {
  if (!nextPath) return null
  if (!nextPath.startsWith('/')) return null
  if (nextPath.startsWith('//')) return null
  return nextPath
}

function getCallbackUrl(nextPath?: string | null): string {
  const callbackUrl = new URL('/auth/callback', location.origin)
  const safeNextPath = sanitizeNextPath(nextPath)
  if (safeNextPath) {
    callbackUrl.searchParams.set('next', safeNextPath)
  }
  return callbackUrl.toString()
}

async function patchProfile(payload: { schoolId: string; departmentId?: string | null }) {
  return fetchJson<ProfileResponse>('/api/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

function requireSavedUser(
  response: ProfileResponse,
  expected: { schoolId: string; departmentId?: string | null },
): User {
  if (!response.user) {
    throw new Error('PROFILE_SAVE_FAILED')
  }
  if (response.user.selectedSchoolId !== expected.schoolId) {
    throw new Error('PROFILE_SAVE_MISMATCH')
  }
  if (
    Object.prototype.hasOwnProperty.call(expected, 'departmentId') &&
    response.user.selectedDepartmentId !== (expected.departmentId ?? null)
  ) {
    throw new Error('PROFILE_SAVE_MISMATCH')
  }
  return response.user
}

export async function signInWithGoogle(nextPath?: string | null): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getCallbackUrl(nextPath),
    },
  })

  if (error) {
    throw error
  }
}

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  useAppStore.getState().clearSession()
}

export async function getCurrentUser(): Promise<User | null> {
  return useAppStore.getState().user
}

export async function getUserState(): Promise<UserState> {
  return useAppStore.getState().userState
}

export async function selectUserSchool(schoolId: string, schoolName?: string): Promise<User> {
  const normalizedSchoolId = schoolId.trim()
  if (!normalizedSchoolId) {
    throw new Error('SCHOOL_NOT_FOUND')
  }

  const state = useAppStore.getState()
  if (!state.user) {
    throw new Error('UNAUTHORIZED')
  }

  const schoolChanged = state.user.selectedSchoolId !== normalizedSchoolId
  const nextDepartmentId = schoolChanged ? null : state.user.selectedDepartmentId
  const response = await patchProfile({
    schoolId: normalizedSchoolId,
    departmentId: nextDepartmentId,
  })
  const savedUser = requireSavedUser(response, {
    schoolId: normalizedSchoolId,
    departmentId: nextDepartmentId,
  })

  state.setUser(savedUser)

  const user = useAppStore.getState().user
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

export async function selectUserDepartment(
  departmentId: string,
  departmentName?: string,
): Promise<User> {
  const state = useAppStore.getState()
  if (!state.user) {
    throw new Error('UNAUTHORIZED')
  }
  if (!state.user.selectedSchoolId) {
    throw new Error('SCHOOL_NOT_SELECTED')
  }

  const response = await patchProfile({
    schoolId: state.user.selectedSchoolId,
    departmentId,
  })
  const savedUser = requireSavedUser(response, {
    schoolId: state.user.selectedSchoolId,
    departmentId,
  })

  state.setUser(savedUser)

  const user = useAppStore.getState().user
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}
