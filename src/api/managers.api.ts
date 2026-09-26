import { apiClient } from '@/lib/api-client'
import type { EmailDeliveryStatus, ManagerSummary, User } from '@/types'

export interface CreateManagerPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
}

export interface UpdateManagerPayload {
  email?: string
  firstName?: string
  lastName?: string
  /** null clears the stored number. */
  phone?: string | null
}

export const managersApi = {
  list: () => apiClient.get<ManagerSummary[]>('/managers').then((r) => r.data),

  get: (id: string) => apiClient.get<User>(`/managers/${id}`).then((r) => r.data),

  create: (payload: CreateManagerPayload) =>
    apiClient.post<User>('/managers', payload).then((r) => r.data),

  /** emailDelivery is present only when the email changed and a verification link was sent. */
  update: (id: string, payload: UpdateManagerPayload) =>
    apiClient
      .patch<User & { emailDelivery?: EmailDeliveryStatus }>(`/managers/${id}`, payload)
      .then((r) => r.data),

  deactivate: (id: string) =>
    apiClient
      .patch<{ message: string; id: string }>(`/managers/${id}/deactivate`)
      .then((r) => r.data),

  reactivate: (id: string) =>
    apiClient
      .patch<{ message: string; id: string }>(`/managers/${id}/reactivate`)
      .then((r) => r.data),

  resendVerification: (id: string) =>
    apiClient.post<{ success: boolean }>(`/managers/${id}/resend-verification`).then((r) => r.data),
}
