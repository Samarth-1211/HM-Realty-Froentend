import { apiClient } from '@/lib/api-client'
import type { DeleteUserPayload, DeletionImpact, Paginated, ProjectManagerLink, TeamMember, User, UserRole } from '@/types'

export interface CreateTeamMemberPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  role: Extract<UserRole, 'AGENT' | 'PRESALES' | 'POSTSALES'>
  projectIds?: string[]
}

export interface UpdateTeamMemberPayload {
  firstName?: string
  lastName?: string
  /** null clears the stored number. */
  phone?: string | null
  isActive?: boolean
}

export interface TeamMemberQuery {
  role?: Extract<UserRole, 'AGENT' | 'PRESALES' | 'POSTSALES'>
  isActive?: boolean
  projectId?: string
  page?: number
  pageSize?: number
}

export const teamApi = {
  list: (query: TeamMemberQuery = {}) =>
    apiClient
      .get<Paginated<User>>('/manager/team-members', { params: query })
      .then((r) => r.data),

  get: (id: string) => apiClient.get<TeamMember>(`/manager/team-members/${id}`).then((r) => r.data),

  create: (payload: CreateTeamMemberPayload) =>
    apiClient.post<TeamMember>('/manager/team-members', payload).then((r) => r.data),

  update: (id: string, payload: UpdateTeamMemberPayload) =>
    apiClient.patch<TeamMember>(`/manager/team-members/${id}`, payload).then((r) => r.data),

  assignProject: (id: string, projectId: string) =>
    apiClient
      .post<ProjectManagerLink>(`/manager/team-members/${id}/projects`, { projectId })
      .then((r) => r.data),

  resendVerification: (id: string) =>
    apiClient.post<{ success: boolean }>(`/manager/team-members/${id}/resend-verification`).then((r) => r.data),

  deletionImpact: (id: string) =>
    apiClient.get<DeletionImpact>(`/manager/team-members/${id}/deletion-impact`).then((r) => r.data),

  remove: (id: string, payload: DeleteUserPayload) =>
    apiClient
      .delete<{ message: string; id: string }>(`/manager/team-members/${id}`, {
        data: { confirmation: 'delete', ...payload },
      })
      .then((r) => r.data),
}
