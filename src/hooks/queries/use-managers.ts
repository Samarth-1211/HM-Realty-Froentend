import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  managersApi,
  type CreateManagerPayload,
  type UpdateManagerPayload,
} from '@/api/managers.api'
import { extractErrorMessage } from '@/lib/api-client'
import { toastWithEmailDelivery } from '@/lib/email-delivery'
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
    onSuccess: (data) => {
      toastWithEmailDelivery(data, 'Manager created')
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
    onSuccess: (data, { id }) => {
      const delivery = data.emailDelivery
      if (!delivery) {
        toast.success('Manager updated')
      } else if (delivery.sent) {
        toast.success('Manager updated', {
          description: `A verification link was sent to ${data.email}. They'll show as unverified until they click it.`,
        })
      } else {
        toast.warning('Manager updated, but the verification email was not sent', {
          description: `${delivery.error ?? 'Email delivery failed.'} Use "Resend verification" once email is working.`,
          duration: 12000,
        })
      }
      qc.invalidateQueries({ queryKey: queryKeys.managers.all })
      qc.invalidateQueries({ queryKey: ['employees', id] })
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

export function useResendManagerVerification() {
  return useMutation({
    mutationFn: (id: string) => managersApi.resendVerification(id),
    onSuccess: () => toast.success('Verification email resent'),
    onError: (error) => toast.error('Could not resend verification', { description: extractErrorMessage(error) }),
  })
}
