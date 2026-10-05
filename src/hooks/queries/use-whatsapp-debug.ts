import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { whatsappDebugApi, type WebhookEventFilter } from '@/api/whatsapp-debug.api'
import { extractErrorMessage } from '@/lib/api-client'
import { queryKeys } from './query-keys'

const EVENT_LOG_POLL_MS = 3_000
const TRACE_POLL_MS = 5_000

/** Runs only when asked ("Run checks") — each run makes several live Graph API calls. */
export function useWhatsAppHealth() {
  return useQuery({
    queryKey: queryKeys.whatsappDebug.health,
    queryFn: whatsappDebugApi.health,
    enabled: false,
    retry: false,
  })
}

export function useSubscribeWhatsAppApp() {
  return useMutation({
    mutationFn: whatsappDebugApi.subscribeApp,
    onSuccess: (data) => {
      if (data.ok) toast.success('App subscribed to the WABA — run the checks again to confirm')
      else toast.error('Meta refused the subscription', { description: JSON.stringify(data.body) })
    },
    onError: (error) => toast.error('Could not subscribe the app', { description: extractErrorMessage(error) }),
  })
}

export function useWebhookEvents(filter: WebhookEventFilter, paused: boolean) {
  return useQuery({
    queryKey: queryKeys.whatsappDebug.events(filter),
    queryFn: () => whatsappDebugApi.events(filter),
    refetchInterval: paused ? false : EVENT_LOG_POLL_MS,
  })
}

export function useWebhookEvent(id: string | null) {
  return useQuery({
    queryKey: queryKeys.whatsappDebug.event(id ?? ''),
    queryFn: () => whatsappDebugApi.event(id!),
    enabled: !!id,
    staleTime: Infinity,
  })
}

export function useSendTestMessage() {
  return useMutation({ mutationFn: whatsappDebugApi.sendTest })
}

export function useSimulateInbound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: whatsappDebugApi.simulateInbound,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-debug', 'events'] })
      qc.invalidateQueries({ queryKey: queryKeys.whatsappDebug.trace })
      qc.invalidateQueries({ queryKey: queryKeys.whatsappChat.inbox })
    },
  })
}

export function usePipelineTrace() {
  return useQuery({
    queryKey: queryKeys.whatsappDebug.trace,
    queryFn: whatsappDebugApi.trace,
    refetchInterval: TRACE_POLL_MS,
  })
}
