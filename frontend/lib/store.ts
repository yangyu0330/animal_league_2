'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { seedDepartments } from '@/lib/catalog'
import type { ClickActivity, Department, User, UserState } from '@/lib/types'

interface AppState {
  user: User | null
  userState: UserState
  departments: Department[]
  activities: ClickActivity[]
  setUser: (user: User | null) => void
  setUserSchool: (schoolId: string, schoolName: string) => void
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
      departments: seedDepartments,
      activities: [],
      setUser: (user) => {
        set({ user, userState: resolveUserState(user) })
      },
      setUserSchool: (schoolId, schoolName) => {
        set((state) => {
          if (!state.user) return state
          const updatedUser: User = {
            ...state.user,
            selectedSchoolId: schoolId,
            selectedSchoolName: schoolName,
          }
          return {
            user: updatedUser,
            userState: 'ACTIVE_USER',
          }
        })
      },
      clearSession: () => {
        set({
          user: null,
          userState: 'GUEST',
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
      partialize: (state) => ({
        user: state.user,
        userState: state.userState,
        departments: state.departments,
        activities: state.activities,
      }),
    },
  ),
)
