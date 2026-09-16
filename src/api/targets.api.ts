import { apiClient } from '@/lib/api-client'
import type { Target, TargetMetric, TargetProgress } from '@/types'

export interface SetTargetPayload {
  userId: string
  periodYear: number
  periodMonth: number
  metric: TargetMetric
  targetValue: number
}

export interface TargetPeriodQuery {
  year?: number
  month?: number
}

export const targetsApi = {
  set: (payload: SetTargetPayload) => apiClient.put<Target>('/targets', payload).then((r) => r.data),

  mine: (query: TargetPeriodQuery = {}) =>
    apiClient.get<TargetProgress>('/targets/me', { params: query }).then((r) => r.data),

  team: (query: TargetPeriodQuery = {}) =>
    apiClient.get<TargetProgress[]>('/targets/team', { params: query }).then((r) => r.data),
}
