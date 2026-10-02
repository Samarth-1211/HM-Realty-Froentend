import { apiClient } from '@/lib/api-client'
import type { Notification } from '@/types'

export const notificationsApi = {
  list: (unreadOnly?: boolean) =>
    apiClient.get<Notification[]>('/notifications', { params: { unreadOnly } }).then((r) => r.data),

  unreadCount: () => apiClient.get<number>('/notifications/unread-count').then((r) => r.data),

  markRead: (id: string) => apiClient.patch<void>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () => apiClient.patch<void>('/notifications/read-all').then((r) => r.data),

  /** VAPID key this browser subscribes with — null when the server has push turned off. */
  pushPublicKey: () =>
    apiClient.get<{ publicKey: string | null }>('/notifications/push/public-key').then((r) => r.data),

  pushSubscribe: (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    apiClient.post<{ subscribed: true }>('/notifications/push/subscribe', subscription).then((r) => r.data),

  pushUnsubscribe: (endpoint: string) =>
    apiClient.post<{ subscribed: false }>('/notifications/push/unsubscribe', { endpoint }).then((r) => r.data),

  pushTest: () => apiClient.post<{ devices: number }>('/notifications/push/test').then((r) => r.data),
}
