import { apiClient } from '@/lib/api-client'
import type { EmployeeSummary, TeamSummaryItem } from '@/types'

export const employeesApi = {
  teamSummary: () =>
    apiClient.get<TeamSummaryItem[]>('/employees/team-summary').then((r) => r.data),

  summary: (userId: string) =>
    apiClient.get<EmployeeSummary>(`/employees/${userId}/summary`).then((r) => r.data),
}
