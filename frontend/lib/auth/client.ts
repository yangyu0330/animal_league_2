import { getSchoolById } from '@/lib/catalog'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import type { User, UserState } from '@/lib/types'

const MOCK_USER_ID = 'user_mock_001'

export async function signInWithGoogle(): Promise<User> {
  const state = useAppStore.getState()
  const existingUser = state.user

  const user: User =
    existingUser ?? {
      id: MOCK_USER_ID,
      email: 'student@example.com',
      name: 'Student',
      selectedSchoolId: null,
      selectedSchoolName: null,
      selectedDepartmentId: null,
      selectedDepartmentName: null,
    }

  state.setUser(user)
  state.setAuthLoaded(true)
  return user
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

  const department = state.departments.find((item) => item.id === departmentId)
  if (department && department.schoolId !== state.user.selectedSchoolId) {
    throw new Error('SCHOOL_MISMATCH')
  }

  const resolvedName = department?.name ?? departmentName
  if (!resolvedName) {
    throw new Error('DEPARTMENT_NOT_FOUND')
  }

  state.setUserDepartment(departmentId, resolvedName)
  const user = useAppStore.getState().user
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}
