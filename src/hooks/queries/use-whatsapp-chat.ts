import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { whatsappChatApi } from '@/api/whatsapp-chat.api'
import { extractErrorMessage } from '@/lib/api-client'
import { queryKeys } from './query-keys'

// Fast polling while a chat panel is open — this is the closest thing to
// "live" this app has without a websocket/SSE channel.
const CHAT_REFRESH_INTERVAL_MS = 8_000
const INBOX_REFRESH_INTERVAL_MS = 15_000

export function useWhatsAppInbox() {
  return useQuery({
    queryKey: queryKeys.whatsappChat.inbox,
    queryFn: whatsappChatApi.listInbox,
    refetchInterval: INBOX_REFRESH_INTERVAL_MS,
  })
}

export function useWhatsAppThread(leadId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.whatsappChat.thread(leadId ?? ''),
    queryFn: () => whatsappChatApi.listMessages(leadId!),
    enabled: !!leadId && enabled,
    refetchInterval: CHAT_REFRESH_INTERVAL_MS,
  })
}

export function useSendWhatsAppMessage(leadId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (text: string) => whatsappChatApi.sendMessage(leadId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.whatsappChat.thread(leadId) })
    },
    onError: (error) => toast.error('Message not sent', { description: extractErrorMessage(error) }),
  })
}
