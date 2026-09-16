import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '@/lib/constants'
import { useAuthStore } from '@/store/auth-store'
import type { ApiErrorShape, RefreshResponse } from '@/types'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- 401 handling: single-flight refresh, queue concurrent requests --------

let isRefreshing = false
let refreshWaiters: Array<(token: string | null) => void> = []

function subscribeToRefresh(cb: (token: string | null) => void) {
  refreshWaiters.push(cb)
}

function notifyRefreshed(token: string | null) {
  refreshWaiters.forEach((cb) => cb(token))
  refreshWaiters = []
}

async function performRefresh(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) return null
  try {
    const { data } = await axios.post<RefreshResponse>(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    })
    useAuthStore.getState().setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    })
    return data.accessToken
  } catch {
    useAuthStore.getState().clearSession()
    return null
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined

    const status = error.response?.status
    const url = originalRequest?.url ?? ''
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/refresh')

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true

      if (!isRefreshing) {
        isRefreshing = true
        const newToken = await performRefresh()
        isRefreshing = false
        notifyRefreshed(newToken)
        if (!newToken) {
          window.location.assign('/login')
          return Promise.reject(error)
        }
      }

      return new Promise((resolve, reject) => {
        subscribeToRefresh((token) => {
          if (!token) {
            reject(error)
            return
          }
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(apiClient(originalRequest))
        })
      })
    }

    return Promise.reject(error)
  },
)

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorShape | undefined
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message
    }
    if (error.message) return error.message
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
