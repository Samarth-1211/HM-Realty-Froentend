import { apiClient } from '@/lib/api-client'
import { waDebug } from '@/lib/wa-debug-logger'
import type { LeadStatus, WhatsAppMessage, WhatsAppThread } from '@/types'

export interface WhatsAppInboxItem {
  id: string
  fullName: string
  phone: string
  status: LeadStatus
  assignedTo: { id: string; firstName: string; lastName: string } | null
  lastMessage: WhatsAppMessage | null
  /** Inbound messages since the current user last opened this thread. */
  unreadCount: number
}

export interface WhatsAppTemplate {
  name: string
  language: string
  category: string | null
  body: string
  /** False when the template needs {{variables}} or a media header — those can't be sent from the chat as-is. */
  sendable: boolean
}

// Every call goes through waDebug.track so it shows up in the WhatsApp
// Debug Console's frontend log.
export const whatsappChatApi = {
  listInbox: () =>
    waDebug.track('GET /whatsapp/inbox', () => apiClient.get<WhatsAppInboxItem[]>('/whatsapp/inbox').then((r) => r.data)),

  listMessages: (leadId: string) =>
    waDebug.track('GET thread', () =>
      apiClient.get<WhatsAppThread>(`/leads/${leadId}/whatsapp/messages`).then((r) => r.data),
    ),

  sendMessage: (leadId: string, text: string) =>
    waDebug.track('POST message', () =>
      apiClient.post<WhatsAppMessage>(`/leads/${leadId}/whatsapp/messages`, { text }).then((r) => r.data),
    ),

  markRead: (leadId: string) =>
    waDebug.track('POST read', () => apiClient.post(`/leads/${leadId}/whatsapp/read`).then((r) => r.data)),

  /** The attachment as a Blob — it needs the auth header, so it can't be a plain <img src>. */
  fetchMedia: (leadId: string, messageId: string) =>
    waDebug.track('GET media', () =>
      apiClient
        .get<Blob>(`/leads/${leadId}/whatsapp/messages/${messageId}/media`, { responseType: 'blob' })
        .then((r) => r.data),
    ),

  listTemplates: () =>
    waDebug.track('GET /whatsapp/templates', () =>
      apiClient.get<WhatsAppTemplate[]>('/whatsapp/templates').then((r) => r.data),
    ),

  sendTemplate: (leadId: string, templateName: string, languageCode: string) =>
    waDebug.track('POST template', () =>
      apiClient
        .post<WhatsAppMessage>(`/leads/${leadId}/whatsapp/template`, { templateName, languageCode })
        .then((r) => r.data),
    ),
}
