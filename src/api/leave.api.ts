import { apiClient } from '@/lib/api-client'
import type { LeaveRequest } from '@/types'

export interface ApplyLeavePayload {
  startDate: string
  endDate: string
  reason: string
}

export interface ReviewLeavePayload {
  comment?: string
}

export const leaveApi = {
  apply: (payload: ApplyLeavePayload) =>
    apiClient.post<LeaveRequest>('/leave/apply', payload).then((r) => r.data),

  mine: () => apiClient.get<LeaveRequest[]>('/leave/me').then((r) => r.data),

  teamPending: () => apiClient.get<LeaveRequest[]>('/leave/team/pending').then((r) => r.data),

  approve: (id: string, payload: ReviewLeavePayload = {}) =>
    apiClient.patch<LeaveRequest>(`/leave/${id}/approve`, payload).then((r) => r.data),

  reject: (id: string, payload: ReviewLeavePayload = {}) =>
    apiClient.patch<LeaveRequest>(`/leave/${id}/reject`, payload).then((r) => r.data),
}
