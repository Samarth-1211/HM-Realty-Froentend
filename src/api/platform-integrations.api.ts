import { apiClient } from '@/lib/api-client'
import type { LeadSource, PlatformIntegration } from '@/types'

export interface CreatePlatformIntegrationPayload {
  platform: LeadSource
  rmName?: string
  rmEmail?: string
  rmPhone?: string
}

export interface UpdatePlatformIntegrationPayload {
  rmName?: string
  rmEmail?: string
  rmPhone?: string
  isActive?: boolean
  fieldMapping?: Record<string, string>
}

export const platformIntegrationsApi = {
  list: () => apiClient.get<PlatformIntegration[]>('/platform-integrations').then((r) => r.data),

  get: (id: string) =>
    apiClient.get<PlatformIntegration>(`/platform-integrations/${id}`).then((r) => r.data),

  create: (payload: CreatePlatformIntegrationPayload) =>
    apiClient.post<PlatformIntegration>('/platform-integrations', payload).then((r) => r.data),

  revealSecret: (id: string) =>
    apiClient
      .post<PlatformIntegration>(`/platform-integrations/${id}/reveal-secret`)
      .then((r) => r.data),

  update: (id: string, payload: UpdatePlatformIntegrationPayload) =>
    apiClient.patch<PlatformIntegration>(`/platform-integrations/${id}`, payload).then((r) => r.data),

  deactivate: (id: string) =>
    apiClient.delete<PlatformIntegration>(`/platform-integrations/${id}`).then((r) => r.data),
}
