import { apiClient } from '@/lib/api-client'
import type { Notification } from '@/types'

export const notificationsApi = {
  list: (unreadOnly?: boolean) =>
    apiClient.get<Notification[]>('/notifications', { params: { unreadOnly } }).then((r) => r.data),

  unreadCount: () => apiClient.get<number>('/notifications/unread-count').then((r) => r.data),

  markRead: (id: string) => apiClient.patch<void>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () => apiClient.patch<void>('/notifications/read-all').then((r) => r.data),
}
