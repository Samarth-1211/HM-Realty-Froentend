import { apiClient } from '@/lib/api-client'
import type { User, UserRole } from '@/types'

export interface CreateUserPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  managerId?: string
}

export const usersApi = {
  list: () => apiClient.get<User[]>('/users').then((r) => r.data),

  get: (id: string) => apiClient.get<User>(`/users/${id}`).then((r) => r.data),

  create: (payload: CreateUserPayload) =>
    apiClient.post<User>('/users', payload).then((r) => r.data),

  deactivate: (id: string) =>
    apiClient.patch<User>(`/users/${id}/deactivate`).then((r) => r.data),

  remove: (id: string, reason?: string) =>
    apiClient
      .delete<{ message: string; id: string }>(`/users/${id}`, {
        data: { confirmation: 'delete', ...(reason ? { reason } : {}) },
      })
      .then((r) => r.data),
}
