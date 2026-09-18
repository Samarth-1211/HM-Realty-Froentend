import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  leadsApi,
  type CreateLeadManualPayload,
  type LeadQuery,
  type UpdateLeadFollowUpPayload,
  type UpdateLeadStatusPayload,
} from '@/api/leads.api'
import { extractErrorMessage } from '@/lib/api-client'
import { REFRESH_INTERVAL_MS } from '@/lib/constants'
import { queryKeys } from './query-keys'

export function useLeads(query: LeadQuery = {}) {
  return useQuery({
    queryKey: queryKeys.leads.list(query),
    queryFn: () => leadsApi.list(query),
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.leads.detail(id ?? ''),
    queryFn: () => leadsApi.get(id!),
    enabled: !!id,
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateLeadManualPayload) => leadsApi.createManual(payload),
    onSuccess: () => {
      toast.success('Lead added')
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: (error) => toast.error('Could not add lead', { description: extractErrorMessage(error) }),
  })
}

export function useAssignLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string }) =>
      leadsApi.assign(id, assignedToId),
    onSuccess: (_d, vars) => {
      toast.success('Lead assigned')
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: queryKeys.leads.detail(vars.id) })
    },
    onError: (error) => toast.error('Could not assign lead', { description: extractErrorMessage(error) }),
  })
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateLeadStatusPayload) => leadsApi.updateStatus(payload),
    onSuccess: (_d, vars) => {
      toast.success('Lead status updated')
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: queryKeys.leads.detail(vars.id) })
    },
    onError: (error) => toast.error('Could not update lead status', { description: extractErrorMessage(error) }),
  })
}

export function useUpdateLeadFollowUp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLeadFollowUpPayload }) =>
      leadsApi.updateFollowUp(id, payload),
    onSuccess: (_d, vars) => {
      toast.success('Follow-up details saved')
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: queryKeys.leads.detail(vars.id) })
    },
    onError: (error) => toast.error('Could not save follow-up details', { description: extractErrorMessage(error) }),
  })
}
