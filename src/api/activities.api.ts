import { apiClient } from '@/lib/api-client'
import type { EmployeeActivity, EmployeeActivityType, TeamActivityItem } from '@/types'

export interface LogActivityPayload {
  type: EmployeeActivityType
  description?: string
  leadId?: string
}

export const activitiesApi = {
  log: (payload: LogActivityPayload) =>
    apiClient.post<EmployeeActivity>('/activities', payload).then((r) => r.data),

  mine: (date?: string) =>
    apiClient.get<EmployeeActivity[]>('/activities/me', { params: { date } }).then((r) => r.data),

  team: (date?: string) =>
    apiClient.get<TeamActivityItem[]>('/activities/team', { params: { date } }).then((r) => r.data),

  org: (date?: string) =>
    apiClient.get<TeamActivityItem[]>('/activities/org', { params: { date } }).then((r) => r.data),
}
