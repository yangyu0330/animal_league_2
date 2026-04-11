import { getSchoolById } from '@/lib/catalog'
import { useAppStore } from '@/lib/store'
import type { User, UserState } from '@/lib/types'

const MOCK_USER_ID = 'user_mock_001'

export async function signInWithGoogle(): Promise<User> {
  const state = useAppStore.getState()
  const existingUser = state.user

  const user: User =
    existingUser ?? {
      id: MOCK_USER_ID,
      email: 'student@example.com',
      name: '학과 압박러',
      selectedSchoolId: null,
      selectedSchoolName: null,
    }

  state.setUser(user)
  return user
}

export async function signOut(): Promise<void> {
  useAppStore.getState().clearSession()
}

export async function getCurrentUser(): Promise<User | null> {
  return useAppStore.getState().user
}

export async function getUserState(): Promise<UserState> {
  return useAppStore.getState().userState
}

export async function selectUserSchool(schoolId: string): Promise<User> {
  const school = getSchoolById(schoolId)
  if (!school) {
    throw new Error('SCHOOL_NOT_FOUND')
  }

  const state = useAppStore.getState()
  if (!state.user) {
    throw new Error('UNAUTHORIZED')
  }

  state.setUserSchool(schoolId, school.name)
  const user = useAppStore.getState().user
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}
