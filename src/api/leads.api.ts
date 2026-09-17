import { apiClient } from '@/lib/api-client'
import type { Lead, LeadProgressStage, LeadStatus, LeadWithActivity } from '@/types'

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

export const leadsApi = {
  // NOTE: /leads is NOT paginated on the backend today — it returns a plain
  // Lead[] (scoped to the caller's org, and to their own assignments for
  // PRESALES/POSTSALES/AGENT), ordered newest first. Source/date filtering
  // and pagination are done client-side in the Leads page.
  list: (query: LeadQuery = {}) =>
    apiClient.get<Lead[]>('/leads', { params: query }).then((r) => r.data),

  get: (id: string) => apiClient.get<LeadWithActivity>(`/leads/${id}`).then((r) => r.data),

  createManual: (payload: CreateLeadManualPayload) =>
    apiClient.post<Lead>('/leads/manual', payload).then((r) => r.data),

  assign: (id: string, assignedToId: string) =>
    apiClient.patch<Lead>(`/leads/${id}/assign`, { assignedToId }).then((r) => r.data),

  updateStatus: ({ id, status, progressStage, progressStageNote }: UpdateLeadStatusPayload) =>
    apiClient.patch<Lead>(`/leads/${id}/status`, { status, progressStage, progressStageNote }).then((r) => r.data),
}
