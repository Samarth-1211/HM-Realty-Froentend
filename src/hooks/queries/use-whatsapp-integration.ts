import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  whatsappIntegrationApi,
  type ConnectWhatsAppIntegrationPayload,
  type UpdateWhatsAppIntegrationPayload,
} from '@/api/whatsapp-integration.api'
import { extractErrorMessage } from '@/lib/api-client'
import { REFRESH_INTERVAL_MS } from '@/lib/constants'
import { queryKeys } from './query-keys'

// A 404 here just means "not connected yet" — an expected state, not a
// transient failure, so no retries and no error toast noise.
export function useWhatsAppIntegration() {
  return useQuery({
    queryKey: queryKeys.whatsappIntegration.detail,
    queryFn: whatsappIntegrationApi.get,
    retry: false,
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}

export function useConnectWhatsAppIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ConnectWhatsAppIntegrationPayload) => whatsappIntegrationApi.connect(payload),
    onSuccess: () => {
      toast.success('WhatsApp connected — paste the webhook URL and verify token into Meta to finish setup')
      qc.invalidateQueries({ queryKey: queryKeys.whatsappIntegration.detail })
    },
    onError: (error) => toast.error('Could not connect WhatsApp', { description: extractErrorMessage(error) }),
  })
}

export function useUpdateWhatsAppIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateWhatsAppIntegrationPayload) => whatsappIntegrationApi.update(payload),
    onSuccess: () => {
      toast.success('WhatsApp integration updated')
      qc.invalidateQueries({ queryKey: queryKeys.whatsappIntegration.detail })
    },
    onError: (error) => toast.error('Could not update WhatsApp integration', { description: extractErrorMessage(error) }),
  })
}

export function useRevealWhatsAppVerifyToken() {
  return useMutation({
    mutationFn: () => whatsappIntegrationApi.revealVerifyToken(),
    onError: (error) => toast.error('Could not reveal verify token', { description: extractErrorMessage(error) }),
  })
}

export function useDisableWhatsAppIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => whatsappIntegrationApi.disable(),
    onSuccess: () => {
      toast.success('WhatsApp integration disabled')
      qc.invalidateQueries({ queryKey: queryKeys.whatsappIntegration.detail })
    },
    onError: (error) => toast.error('Could not disable WhatsApp integration', { description: extractErrorMessage(error) }),
  })
}

export function useEnableWhatsAppIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => whatsappIntegrationApi.enable(),
    onSuccess: () => {
      toast.success('WhatsApp integration re-enabled')
      qc.invalidateQueries({ queryKey: queryKeys.whatsappIntegration.detail })
    },
    onError: (error) => toast.error('Could not re-enable WhatsApp integration', { description: extractErrorMessage(error) }),
  })
}
