import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  platformIntegrationsApi,
  type CreatePlatformIntegrationPayload,
  type UpdatePlatformIntegrationPayload,
} from '@/api/platform-integrations.api'
import { extractErrorMessage } from '@/lib/api-client'
import { REFRESH_INTERVAL_MS } from '@/lib/constants'
import { queryKeys } from './query-keys'

export function usePlatformIntegrations(enabled = true) {
  return useQuery({
    queryKey: queryKeys.integrations.all,
    queryFn: platformIntegrationsApi.list,
    refetchInterval: REFRESH_INTERVAL_MS,
    enabled,
  })
}

export function useCreatePlatformIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePlatformIntegrationPayload) => platformIntegrationsApi.create(payload),
    onSuccess: () => {
      toast.success('Integration connected')
      qc.invalidateQueries({ queryKey: queryKeys.integrations.all })
    },
    onError: (error) => toast.error('Could not connect integration', { description: extractErrorMessage(error) }),
  })
}

export function useRevealWebhookSecret() {
  return useMutation({
    mutationFn: (id: string) => platformIntegrationsApi.revealSecret(id),
    onError: (error) => toast.error('Could not reveal secret', { description: extractErrorMessage(error) }),
  })
}

export function useUpdatePlatformIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePlatformIntegrationPayload }) =>
      platformIntegrationsApi.update(id, payload),
    onSuccess: () => {
      toast.success('Integration updated')
      qc.invalidateQueries({ queryKey: queryKeys.integrations.all })
    },
    onError: (error) => toast.error('Could not update integration', { description: extractErrorMessage(error) }),
  })
}

export function useDeactivatePlatformIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => platformIntegrationsApi.deactivate(id),
    onSuccess: () => {
      toast.success('Integration deactivated')
      qc.invalidateQueries({ queryKey: queryKeys.integrations.all })
    },
    onError: (error) => toast.error('Could not deactivate integration', { description: extractErrorMessage(error) }),
  })
}
