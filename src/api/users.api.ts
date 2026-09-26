import { apiClient } from '@/lib/api-client'
import type { DeleteUserPayload, DeletionImpact, User, UserRole } from '@/types'

export interface CreateUserPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  role: UserRole
  managerId?: string
}

export const usersApi = {
  /** `deleted` lists the archive of deleted accounts instead (Admins only). */
  list: (deleted = false) =>
    apiClient.get<User[]>('/users', { params: deleted ? { deleted: true } : undefined }).then((r) => r.data),

  get: (id: string) => apiClient.get<User>(`/users/${id}`).then((r) => r.data),

  create: (payload: CreateUserPayload) =>
    apiClient.post<User>('/users', payload).then((r) => r.data),

  deactivate: (id: string) =>
    apiClient.patch<User>(`/users/${id}/deactivate`).then((r) => r.data),

  reactivate: (id: string) =>
    apiClient.patch<User>(`/users/${id}/reactivate`).then((r) => r.data),

  deletionImpact: (id: string) =>
    apiClient.get<DeletionImpact>(`/users/${id}/deletion-impact`).then((r) => r.data),

  remove: (id: string, payload: DeleteUserPayload) =>
    apiClient
      .delete<{ message: string; id: string }>(`/users/${id}`, {
        data: { confirmation: 'delete', ...payload },
      })
      .then((r) => r.data),
}
