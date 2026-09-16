import { apiClient } from '@/lib/api-client'

export type LeadAllocationMode = 'ORG_WIDE' | 'PROJECT_WISE'

export interface LeadAllocationSettings {
  mode: LeadAllocationMode
  autoAllocationEnabled: boolean
}

export const leadAllocationApi = {
  getSettings: () =>
    apiClient.get<LeadAllocationSettings>('/lead-allocation/settings').then((r) => r.data),

  updateAutoAllocation: (enabled: boolean) =>
    apiClient
      .patch<{ autoAllocationEnabled: boolean }>('/lead-allocation/autopilot', { enabled })
      .then((r) => r.data),
}
