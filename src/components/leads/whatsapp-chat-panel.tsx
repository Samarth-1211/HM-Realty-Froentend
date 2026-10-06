import { Fragment, type ReactNode, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, CheckCheck, CircleAlert, Clock, Download, FileText, ImageOff, RotateCw, Send, SendHorizontal } from 'lucide-react'
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
import { isSameDay, MEDIA_TYPES, waClockTime, waDayLabel } from '@/lib/whatsapp-format'
import type { WhatsAppMessage } from '@/types'

const BUBBLE_SHADOW = 'shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]'

/** WhatsApp's delivery ticks: one grey = sent, two grey = delivered, two blue = read. */
export function MessageTicks({ status, className }: { status: WhatsAppMessage['status']; className?: string }) {
  if (status === 'FAILED') return <CircleAlert className={cn('size-3.5 shrink-0 text-rose-500', className)} />
  if (status === 'READ') return <CheckCheck className={cn('size-4 shrink-0 text-wa-tick', className)} />
  if (status === 'DELIVERED') return <CheckCheck className={cn('size-4 shrink-0 text-wa-muted', className)} />
  if (status === 'SENT') return <Check className={cn('size-4 shrink-0 text-wa-muted', className)} />
  return <Clock className={cn('size-3 shrink-0 text-wa-muted', className)} />
}

const STATUS_LABEL: Record<WhatsAppMessage['status'], string> = {
  QUEUED: 'Sending',
  SENT: 'Sent',
  DELIVERED: 'Delivered',
  READ: 'Read',
  FAILED: 'Failed',
}

/** Inline preview of an attachment we copied out of Meta (fetched with auth as a Blob). */
function MessageMedia({ message, isOutbound }: { message: WhatsAppMessage; isOutbound: boolean }) {
  const stored = !!message.mediaStorageKey
  const { data: blob, isLoading, isError } = useWhatsAppMedia(message.leadId, message.id, stored)
  const imgRef = useBlobUrlRef<HTMLImageElement>(blob, 'src')
  const mediaRef = useBlobUrlRef<HTMLMediaElement>(blob, 'src')
  const linkRef = useBlobUrlRef<HTMLAnchorElement>(blob, 'href')

  if (!stored) {
    return (
      <div className="mb-1 flex items-center gap-1.5 text-xs text-wa-muted">
        <ImageOff className="size-3.5 shrink-0" />
        <span>
          {message.mediaError
            ? `${message.messageType} couldn't be saved: ${message.mediaError}`
            : `${message.messageType} — not stored`}
        </span>
      </div>
    )
  }
  if (isLoading) return <div className="mb-1 text-xs text-wa-muted">Loading {message.messageType}…</div>
  if (isError || !blob) return <div className="mb-1 text-xs text-wa-muted">Couldn't load the {message.messageType}</div>

  if (message.messageType === 'image' || message.messageType === 'sticker') {
    return (
      <a ref={linkRef} target="_blank" rel="noreferrer" className="mb-1 block">
        <img
          ref={imgRef}
          alt={message.textBody || message.messageType}
          className={cn('rounded-md object-cover', message.messageType === 'sticker' ? 'size-28' : 'max-h-72 w-full')}
        />
      </a>
    )
  }
  if (message.messageType === 'audio') {
    return <audio ref={mediaRef} controls className="mb-1 h-10 w-64 max-w-full" />
  }
  if (message.messageType === 'video') {
    return <video ref={mediaRef} controls className="mb-1 max-h-72 w-full rounded-md" />
  }
  return (
    <a
      ref={linkRef}
      download={message.mediaFileName ?? undefined}
      className={cn('mb-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-xs', isOutbound ? 'bg-[#d1f4cc]' : 'bg-wa-hover')}
    >
      <FileText className="size-5 shrink-0 text-wa-icon" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{message.mediaFileName || 'Document'}</span>
        <span className="text-wa-muted">{formatFileSize(message.mediaSize)}</span>
      </span>
      <Download className="size-4 shrink-0 text-wa-icon" />
    </a>
  )
}

/** The little corner that points a bubble at its sender — on the first bubble of a run only. */
function BubbleTail({ isOutbound }: { isOutbound: boolean }) {
  return (
    <svg
      viewBox="0 0 8 13"
      aria-hidden="true"
      className={cn('absolute top-0 h-[13px] w-2', isOutbound ? '-right-2 text-wa-out' : '-left-2 text-white')}
    >
      <path
        fill="currentColor"
        d={
          isOutbound
            ? 'M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z'
            : 'M1.533 2.568 8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z'
        }
      />
    </svg>
  )
}

function MessageBubble({ message, startsRun }: { message: WhatsAppMessage; startsRun: boolean }) {
  const isOutbound = message.direction === 'OUTBOUND'
  const isMedia = MEDIA_TYPES.includes(message.messageType)
  const showText = !!message.textBody || !isMedia

  return (
    <div className={cn('flex', isOutbound ? 'justify-end' : 'justify-start', startsRun ? 'mt-3' : 'mt-0.5')}>
      <div
        className={cn(
          'relative max-w-[85%] rounded-lg px-2.5 pb-2 pt-1.5 text-[14.2px] leading-[19px] text-wa-ink sm:max-w-[65%]',
          BUBBLE_SHADOW,
          isOutbound ? 'bg-wa-out' : 'bg-white',
          startsRun && (isOutbound ? 'rounded-tr-none' : 'rounded-tl-none'),
        )}
      >
        {startsRun && <BubbleTail isOutbound={isOutbound} />}
        {isMedia && <MessageMedia message={message} isOutbound={isOutbound} />}
        {showText ? (
          <p className="whitespace-pre-wrap break-words">
            {message.textBody || '—'}
            {/* Keeps the last line clear of the time and ticks pinned to the corner. */}
            <span aria-hidden="true" className={cn('inline-block h-0', isOutbound ? 'w-[78px]' : 'w-[58px]')} />
          </p>
        ) : (
          <div className="h-3.5 min-w-[84px]" />
        )}
        {message.status === 'FAILED' && message.errorMessage && (
          <p className="mb-3 mt-1 text-xs text-rose-600">
            {message.errorMessage}
            {message.errorCode ? ` (code ${message.errorCode})` : ''}
          </p>
        )}
        <div
          className="absolute bottom-1 right-2 flex items-center gap-1 text-[11px] leading-[15px] text-wa-muted"
          title={isOutbound ? STATUS_LABEL[message.status] : undefined}
        >
          {waClockTime(message.waTimestamp ?? message.createdAt)}
          {isOutbound && <MessageTicks status={message.status} />}
        </div>
      </div>
    </div>
  )
}

/** A centred chip in the chat: the day divider, or (as a `notice`) a line from the system. */
function CenterNote({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'notice' }) {
  return (
    <div className="flex justify-center">
      <span
        className={cn(
          'max-w-md rounded-lg px-3 py-1.5 text-center text-[12.5px] leading-[17px] text-wa-icon',
          BUBBLE_SHADOW,
          tone === 'notice' ? 'bg-[#ffeecd]' : 'bg-white',
        )}
      >
        {children}
      </span>
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

  if (isLoading) return <p className="text-xs text-wa-muted">Loading approved templates…</p>
  if (isError) return <p className="text-xs text-wa-muted">Approved templates couldn't be loaded.</p>
  if (!sendable.length) {
    return (
      <p className="text-xs text-wa-muted">
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
      {selected?.body && <p className="rounded-lg bg-white px-3 py-2 text-xs text-wa-icon">{selected.body}</p>}
    </div>
  )
}

const COMPOSER_MAX_HEIGHT_PX = 128

export function WhatsAppChatPanel({ leadId, className }: { leadId: string; className?: string }) {
  const { data: thread, isLoading, isError, refetch, isFetching } = useWhatsAppThread(leadId)
  const sendMessage = useSendWhatsAppMessage(leadId)
  const markRead = useMarkWhatsAppRead()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    waDebug.info('thread polling on', { leadId })
    return () => waDebug.info('thread polling off', { leadId })
  }, [leadId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [thread?.messages.length])

  // The message box grows with what's typed, up to a few lines — and the
  // messages above stay where they were, measured from the bottom.
  useEffect(() => {
    const el = composerRef.current
    const list = listRef.current
    if (!el || !list) return
    const fromBottom = list.scrollHeight - list.scrollTop - list.clientHeight
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT_PX)}px`
    list.scrollTop = list.scrollHeight - list.clientHeight - fromBottom
  }, [text])

  // Opening the thread — or a new inbound message arriving while it's open —
  // clears its unread badge in the inbox.
  const lastInboundId = thread?.messages.findLast((m) => m.direction === 'INBOUND')?.id
  const { mutate: markReadMutate } = markRead
  useEffect(() => {
    if (lastInboundId) markReadMutate(leadId)
  }, [leadId, lastInboundId, markReadMutate])

  const onSend = () => {
    const trimmed = text.trim()
    if (!trimmed || sendMessage.isPending) return
    sendMessage.mutate(trimmed, { onSuccess: () => setText('') })
  }

  const frame = cn('flex h-[32rem] flex-col overflow-hidden rounded-xl border border-wa-line font-wa', className)

  if (isLoading) {
    return (
      <div className={cn(frame, 'wa-wallpaper items-center justify-center')}>
        <Spinner className="text-wa-green" />
      </div>
    )
  }

  if (isError || !thread) {
    return (
      <div className={cn(frame, 'wa-wallpaper items-center justify-center gap-3 text-center')}>
        <AlertTriangle className="size-6 text-rose-400" />
        <p className="text-sm text-wa-icon">Couldn't load this conversation.</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()} loading={isFetching}>
          <RotateCw className="size-3.5" />
          Retry
        </Button>
      </div>
    )
  }

  const sentAt = (m: WhatsAppMessage) => m.waTimestamp ?? m.createdAt
  const canSend = !!text.trim()

  return (
    <div className={frame}>
      <div ref={listRef} className="wa-wallpaper flex-1 overflow-y-auto px-4 py-3 sm:px-[5%]">
        <CenterNote tone="notice">
          Messages here go through your WhatsApp Business number. You can reply freely for 24 hours after the lead's last
          message.
        </CenterNote>
        {thread.messages.length === 0 && (
          <div className="mt-3">
            <CenterNote>No messages yet.</CenterNote>
          </div>
        )}
        {thread.messages.map((message, i) => {
          const previous = thread.messages[i - 1]
          const startsDay = !previous || !isSameDay(sentAt(previous), sentAt(message))
          return (
            <Fragment key={message.id}>
              {startsDay && (
                <div className="mt-3">
                  <CenterNote>{waDayLabel(sentAt(message))}</CenterNote>
                </div>
              )}
              <MessageBubble message={message} startsRun={startsDay || previous.direction !== message.direction} />
            </Fragment>
          )
        })}
        <div ref={bottomRef} className="h-2" />
      </div>

      <div className="bg-wa-panel px-3 py-2.5">
        {!thread.withinServiceWindow ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2 rounded-lg bg-[#ffeecd] px-3 py-2 text-xs text-wa-icon">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <p>
                <span className="font-semibold">24-hour window closed.</span> WhatsApp only allows approved template messages
                until the lead messages you again.
              </p>
            </div>
            <TemplateSender leadId={leadId} />
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={composerRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSend()
                }
              }}
              disabled={sendMessage.isPending}
              placeholder="Type a message"
              rows={1}
              className="min-h-[42px] flex-1 resize-none rounded-lg border-0 bg-white px-3 py-2.5 text-[15px] leading-[22px] text-wa-ink placeholder:text-wa-muted focus:outline-none disabled:cursor-not-allowed disabled:text-wa-muted"
            />
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend || sendMessage.isPending}
              aria-label="Send"
              title="Send"
              className={cn(
                'flex size-[42px] shrink-0 items-center justify-center rounded-full transition-colors',
                canSend ? 'bg-wa-green text-white hover:bg-wa-green-dark' : 'text-wa-icon',
              )}
            >
              {sendMessage.isPending ? <Spinner className="text-current" /> : <SendHorizontal className="size-5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
