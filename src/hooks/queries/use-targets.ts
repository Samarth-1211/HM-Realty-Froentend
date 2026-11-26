import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  targetsApi,
  type AddTargetProgressPayload,
  type SetTargetPayload,
  type TargetRangeQuery,
} from '@/api/targets.api'
import { extractErrorMessage } from '@/lib/api-client'
import { REFRESH_INTERVAL_MS } from '@/lib/constants'
import { queryKeys } from './query-keys'

/** Targets show up on the Targets page, the team roll-up and people's profiles. */
function refreshTargets(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ['targets'] })
  qc.invalidateQueries({ queryKey: ['employees'] })
}

export function useMyTargets(query: TargetRangeQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.targets.mine(query),
    queryFn: () => targetsApi.mine(query),
    // Actuals move as check-out reports come in and leads convert.
    refetchInterval: REFRESH_INTERVAL_MS,
    enabled,
  })
}

export function useTeamTargets(query: TargetRangeQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.targets.team(query),
    queryFn: () => targetsApi.team(query),
    refetchInterval: REFRESH_INTERVAL_MS,
    enabled,
  })
}

export function useTargetDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.targets.detail(id ?? ''),
    queryFn: () => targetsApi.detail(id!),
    enabled: !!id,
  })
}

export function useSetTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SetTargetPayload) => targetsApi.set(payload),
    onSuccess: () => {
      toast.success('Target saved')
      refreshTargets(qc)
    },
    onError: (error) => toast.error('Could not save target', { description: extractErrorMessage(error) }),
  })
}

export function useUpdateTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, targetValue }: { id: string; targetValue: number }) => targetsApi.update(id, targetValue),
    onSuccess: () => {
      toast.success('Target updated')
      refreshTargets(qc)
    },
    onError: (error) => toast.error('Could not update target', { description: extractErrorMessage(error) }),
  })
}

export function useDeleteTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => targetsApi.remove(id),
    onSuccess: () => {
      toast.success('Target deleted')
      refreshTargets(qc)
    },
    onError: (error) => toast.error('Could not delete target', { description: extractErrorMessage(error) }),
  })
}

export function useAddTargetProgress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddTargetProgressPayload }) => targetsApi.addProgress(id, payload),
    onSuccess: () => {
      toast.success('Progress added')
      refreshTargets(qc)
    },
    onError: (error) => toast.error('Could not add progress', { description: extractErrorMessage(error) }),
  })
}

export function useWarnTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string }) => targetsApi.warn(id, message),
    onSuccess: () => {
      toast.success('Warning sent')
      refreshTargets(qc)
    },
    onError: (error) => toast.error('Could not send the warning', { description: extractErrorMessage(error) }),
  })
}
