import { useCallback, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { whatsappChatApi } from '@/api/whatsapp-chat.api'
import { extractErrorMessage } from '@/lib/api-client'
import { waDebug } from '@/lib/wa-debug-logger'
import { queryKeys } from './query-keys'

// Fast polling while a chat is open — the app has no websocket/SSE channel,
// so this is what makes new inbound messages appear without a refresh.
// TanStack Query pauses it while the tab is in the background.
const CHAT_REFRESH_INTERVAL_MS = 4_000
const INBOX_REFRESH_INTERVAL_MS = 5_000

export function useWhatsAppInbox() {
  return useQuery({
    queryKey: queryKeys.whatsappChat.inbox,
    queryFn: whatsappChatApi.listInbox,
    refetchInterval: INBOX_REFRESH_INTERVAL_MS,
  })
}

export function useWhatsAppThread(leadId: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.whatsappChat.thread(leadId ?? ''),
    queryFn: () => whatsappChatApi.listMessages(leadId!),
    enabled: !!leadId && enabled,
    refetchInterval: CHAT_REFRESH_INTERVAL_MS,
  })

  // Debug log: note each inbound message the first time it shows up on screen.
  const seen = useRef<{ leadId?: string; ids: Set<string> }>({ ids: new Set() })
  useEffect(() => {
    const messages = query.data?.messages
    if (!messages) return
    if (seen.current.leadId !== leadId) {
      seen.current = { leadId, ids: new Set(messages.map((m) => m.id)) }
      waDebug.info('thread loaded', { leadId, messages: messages.length })
      return
    }
    for (const m of messages) {
      if (seen.current.ids.has(m.id)) continue
      seen.current.ids.add(m.id)
      if (m.direction === 'INBOUND') {
        waDebug.info('new inbound message shown in UI', { leadId, messageId: m.id, type: m.messageType })
      }
    }
  }, [query.data, leadId])

  return query
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

/** Clears the thread's unread count for the current user — silent on failure, it's only a badge. */
export function useMarkWhatsAppRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (leadId: string) => whatsappChatApi.markRead(leadId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.whatsappChat.inbox }),
  })
}

/** A stored attachment as a Blob (cached for the session). */
export function useWhatsAppMedia(leadId: string, messageId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.whatsappChat.media(messageId),
    queryFn: () => whatsappChatApi.fetchMedia(leadId, messageId),
    enabled,
    staleTime: Infinity,
    retry: false,
  })
}

/**
 * Ref callback that points an element's src/href at a Blob via an object
 * URL, revoking it when the element goes away (React 19 ref cleanup).
 */
export function useBlobUrlRef<T extends HTMLElement>(blob: Blob | undefined, attr: 'src' | 'href') {
  return useCallback(
    (el: T | null) => {
      if (!el || !blob) return
      const url = URL.createObjectURL(blob)
      el.setAttribute(attr, url)
      return () => URL.revokeObjectURL(url)
    },
    [blob, attr],
  )
}

export function useWhatsAppTemplates(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.whatsappChat.templates,
    queryFn: whatsappChatApi.listTemplates,
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  })
}

export function useSendWhatsAppTemplate(leadId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, language }: { name: string; language: string }) =>
      whatsappChatApi.sendTemplate(leadId, name, language),
    onSuccess: () => {
      toast.success('Template sent')
      qc.invalidateQueries({ queryKey: queryKeys.whatsappChat.thread(leadId) })
    },
    onError: (error) => toast.error('Template not sent', { description: extractErrorMessage(error) }),
  })
}
