import { useEffect } from 'react'
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
import { formatLeadNumber } from '@/lib/utils'
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

/**
 * Leads new to the current user since they last opened the Leads list:
 * every new lead in the org for Admins/Managers, newly allocated ones for
 * everyone else. Non-zero lights the dot on the Leads nav item.
 */
export function useUnseenLeadsCount() {
  return useQuery({
    queryKey: queryKeys.leads.unseenCount,
    queryFn: () => leadsApi.unseenCount(),
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}

/**
 * For the Leads list page: keeps the nav dot cleared while it's open —
 * marks the list seen on arrival, and again whenever a poll finds leads that
 * came in since, refreshing the list so they show up right away.
 */
export function useMarkLeadsSeenWhileOpen() {
  const qc = useQueryClient()
  const { data: unseen } = useUnseenLeadsCount()
  const { mutate: markSeen } = useMutation({
    mutationFn: () => leadsApi.markSeen(),
    onSuccess: () => {
      qc.setQueryData(queryKeys.leads.unseenCount, 0)
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  useEffect(() => {
    if (unseen) markSeen()
  }, [unseen, markSeen])
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateLeadManualPayload) => leadsApi.createManual(payload),
    onSuccess: (lead) => {
      if (lead.deduplicated) {
        toast.info(`${lead.fullName} is already in the CRM as ${formatLeadNumber(lead.leadNumber)}`, {
          description: lead.reopened
            ? 'No duplicate was created — the lost lead has been reopened and this enquiry added to its timeline.'
            : 'No duplicate was created — this enquiry was added to the existing lead’s timeline.',
        })
      } else {
        toast.success('Lead added')
      }
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

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => leadsApi.remove(id),
    onSuccess: (_d, id) => {
      toast.success('Lead deleted')
      // Drop the deleted lead's detail query instead of refetching it into a 404.
      qc.removeQueries({ queryKey: queryKeys.leads.detail(id), exact: true })
      qc.invalidateQueries({ queryKey: ['leads'], predicate: (q) => q.queryKey[1] !== id })
      // Tasks linked to the lead are kept but unlinked from it.
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => toast.error('Could not delete lead', { description: extractErrorMessage(error) }),
  })
}

export function useTeamPerformance(enabled = true) {
  return useQuery({
    queryKey: queryKeys.leads.teamPerformance,
    queryFn: () => leadsApi.teamPerformance(),
    refetchInterval: REFRESH_INTERVAL_MS,
    enabled,
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
