import { apiClient } from '@/lib/api-client'
import type { Organization, OrganizationStatus, SubscriptionPlan, User } from '@/types'

export interface CreateOrgAdminPayload {
  adminEmail: string
  adminPassword: string
  adminFirstName: string
  adminLastName: string
}

export interface CreateOrganizationPayload {
  name: string
  contactEmail: string
  contactPhone?: string
  address?: string
  gstNumber?: string
  plan?: SubscriptionPlan
  maxUsers?: number
  maxLeadsPerMonth?: number
  // Required: the org's first admin is created with it and emailed the
  // welcome + verification link straight away.
  admin: CreateOrgAdminPayload
}

export type UpdateOrganizationPayload = Partial<
  Omit<CreateOrganizationPayload, 'admin'>
>

export interface ListOrganizationsQuery {
  status?: OrganizationStatus
  plan?: SubscriptionPlan
  search?: string
}

export const organizationsApi = {
  list: (query: ListOrganizationsQuery = {}) =>
    apiClient
      .get<Organization[]>('/organizations', { params: query })
      .then((r) => r.data),

  get: (id: string) => apiClient.get<Organization>(`/organizations/${id}`).then((r) => r.data),

  create: (payload: CreateOrganizationPayload) =>
    apiClient.post<Organization>('/organizations', payload).then((r) => r.data),

  update: (id: string, payload: UpdateOrganizationPayload) =>
    apiClient.patch<Organization>(`/organizations/${id}`, payload).then((r) => r.data),

  addAdmin: (id: string, payload: CreateOrgAdminPayload) =>
    apiClient.post<User>(`/organizations/${id}/admin`, payload).then((r) => r.data),

  suspend: (id: string, reason: string) =>
    apiClient
      .patch<Organization>(`/organizations/${id}/suspend`, { reason })
      .then((r) => r.data),

  reactivate: (id: string, reason?: string) =>
    apiClient
      .patch<Organization>(`/organizations/${id}/reactivate`, reason ? { reason } : {})
      .then((r) => r.data),

  archive: (id: string) =>
    apiClient.delete<Organization>(`/organizations/${id}`).then((r) => r.data),

  resendAdminVerification: (id: string) =>
    apiClient.post<{ success: boolean }>(`/organizations/${id}/resend-verification`).then((r) => r.data),
}
