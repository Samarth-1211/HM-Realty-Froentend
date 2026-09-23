import { apiClient } from '@/lib/api-client'
import type { EmployeeProfile, EmployeeSummary, TeamRollupItem, TeamSummaryItem } from '@/types'

export interface UpdateMyProfilePayload {
  firstName?: string
  lastName?: string
  phone?: string
  photoUrl?: string
}

export interface ChangeEmailPayload {
  newEmail: string
  currentPassword: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export const employeesApi = {
  teamSummary: () =>
    apiClient.get<TeamSummaryItem[]>('/employees/team-summary').then((r) => r.data),

  teamRollup: () =>
    apiClient.get<TeamRollupItem[]>('/employees/team-rollup').then((r) => r.data),

  summary: (userId: string) =>
    apiClient.get<EmployeeSummary>(`/employees/${userId}/summary`).then((r) => r.data),

  profile: (userId: string) =>
    apiClient.get<EmployeeProfile>(`/employees/${userId}/profile`).then((r) => r.data),

  updateMyProfile: (payload: UpdateMyProfilePayload) =>
    apiClient.patch<EmployeeProfile>('/employees/me/profile', payload).then((r) => r.data),

  changeMyEmail: (payload: ChangeEmailPayload) =>
    apiClient.patch<EmployeeProfile>('/employees/me/email', payload).then((r) => r.data),

  changeMyPassword: (payload: ChangePasswordPayload) =>
    apiClient.patch<{ success: boolean }>('/employees/me/password', payload).then((r) => r.data),

  setEmployeeCode: (userId: string, employeeCode: string) =>
    apiClient.patch<EmployeeProfile>(`/employees/${userId}/employee-code`, { employeeCode }).then((r) => r.data),
}
