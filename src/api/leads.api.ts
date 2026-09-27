import { apiClient, postFile } from '@/lib/api-client'
import type {
  BookingStatus,
  CreateLeadManualResult,
  Lead,
  LeadImportBatch,
  LeadProgressStage,
  LeadPurpose,
  LeadStatus,
  LeadTemperature,
  LeadWithActivity,
  TeamPerformanceRow,
  VisitStatus,
} from '@/types'

export interface CreateLeadManualPayload {
  fullName: string
  phone: string
  email?: string
  propertyInterest?: string
  assignedToId?: string
  referredByName?: string
  referredByEmail?: string
  referredByPhone?: string
}

export interface UpdateLeadStatusPayload {
  id: string
  status: LeadStatus
  progressStage?: LeadProgressStage
  progressStageNote?: string
}

export interface LeadQuery {
  /** The only server-side filter `GET /leads` currently supports. */
  status?: LeadStatus
}

export interface UpdateLeadFollowUpPayload {
  lastContactedAt?: string
  nextFollowUpAt?: string
  siteVisitDate?: string
  visitStatus?: VisitStatus
  leadTemperature?: LeadTemperature
  purpose?: LeadPurpose
  plotSizeSqFt?: number
  mainObjection?: string
  bookingProbability?: number
  bookingStatus?: BookingStatus
  bookingValue?: number
  lostNurtureReason?: string
  remarks?: string
}

export const leadsApi = {
  // NOTE: /leads is NOT paginated on the backend today — it returns a plain
  // Lead[] (scoped to the caller's org, and to their own assignments for
  // PRESALES/POSTSALES/AGENT), ordered newest first. Source/date filtering
  // and pagination are done client-side in the Leads page.
  list: (query: LeadQuery = {}) =>
    apiClient.get<Lead[]>('/leads', { params: query }).then((r) => r.data),

  get: (id: string) => apiClient.get<LeadWithActivity>(`/leads/${id}`).then((r) => r.data),

  createManual: (payload: CreateLeadManualPayload) =>
    apiClient.post<CreateLeadManualResult>('/leads/manual', payload).then((r) => r.data),

  assign: (id: string, assignedToId: string) =>
    apiClient.patch<Lead>(`/leads/${id}/assign`, { assignedToId }).then((r) => r.data),

  updateStatus: ({ id, status, progressStage, progressStageNote }: UpdateLeadStatusPayload) =>
    apiClient.patch<Lead>(`/leads/${id}/status`, { status, progressStage, progressStageNote }).then((r) => r.data),

  updateFollowUp: (id: string, payload: UpdateLeadFollowUpPayload) =>
    apiClient.patch<Lead>(`/leads/${id}/follow-up`, payload).then((r) => r.data),

  teamPerformance: () =>
    apiClient.get<TeamPerformanceRow[]>('/leads/team-performance').then((r) => r.data),

  /** Leads that arrived since the caller last opened the Leads list — drives the nav dot. */
  unseenCount: () => apiClient.get<number>('/leads/unseen-count').then((r) => r.data),

  markSeen: () => apiClient.patch<void>('/leads/seen').then((r) => r.data),

  remove: (id: string) =>
    apiClient
      .delete<{ message: string; id: string }>(`/leads/${id}`, { data: { confirmation: 'delete' } })
      .then((r) => r.data),

  /** Admin Excel/CSV upload. Returns as soon as the file is checked; rows import in the background. */
  importSheet: (file: File, onProgress?: (percent: number) => void) =>
    postFile<LeadImportBatch>('/leads/import', file, onProgress),

  /** Polled for the upload's progress and, once done, its per-row outcome. */
  getImport: (id: string) => apiClient.get<LeadImportBatch>(`/leads/imports/${id}`).then((r) => r.data),

  importTemplate: () =>
    apiClient.get<Blob>('/leads/import/template', { responseType: 'blob' }).then((r) => r.data),
}
