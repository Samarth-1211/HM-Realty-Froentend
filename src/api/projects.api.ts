import { apiClient } from '@/lib/api-client'
import type { LeadSource, PlotSizeUnit, Project, ProjectManagerLink } from '@/types'

export interface CreateProjectPayload {
  name: string
  description?: string
  location?: string
  price?: number
  plotSize?: number
  plotSizeUnit?: PlotSizeUnit
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
