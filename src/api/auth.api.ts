import { apiClient } from '@/lib/api-client'
import type { LoginResponse, RefreshResponse } from '@/types'

export interface LoginPayload {
  email: string
  password: string
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>('/auth/login', payload).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<RefreshResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient
      .post<{ success: boolean }>('/auth/logout', { refreshToken })
      .then((r) => r.data),
}
