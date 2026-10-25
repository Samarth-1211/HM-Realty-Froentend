import axios, { AxiosError, type AxiosProgressEvent, type InternalAxiosRequestConfig } from 'axios'
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

// --- 401 handling: one refresh at a time, across all open tabs -------------
//
// Each refresh rotates the refresh token, so two tabs refreshing with the same
// one would get the second rejected and log the user out everywhere. A Web
// Lock makes tabs take turns, and a tab that finds a newer token already saved
// by another tab just uses it.

let refreshInFlight: Promise<string | null> | null = null

/** A new access token, or null when the session has really ended. Throws if the server couldn't be reached. */
async function performRefresh(failedToken: string | undefined): Promise<string | null> {
  const run = async (): Promise<string | null> => {
    await useAuthStore.persist.rehydrate()
    const { accessToken, refreshToken } = useAuthStore.getState()
    if (accessToken && accessToken !== failedToken) return accessToken
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
    } catch (refreshError) {
      // Only a rejected refresh token ends the session; a network blip shouldn't.
      if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
        useAuthStore.getState().clearSession()
        return null
      }
      throw refreshError
    }
  }
  return navigator.locks ? navigator.locks.request('crm-auth-refresh', run) : run()
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
      const failedToken = String(originalRequest.headers.Authorization ?? '').replace(/^Bearer /, '') || undefined

      refreshInFlight ??= performRefresh(failedToken).finally(() => {
        refreshInFlight = null
      })

      let token: string | null
      try {
        token = await refreshInFlight
      } catch {
        return Promise.reject(error)
      }
      if (!token) {
        window.location.assign('/login')
        return Promise.reject(error)
      }
      originalRequest.headers.Authorization = `Bearer ${token}`
      return apiClient(originalRequest)
    }

    return Promise.reject(error)
  },
)

/**
 * POSTs one file as multipart/form-data (field `file`), reporting upload
 * progress as a whole percentage for progress bars.
 */
export function postFile<T>(
  url: string,
  file: File,
  onProgress?: (percent: number) => void,
  /** Extra form fields; an array is sent as the same field repeated. */
  fields: Record<string, string | string[]> = {},
): Promise<T> {
  const form = new FormData()
  form.append('file', file)
  for (const [name, value] of Object.entries(fields)) {
    for (const v of Array.isArray(value) ? value : [value]) form.append(name, v)
  }
  return apiClient
    .post<T>(url, form, {
      // Overrides the JSON default; the browser fills in the multipart boundary.
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (e: AxiosProgressEvent) => onProgress(e.total ? Math.min(100, Math.round((e.loaded / e.total) * 100)) : 0)
        : undefined,
    })
    .then((r) => r.data)
}

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
