import { apiClient } from '@/lib/api-client'
import type { EmployeeProfile, EmployeeSummary, TeamRollupItem, TeamSummaryItem } from '@/types'

export interface UpdateMyProfilePayload {
  phone?: string
  photoUrl?: string
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

  setEmployeeCode: (userId: string, employeeCode: string) =>
    apiClient.patch<EmployeeProfile>(`/employees/${userId}/employee-code`, { employeeCode }).then((r) => r.data),
}
