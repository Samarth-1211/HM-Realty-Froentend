import { apiClient } from '@/lib/api-client'
import type { LoginResponse, RefreshResponse } from '@/types'

export interface LoginPayload {
  email: string
  password: string
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>('/auth/login', payload).then((r) => r.data),

  superAdminLogin: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>('/auth/super-admin/login', payload).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<RefreshResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient
      .post<{ success: boolean }>('/auth/logout', { refreshToken })
      .then((r) => r.data),

  verifyEmail: (token: string) =>
    apiClient.post<{ success: boolean }>('/auth/verify-email', { token }).then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient.post<{ success: boolean }>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (payload: { email: string; otp: string; newPassword: string }) =>
    apiClient.post<{ success: boolean }>('/auth/reset-password', payload).then((r) => r.data),
}
