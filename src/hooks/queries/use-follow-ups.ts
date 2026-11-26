import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  followUpsApi,
  whatsappTemplatesApi,
  type TemplateDraft,
  type BroadcastStatus,
  type CreateBroadcastPayload,
  type SearchFollowUpLeadsPayload,
} from '@/api/follow-ups.api'
import { REFRESH_INTERVAL_MS } from '@/lib/constants'
import { queryKeys } from './query-keys'

/** While a follow-up is still going out, its numbers move every few seconds. */
const LIVE_REFRESH_MS = 3000
const isLive = (status: BroadcastStatus | undefined) => status === 'QUEUED' || status === 'SENDING'

export function useFollowUpLeads(payload: SearchFollowUpLeadsPayload) {
  return useQuery({
    queryKey: queryKeys.followUps.leads(payload),
    queryFn: () => followUpsApi.searchLeads(payload),
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}

export function useFollowUpTemplates(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.followUps.templates,
    queryFn: followUpsApi.listTemplates,
    enabled,
    staleTime: 60_000,
    retry: false,
  })
}

export function usePreviewBroadcast() {
  return useMutation({ mutationFn: (payload: CreateBroadcastPayload) => followUpsApi.preview(payload) })
}

export function useCreateBroadcast() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBroadcastPayload) => followUpsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-ups'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

export function useBroadcasts(page: number) {
  return useQuery({
    queryKey: queryKeys.followUps.broadcasts(page),
    queryFn: () => followUpsApi.list(page),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      query.state.data?.items.some((b) => isLive(b.status)) ? LIVE_REFRESH_MS : REFRESH_INTERVAL_MS,
  })
}

export function useBroadcast(id: string | null) {
  return useQuery({
    queryKey: queryKeys.followUps.broadcast(id ?? ''),
    queryFn: () => followUpsApi.get(id!),
    enabled: !!id,
    refetchInterval: (query) => (isLive(query.state.data?.status) ? LIVE_REFRESH_MS : REFRESH_INTERVAL_MS),
  })
}

export function useBroadcastRecipients(id: string | null, live: boolean) {
  return useQuery({
    queryKey: queryKeys.followUps.recipients(id ?? ''),
    queryFn: () => followUpsApi.recipients(id!),
    enabled: !!id,
    refetchInterval: live ? LIVE_REFRESH_MS : REFRESH_INTERVAL_MS,
  })
}

export function useCancelBroadcast() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => followUpsApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follow-ups'] }),
  })
}

/** Templates waiting for Meta are re-checked every 30 s while the tab is open; otherwise every few minutes. */
export function useManagedTemplates(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.followUps.managedTemplates,
    queryFn: whatsappTemplatesApi.list,
    enabled,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.items.some((t) => t.status === 'PENDING' || t.status === 'IN_APPEAL') ? 30_000 : 5 * 60_000,
  })
}

function useTemplateMutation<T>(fn: (vars: T) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follow-ups'] }),
  })
}

export const useCreateTemplate = () => useTemplateMutation((draft: TemplateDraft) => whatsappTemplatesApi.create(draft))
export const useResubmitTemplate = () =>
  useTemplateMutation(({ id, draft }: { id: string; draft: TemplateDraft }) => whatsappTemplatesApi.resubmit(id, draft))
export const useDeleteTemplate = () => useTemplateMutation((metaTemplateId: string) => whatsappTemplatesApi.remove(metaTemplateId))
