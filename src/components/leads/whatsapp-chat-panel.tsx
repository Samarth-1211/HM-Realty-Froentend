import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, CheckCheck, Clock, Download, FileText, ImageOff, RotateCw, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import {
  useBlobUrlRef,
  useMarkWhatsAppRead,
  useSendWhatsAppMessage,
  useSendWhatsAppTemplate,
  useWhatsAppMedia,
  useWhatsAppTemplates,
  useWhatsAppThread,
} from '@/hooks/queries/use-whatsapp-chat'
import { waDebug } from '@/lib/wa-debug-logger'
import { cn, formatFileSize } from '@/lib/utils'
import type { WhatsAppMessage } from '@/types'

function formatTime(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function MessageStatusIcon({ message }: { message: WhatsAppMessage }) {
  if (message.status === 'FAILED') return <AlertTriangle className="size-3 text-rose-300" />
  if (message.status === 'READ') return <CheckCheck className="size-3 text-sky-300" />
  if (message.status === 'DELIVERED') return <CheckCheck className="size-3 text-white/70" />
  if (message.status === 'SENT') return <Check className="size-3 text-white/70" />
  return <Clock className="size-3 text-white/70" />
}

const STATUS_LABEL: Record<WhatsAppMessage['status'], string> = {
  QUEUED: 'Sending',
  SENT: 'Sent',
  DELIVERED: 'Delivered',
  READ: 'Read',
  FAILED: 'Failed',
}

const MEDIA_TYPES = ['image', 'sticker', 'audio', 'video', 'document']

/** Inline preview of an attachment we copied out of Meta (fetched with auth as a Blob). */
function MessageMedia({ message, isOutbound }: { message: WhatsAppMessage; isOutbound: boolean }) {
  const stored = !!message.mediaStorageKey
  const { data: blob, isLoading, isError } = useWhatsAppMedia(message.leadId, message.id, stored)
  const imgRef = useBlobUrlRef<HTMLImageElement>(blob, 'src')
  const mediaRef = useBlobUrlRef<HTMLMediaElement>(blob, 'src')
  const linkRef = useBlobUrlRef<HTMLAnchorElement>(blob, 'href')

  const muted = isOutbound ? 'text-emerald-100' : 'text-slate-400'

  if (!stored) {
    return (
      <div className={cn('mb-1 flex items-center gap-1.5 text-xs', muted)}>
        <ImageOff className="size-3.5 shrink-0" />
        <span>
          {message.mediaError
            ? `${message.messageType} couldn't be saved: ${message.mediaError}`
            : `${message.messageType} — not stored`}
        </span>
      </div>
    )
  }
  if (isLoading) return <div className={cn('mb-1 text-xs', muted)}>Loading {message.messageType}…</div>
  if (isError || !blob) return <div className={cn('mb-1 text-xs', muted)}>Couldn't load the {message.messageType}</div>

  if (message.messageType === 'image' || message.messageType === 'sticker') {
    return (
      <a ref={linkRef} target="_blank" rel="noreferrer" className="mb-1 block">
        <img
          ref={imgRef}
          alt={message.textBody || message.messageType}
          className={cn('rounded-lg object-cover', message.messageType === 'sticker' ? 'size-28' : 'max-h-72 w-full')}
        />
      </a>
    )
  }
  if (message.messageType === 'audio') {
    return <audio ref={mediaRef} controls className="mb-1 h-10 w-64 max-w-full" />
  }
  if (message.messageType === 'video') {
    return <video ref={mediaRef} controls className="mb-1 max-h-72 w-full rounded-lg" />
  }
  return (
    <a
      ref={linkRef}
      download={message.mediaFileName ?? undefined}
      className={cn(
        'mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs',
        isOutbound ? 'bg-emerald-700/60' : 'bg-slate-50 ring-1 ring-slate-100',
      )}
    >
      <FileText className="size-5 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{message.mediaFileName || 'Document'}</span>
        <span className={muted}>{formatFileSize(message.mediaSize)}</span>
      </span>
      <Download className="size-4 shrink-0" />
    </a>
  )
}

function MessageBubble({ message }: { message: WhatsAppMessage }) {
  const isOutbound = message.direction === 'OUTBOUND'
  const isMedia = MEDIA_TYPES.includes(message.messageType)

  return (
    <div className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
          isOutbound ? 'rounded-br-sm bg-emerald-600 text-white' : 'rounded-bl-sm bg-white text-slate-700 ring-1 ring-slate-100',
        )}
      >
        {isMedia && <MessageMedia message={message} isOutbound={isOutbound} />}
        {(message.textBody || !isMedia) && <p className="whitespace-pre-wrap break-words">{message.textBody || '—'}</p>}
        {message.status === 'FAILED' && message.errorMessage && (
          <p className={cn('mt-1 text-xs', isOutbound ? 'text-rose-100' : 'text-rose-600')}>
            {message.errorMessage}
            {message.errorCode ? ` (code ${message.errorCode})` : ''}
          </p>
        )}
        <div
          className={cn('mt-1 flex items-center justify-end gap-1 text-[10px]', isOutbound ? 'text-emerald-100' : 'text-slate-400')}
          title={isOutbound ? STATUS_LABEL[message.status] : undefined}
        >
          {formatTime(message.waTimestamp ?? message.createdAt)}
          {isOutbound && <MessageStatusIcon message={message} />}
        </div>
      </div>
    </div>
  )
}

/** Shown once the 24-hour window has closed: WhatsApp then only allows approved templates. */
function TemplateSender({ leadId }: { leadId: string }) {
  const { data: templates, isLoading, isError } = useWhatsAppTemplates(true)
  const sendTemplate = useSendWhatsAppTemplate(leadId)
  const sendable = templates?.filter((t) => t.sendable) ?? []
  const [choice, setChoice] = useState('')
  const selected = sendable.find((t) => `${t.name}|${t.language}` === choice)

  if (isLoading) return <p className="text-xs text-slate-400">Loading approved templates…</p>
  if (isError) return <p className="text-xs text-slate-400">Approved templates couldn't be loaded.</p>
  if (!sendable.length) {
    return (
      <p className="text-xs text-slate-400">
        No approved template without variables on this WhatsApp account — create one in WhatsApp Manager to restart conversations.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Select value={choice} onChange={(e) => setChoice(e.target.value)}>
            <option value="">Choose an approved template…</option>
            {sendable.map((t) => (
              <option key={`${t.name}|${t.language}`} value={`${t.name}|${t.language}`}>
                {t.name} ({t.language})
              </option>
            ))}
          </Select>
        </div>
        <Button
          size="sm"
          disabled={!selected}
          loading={sendTemplate.isPending}
          onClick={() => selected && sendTemplate.mutate({ name: selected.name, language: selected.language }, { onSuccess: () => setChoice('') })}
        >
          <Send className="size-3.5" />
          Send template
        </Button>
      </div>
      {selected?.body && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">{selected.body}</p>}
    </div>
  )
}

export function WhatsAppChatPanel({ leadId, className }: { leadId: string; className?: string }) {
  const { data: thread, isLoading, isError, refetch, isFetching } = useWhatsAppThread(leadId)
  const sendMessage = useSendWhatsAppMessage(leadId)
  const markRead = useMarkWhatsAppRead()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    waDebug.info('thread polling on', { leadId })
    return () => waDebug.info('thread polling off', { leadId })
  }, [leadId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [thread?.messages.length])

  // Opening the thread — or a new inbound message arriving while it's open —
  // clears its unread badge in the inbox.
  const lastInboundId = thread?.messages.findLast((m) => m.direction === 'INBOUND')?.id
  const { mutate: markReadMutate } = markRead
  useEffect(() => {
    if (lastInboundId) markReadMutate(leadId)
  }, [leadId, lastInboundId, markReadMutate])

  const onSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    sendMessage.mutate(trimmed, { onSuccess: () => setText('') })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (isError || !thread) {
    return (
      <div className="flex min-h-[20rem] flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="size-6 text-rose-400" />
        <p className="text-sm text-slate-500">Couldn't load this conversation.</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()} loading={isFetching}>
          <RotateCw className="size-3.5" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('flex h-[32rem] flex-col overflow-hidden rounded-xl border border-slate-100', className)}>
      <div className="flex-1 space-y-2.5 overflow-y-auto bg-[#e5ded8] p-4">
        {thread.messages.length === 0 ? (
          <p className="pt-10 text-center text-sm text-slate-500">No messages yet.</p>
        ) : (
          thread.messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-100 bg-white p-3">
        {!thread.withinServiceWindow ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <p>
                <span className="font-medium">24-hour window closed.</span> WhatsApp only allows approved template messages
                until the lead messages you again.
              </p>
            </div>
            <TemplateSender leadId={leadId} />
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSend()
                }
              }}
              disabled={sendMessage.isPending}
              placeholder="Type a message…"
              rows={1}
              className="h-10 max-h-28 flex-1 resize-none rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            />
            <Button size="icon" onClick={onSend} disabled={!text.trim()} loading={sendMessage.isPending}>
              <Send className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
