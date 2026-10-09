import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  leadsApi,
  type CreateLeadManualPayload,
  type LeadImportAllocationChoice,
  type LeadQuery,
  type UpdateLeadDetailsPayload,
  type UpdateLeadFollowUpPayload,
  type UpdateLeadStatusPayload,
} from '@/api/leads.api'
import { extractErrorMessage } from '@/lib/api-client'
import { formatLeadNumber } from '@/lib/utils'
import { REFRESH_INTERVAL_MS } from '@/lib/constants'
import { LeadImportStatus } from '@/types'
import { queryKeys } from './query-keys'

const IMPORT_POLL_MS = 1000

export function useLeads(query: LeadQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.leads.list(query),
    queryFn: () => leadsApi.list(query),
    refetchInterval: REFRESH_INTERVAL_MS,
    enabled,
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

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLeadDetailsPayload }) => leadsApi.update(id, payload),
    onSuccess: (lead, vars) => {
      toast.success('Lead updated')
      qc.setQueryData(queryKeys.leads.detail(vars.id), lead)
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: (error) => toast.error('Could not update lead', { description: extractErrorMessage(error) }),
  })
}

export function useAssignLead() {
  const qc = useQueryClient()
  return useMutation({
    /** `handover`: a Manager passing the lead to another Manager — it leaves their view entirely. */
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string; handover?: boolean }) =>
      leadsApi.assign(id, assignedToId),
    onSuccess: (_d, vars) => {
      toast.success(vars.handover ? 'Lead handed over to the other manager' : 'Lead assigned')
      if (vars.handover) {
        // No longer visible to us — drop it instead of refetching it into a 404.
        qc.removeQueries({ queryKey: queryKeys.leads.detail(vars.id), exact: true })
      } else {
        qc.invalidateQueries({ queryKey: queryKeys.leads.detail(vars.id) })
      }
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: (error) => toast.error('Could not assign lead', { description: extractErrorMessage(error) }),
  })
}

/** Assigns a selection of leads to one person; reports any that were skipped. */
export function useBulkAssignLeads() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ leadIds, assignedToId }: { leadIds: string[]; assignedToId: string }) =>
      leadsApi.bulkAssign(leadIds, assignedToId),
    onSuccess: (result) => {
      if (result.assigned > 0) toast.success(`${plural(result.assigned, 'lead')} assigned`)
      if (result.skipped.length > 0) {
        toast.warning(`${plural(result.skipped.length, 'lead')} not assigned`, {
          description: [...new Set(result.skipped.map((s) => s.reason))].join(' · '),
        })
      }
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: (error) => toast.error('Could not assign the leads', { description: extractErrorMessage(error) }),
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

function plural(count: number, noun: string) {
  return `${count.toLocaleString('en-IN')} ${noun}${count === 1 ? '' : 's'}`
}

/** After a bulk delete: drop the deleted leads' detail queries and refresh the lists. */
function afterLeadsDeleted(qc: ReturnType<typeof useQueryClient>, deletedIds: string[]) {
  for (const id of deletedIds) qc.removeQueries({ queryKey: queryKeys.leads.detail(id), exact: true })
  qc.invalidateQueries({ queryKey: ['leads'] })
  qc.invalidateQueries({ queryKey: ['lead-imports'] })
  qc.invalidateQueries({ queryKey: ['tasks'] })
}

/** Permanently deletes a selection of leads. */
export function useBulkDeleteLeads() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (leadIds: string[]) => leadsApi.bulkDelete(leadIds),
    onSuccess: (result) => {
      toast.success(`${plural(result.deleted, 'lead')} deleted`, {
        description: result.skipped > 0 ? `${plural(result.skipped, 'lead')} skipped — you can’t delete those.` : undefined,
      })
      afterLeadsDeleted(qc, result.deletedIds)
    },
    onError: (error) => toast.error('Could not delete the leads', { description: extractErrorMessage(error) }),
  })
}

/** Permanently deletes every lead that came from one uploaded sheet. */
export function useDeleteImportLeads() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (batchId: string) => leadsApi.removeImportLeads(batchId),
    onSuccess: (result) => {
      toast.success(`${plural(result.deleted, 'lead')} from ${result.fileName} deleted`, {
        description:
          result.remaining > 0 ? `${plural(result.remaining, 'lead')} from this sheet sit in other teams and were kept.` : undefined,
      })
      afterLeadsDeleted(qc, result.deletedIds)
    },
    onError: (error) => toast.error('Could not delete the sheet’s leads', { description: extractErrorMessage(error) }),
  })
}

/** Sends an Admin's or Manager's lead sheet; resolves once the file is accepted, before its rows are imported. */
export function useImportLeads() {
  return useMutation({
    mutationFn: ({
      file,
      allocation,
      onProgress,
    }: {
      file: File
      allocation: LeadImportAllocationChoice
      onProgress?: (percent: number) => void
    }) => leadsApi.importSheet(file, allocation, onProgress),
    onError: (error) => toast.error('Could not upload the sheet', { description: extractErrorMessage(error) }),
  })
}

/**
 * Follows an upload while its rows are imported (polling every second),
 * then refreshes the lead lists once it has finished.
 */
export function useLeadImport(id: string | null) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.leads.import(id ?? ''),
    queryFn: () => leadsApi.getImport(id!),
    enabled: !!id,
    refetchInterval: (q) => (q.state.data?.status === LeadImportStatus.PROCESSING ? IMPORT_POLL_MS : false),
  })

  const finished = !!query.data && query.data.status !== LeadImportStatus.PROCESSING
  useEffect(() => {
    if (!finished) return
    qc.invalidateQueries({ queryKey: ['leads'] })
    qc.invalidateQueries({ queryKey: queryKeys.leads.imports() })
  }, [finished, qc])

  return query
}

/** Admin's history of uploaded lead sheets — refreshed while any on the page is still importing. */
export function useLeadImports(page: number, pageSize: number) {
  return useQuery({
    queryKey: queryKeys.leads.imports({ page, pageSize }),
    queryFn: () => leadsApi.listImports(page, pageSize),
    placeholderData: (previous) => previous,
    refetchInterval: (q) =>
      q.state.data?.items.some((b) => b.status === LeadImportStatus.PROCESSING) ? IMPORT_POLL_MS * 3 : REFRESH_INTERVAL_MS,
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
