import { apiClient } from '@/lib/api-client'
import type { ManagerSummary, User } from '@/types'

export interface CreateManagerPayload {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface UpdateManagerPayload {
  email?: string
  firstName?: string
  lastName?: string
}

export const managersApi = {
  list: () => apiClient.get<ManagerSummary[]>('/managers').then((r) => r.data),

  get: (id: string) => apiClient.get<User>(`/managers/${id}`).then((r) => r.data),

  create: (payload: CreateManagerPayload) =>
    apiClient.post<User>('/managers', payload).then((r) => r.data),

  update: (id: string, payload: UpdateManagerPayload) =>
    apiClient.patch<User>(`/managers/${id}`, payload).then((r) => r.data),

  deactivate: (id: string) =>
    apiClient
      .patch<{ message: string; id: string }>(`/managers/${id}/deactivate`)
      .then((r) => r.data),

  reactivate: (id: string) =>
    apiClient
      .patch<{ message: string; id: string }>(`/managers/${id}/reactivate`)
      .then((r) => r.data),

  remove: (id: string, reason?: string) =>
    apiClient
      .delete<{ message: string; id: string }>(`/managers/${id}`, {
        data: { confirmation: 'delete', ...(reason ? { reason } : {}) },
      })
      .then((r) => r.data),

  resendVerification: (id: string) =>
    apiClient.post<{ success: boolean }>(`/managers/${id}/resend-verification`).then((r) => r.data),
}
