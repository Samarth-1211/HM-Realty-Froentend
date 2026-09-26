import { apiClient } from '@/lib/api-client'
import type {
  EmChargesStatus,
  LeadSource,
  PaymentTerms,
  PlotSizeMode,
  Project,
  ProjectManagerLink,
  PropertyType,
} from '@/types'

export interface PlotSizePayload {
  areaSqft: number
  widthFt?: number | null
  lengthFt?: number | null
}

/** `null` clears a field on update. Rates are ₹ per sq.ft; budget is whole rupees. */
export interface CreateProjectPayload {
  name: string
  zone: string
  location: string
  landmark?: string | null
  propertyType?: PropertyType
  basicRateMin?: number | null
  basicRateMax?: number | null
  emChargesStatus?: EmChargesStatus | null
  emCharges?: number | null
  emChargesNote?: string | null
  plcMinPercent?: number | null
  plcMaxPercent?: number | null
  plcNa?: boolean
  guidelineRate?: number | null
  guidelineRateApprox?: boolean
  guidelineRateNa?: boolean
  plotSizeMode?: PlotSizeMode
  plotSizes?: PlotSizePayload[]
  plotAreaMin?: number | null
  plotAreaMax?: number | null
  budgetIsManual?: boolean
  budgetMin?: number | null
  budgetMax?: number | null
  paymentTerms?: PaymentTerms | null
  remarks?: string | null
  sourceAgentName?: string | null
  rateListDate?: string | null
  description?: string | null
  activePlatforms?: LeadSource[]
  isActive?: boolean
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>

export const projectsApi = {
  list: () => apiClient.get<Project[]>('/projects').then((r) => r.data),

  get: (id: string) => apiClient.get<Project>(`/projects/${id}`).then((r) => r.data),

  create: (payload: CreateProjectPayload) =>
    apiClient.post<Project>('/projects', payload).then((r) => r.data),

  update: (id: string, payload: UpdateProjectPayload) =>
    apiClient.patch<Project>(`/projects/${id}`, payload).then((r) => r.data),

  remove: (id: string) =>
    apiClient
      .delete<{ message: string; id: string }>(`/projects/${id}`)
      .then((r) => r.data),

  assignManager: (id: string, managerId: string) =>
    apiClient
      .post<ProjectManagerLink>(`/projects/${id}/managers`, { managerId })
      .then((r) => r.data),

  listManagers: (id: string) =>
    apiClient.get<ProjectManagerLink[]>(`/projects/${id}/managers`).then((r) => r.data),

  unassignManager: (id: string, managerId: string) =>
    apiClient
      .delete<{ message: string; projectId: string; managerId: string }>(
        `/projects/${id}/managers/${managerId}`,
      )
      .then((r) => r.data),
}
