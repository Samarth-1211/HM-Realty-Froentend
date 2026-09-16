import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  managersApi,
  type CreateManagerPayload,
  type UpdateManagerPayload,
} from '@/api/managers.api'
import { extractErrorMessage } from '@/lib/api-client'
import { REFRESH_INTERVAL_MS } from '@/lib/constants'
import { queryKeys } from './query-keys'

export function useManagers() {
  return useQuery({
    queryKey: queryKeys.managers.all,
    queryFn: managersApi.list,
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}

export function useManager(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.managers.detail(id ?? ''),
    queryFn: () => managersApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateManager() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateManagerPayload) => managersApi.create(payload),
    onSuccess: () => {
      toast.success('Manager created')
      qc.invalidateQueries({ queryKey: queryKeys.managers.all })
    },
    onError: (error) => toast.error('Could not create manager', { description: extractErrorMessage(error) }),
  })
}

export function useUpdateManager() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateManagerPayload }) =>
      managersApi.update(id, payload),
    onSuccess: () => {
      toast.success('Manager updated')
      qc.invalidateQueries({ queryKey: queryKeys.managers.all })
    },
    onError: (error) => toast.error('Could not update manager', { description: extractErrorMessage(error) }),
  })
}

export function useDeactivateManager() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => managersApi.deactivate(id),
    onSuccess: () => {
      toast.success('Manager deactivated')
      qc.invalidateQueries({ queryKey: queryKeys.managers.all })
    },
    onError: (error) => toast.error('Could not deactivate manager', { description: extractErrorMessage(error) }),
  })
}

export function useReactivateManager() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => managersApi.reactivate(id),
    onSuccess: () => {
      toast.success('Manager reactivated')
      qc.invalidateQueries({ queryKey: queryKeys.managers.all })
    },
    onError: (error) => toast.error('Could not reactivate manager', { description: extractErrorMessage(error) }),
  })
}

export function useDeleteManager() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => managersApi.remove(id, reason),
    onSuccess: () => {
      toast.success('Manager deleted')
      qc.invalidateQueries({ queryKey: queryKeys.managers.all })
    },
    onError: (error) => toast.error('Could not delete manager', { description: extractErrorMessage(error) }),
  })
}
