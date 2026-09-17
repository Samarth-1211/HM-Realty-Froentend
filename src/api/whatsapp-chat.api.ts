import { apiClient } from '@/lib/api-client'
import type { LeadStatus, WhatsAppMessage, WhatsAppThread } from '@/types'

export interface WhatsAppInboxItem {
  id: string
  fullName: string
  phone: string
  status: LeadStatus
  assignedTo: { id: string; firstName: string; lastName: string } | null
  lastMessage: WhatsAppMessage | null
}

export const whatsappChatApi = {
  listInbox: () => apiClient.get<WhatsAppInboxItem[]>('/whatsapp/inbox').then((r) => r.data),

  listMessages: (leadId: string) =>
    apiClient.get<WhatsAppThread>(`/leads/${leadId}/whatsapp/messages`).then((r) => r.data),

  sendMessage: (leadId: string, text: string) =>
    apiClient.post<WhatsAppMessage>(`/leads/${leadId}/whatsapp/messages`, { text }).then((r) => r.data),
}
