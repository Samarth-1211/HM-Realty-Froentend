import { apiClient } from '@/lib/api-client'
import type { WhatsAppIntegration } from '@/types'

export interface ConnectWhatsAppIntegrationPayload {
  wabaId: string
  phoneNumberId: string
  accessToken: string
  displayPhoneNumber?: string
  businessManagerId?: string
  businessName?: string
}

export interface UpdateWhatsAppIntegrationPayload {
  accessToken?: string
  displayPhoneNumber?: string
  businessManagerId?: string
  businessName?: string
  isActive?: boolean
}

export const whatsappIntegrationApi = {
  get: () => apiClient.get<WhatsAppIntegration>('/integrations/whatsapp').then((r) => r.data),

  connect: (payload: ConnectWhatsAppIntegrationPayload) =>
    apiClient.post<WhatsAppIntegration>('/integrations/whatsapp', payload).then((r) => r.data),

  update: (payload: UpdateWhatsAppIntegrationPayload) =>
    apiClient.patch<WhatsAppIntegration>('/integrations/whatsapp', payload).then((r) => r.data),

  revealVerifyToken: () =>
    apiClient.post<WhatsAppIntegration>('/integrations/whatsapp/reveal-verify-token').then((r) => r.data),

  enable: () => apiClient.post<WhatsAppIntegration>('/integrations/whatsapp/enable').then((r) => r.data),

  disable: () => apiClient.delete<WhatsAppIntegration>('/integrations/whatsapp').then((r) => r.data),
}
