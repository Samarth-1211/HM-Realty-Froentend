import { apiClient } from '@/lib/api-client'

export type LeadAllocationMode = 'ORG_WIDE' | 'PROJECT_WISE'

export interface LeadAllocationSettings {
  mode: LeadAllocationMode
  autoAllocationEnabled: boolean
  autoReallocateLostLeads: boolean
  /** Portal/ad-platform leads that name a project go to that project's managers. */
  projectWisePlatformLeads: boolean
}

export interface ShuffleLostLeadsResult {
  attempted: number
  reassigned: number
  results: { leadId: string; reassignedToId: string | null }[]
}

export const leadAllocationApi = {
  getSettings: () =>
    apiClient.get<LeadAllocationSettings>('/lead-allocation/settings').then((r) => r.data),

  updateMode: (mode: LeadAllocationMode) =>
    apiClient.patch<{ mode: LeadAllocationMode }>('/lead-allocation/settings', { mode }).then((r) => r.data),

  updatePlatformProjectRouting: (enabled: boolean) =>
    apiClient
      .patch<{ projectWisePlatformLeads: boolean }>('/lead-allocation/platform-project-routing', { enabled })
      .then((r) => r.data),

  updateAutoAllocation: (enabled: boolean) =>
    apiClient
      .patch<{ autoAllocationEnabled: boolean }>('/lead-allocation/autopilot', { enabled })
      .then((r) => r.data),

  updateLostLeadReallocation: (enabled: boolean) =>
    apiClient
      .patch<{ autoReallocateLostLeads: boolean }>('/lead-allocation/lost-lead-reallocation', { enabled })
      .then((r) => r.data),

  shuffleLostLeads: (leadIds?: string[]) =>
    apiClient.post<ShuffleLostLeadsResult>('/leads/lost/shuffle', { leadIds }).then((r) => r.data),
}
