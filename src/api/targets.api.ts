import { apiClient } from '@/lib/api-client'
import type { TargetDetail, TargetMetric, TargetPeriodType, TargetProgress, TeamTargets } from '@/types'

export interface SetTargetPayload {
  userId: string
  metric: TargetMetric
  targetValue: number
  periodType: TargetPeriodType
  /** A day in the period ("2026-11-26"); the first day for CUSTOM. */
  startDate: string
  /** Last day — CUSTOM only. */
  endDate?: string
}

export interface AddTargetProgressPayload {
  leadIds: string[]
  /** Calls made, or rupees sold — Calls and Sales amount targets only. */
  amount?: number
  note?: string
}

/** Targets overlapping this range ("2026-11-01" to "2026-11-30"); defaults to this month. */
export interface TargetRangeQuery {
  from?: string
  to?: string
}

export const targetsApi = {
  set: (payload: SetTargetPayload) => apiClient.put<TargetProgress>('/targets', payload).then((r) => r.data),

  update: (id: string, targetValue: number) =>
    apiClient.patch<TargetProgress>(`/targets/${id}`, { targetValue }).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/targets/${id}`).then((r) => r.data),

  mine: (query: TargetRangeQuery = {}) =>
    apiClient.get<TargetProgress[]>('/targets/me', { params: query }).then((r) => r.data),

  team: (query: TargetRangeQuery = {}) => apiClient.get<TeamTargets>('/targets/team', { params: query }).then((r) => r.data),

  detail: (id: string) => apiClient.get<TargetDetail>(`/targets/${id}`).then((r) => r.data),

  addProgress: (id: string, payload: AddTargetProgressPayload) =>
    apiClient.post<TargetDetail>(`/targets/${id}/progress`, payload).then((r) => r.data),

  warn: (id: string, message?: string) =>
    apiClient.post<TargetProgress>(`/targets/${id}/warn`, { message }).then((r) => r.data),
}
