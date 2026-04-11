'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { seedDepartments } from '@/lib/catalog'
import type { ClickActivity, Department, User, UserState } from '@/lib/types'

interface AppState {
  user: User | null
  userState: UserState
  authLoaded: boolean
  departments: Department[]
  activities: ClickActivity[]
  setUser: (user: User | null) => void
  setAuthLoaded: (loaded: boolean) => void
  setUserSchool: (schoolId: string, schoolName: string) => void
  setUserDepartment: (departmentId: string, departmentName: string) => void
  clearSession: () => void
  setDepartments: (departments: Department[]) => void
  addDepartment: (department: Department) => void
  updateDepartment: (departmentId: string, updater: (department: Department) => Department) => void
  addActivity: (activity: ClickActivity) => void
}

function resolveUserState(user: User | null): UserState {
  if (!user) return 'GUEST'
  return user.selectedSchoolId ? 'ACTIVE_USER' : 'AUTH_NO_SCHOOL'
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      userState: 'GUEST',
      authLoaded: false,
      departments: seedDepartments,
      activities: [],
      setUser: (user) => {
        set({ user, userState: resolveUserState(user) })
      },
      setAuthLoaded: (authLoaded) => {
        set({ authLoaded })
      },
      setUserSchool: (schoolId, schoolName) => {
        set((state) => {
          if (!state.user) return state
          const schoolChanged = state.user.selectedSchoolId !== schoolId
          const updatedUser: User = {
            ...state.user,
            selectedSchoolId: schoolId,
            selectedSchoolName: schoolName,
            selectedDepartmentId: schoolChanged ? null : state.user.selectedDepartmentId,
            selectedDepartmentName: schoolChanged ? null : state.user.selectedDepartmentName,
          }
          return {
            user: updatedUser,
            userState: resolveUserState(updatedUser),
          }
        })
      },
      setUserDepartment: (departmentId, departmentName) => {
        set((state) => {
          if (!state.user) return state
          const updatedUser: User = {
            ...state.user,
            selectedDepartmentId: departmentId,
            selectedDepartmentName: departmentName,
          }
          return {
            user: updatedUser,
            userState: resolveUserState(updatedUser),
          }
        })
      },
      clearSession: () => {
        set({
          user: null,
          userState: 'GUEST',
          authLoaded: true,
          activities: [],
        })
      },
      setDepartments: (departments) => {
        set({ departments })
      },
      addDepartment: (department) => {
        set((state) => ({ departments: [...state.departments, department] }))
      },
      updateDepartment: (departmentId, updater) => {
        set((state) => ({
          departments: state.departments.map((department) =>
            department.id === departmentId ? updater(department) : department,
          ),
        }))
      },
      addActivity: (activity) => {
        set((state) => ({
          activities: [activity, ...state.activities].slice(0, 100),
        }))
      },
    }),
    {
      name: 'department-pressure-state-v1',
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as AppState
        const user = state?.user
        const normalizedUser: User | null = user
          ? {
              ...user,
              selectedDepartmentId: user.selectedDepartmentId ?? null,
              selectedDepartmentName: user.selectedDepartmentName ?? null,
            }
          : null

        return {
          ...state,
          user: normalizedUser,
          userState: resolveUserState(normalizedUser),
          authLoaded: false,
        }
      },
      partialize: (state) => ({
        user: state.user,
        userState: state.userState,
        departments: state.departments,
        activities: state.activities,
      }),
    },
  ),
)
