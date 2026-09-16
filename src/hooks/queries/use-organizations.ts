import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  organizationsApi,
  type CreateOrgAdminPayload,
  type CreateOrganizationPayload,
  type ListOrganizationsQuery,
  type UpdateOrganizationPayload,
} from '@/api/organizations.api'
import { extractErrorMessage } from '@/lib/api-client'
import { REFRESH_INTERVAL_MS } from '@/lib/constants'
import { queryKeys } from './query-keys'

export function useOrganizations(query: ListOrganizationsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.organizations.list(query),
    queryFn: () => organizationsApi.list(query),
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}

export function useOrganization(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.organizations.detail(id ?? ''),
    queryFn: () => organizationsApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateOrganizationPayload) => organizationsApi.create(payload),
    onSuccess: () => {
      toast.success('Organization created')
      qc.invalidateQueries({ queryKey: ['organizations'] })
    },
    onError: (error) => toast.error('Could not create organization', { description: extractErrorMessage(error) }),
  })
}

export function useUpdateOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrganizationPayload }) =>
      organizationsApi.update(id, payload),
    onSuccess: (_data, vars) => {
      toast.success('Organization updated')
      qc.invalidateQueries({ queryKey: ['organizations'] })
      qc.invalidateQueries({ queryKey: queryKeys.organizations.detail(vars.id) })
    },
    onError: (error) => toast.error('Could not update organization', { description: extractErrorMessage(error) }),
  })
}

export function useAddOrgAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateOrgAdminPayload }) =>
      organizationsApi.addAdmin(id, payload),
    onSuccess: () => {
      toast.success('Admin added to organization')
      qc.invalidateQueries({ queryKey: ['organizations'] })
    },
    onError: (error) => toast.error('Could not add admin', { description: extractErrorMessage(error) }),
  })
}

export function useSuspendOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      organizationsApi.suspend(id, reason),
    onSuccess: () => {
      toast.success('Organization suspended')
      qc.invalidateQueries({ queryKey: ['organizations'] })
    },
    onError: (error) => toast.error('Could not suspend organization', { description: extractErrorMessage(error) }),
  })
}

export function useReactivateOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      organizationsApi.reactivate(id, reason),
    onSuccess: () => {
      toast.success('Organization reactivated')
      qc.invalidateQueries({ queryKey: ['organizations'] })
    },
    onError: (error) => toast.error('Could not reactivate organization', { description: extractErrorMessage(error) }),
  })
}

export function useArchiveOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => organizationsApi.archive(id),
    onSuccess: () => {
      toast.success('Organization archived')
      qc.invalidateQueries({ queryKey: ['organizations'] })
    },
    onError: (error) => toast.error('Could not archive organization', { description: extractErrorMessage(error) }),
  })
}
