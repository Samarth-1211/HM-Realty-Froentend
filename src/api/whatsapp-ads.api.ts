import { apiClient } from '@/lib/api-client'
import type { MapAdSourceResult, WhatsAppAdSource } from '@/types'

export const whatsappAdsApi = {
  list: () => apiClient.get<WhatsAppAdSource[]>('/whatsapp/ad-sources').then((r) => r.data),

  /** Links the ad to a project; `null` unlinks it. */
  map: (id: string, projectId: string | null) =>
    apiClient.patch<MapAdSourceResult>(`/whatsapp/ad-sources/${id}`, { projectId }).then((r) => r.data),
}
