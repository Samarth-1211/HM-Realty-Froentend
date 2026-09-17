import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, CheckCheck, Clock, FileWarning, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useSendWhatsAppMessage, useWhatsAppThread } from '@/hooks/queries/use-whatsapp-chat'
import { cn } from '@/lib/utils'
import type { WhatsAppMessage } from '@/types'

function formatTime(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function MessageStatusIcon({ message }: { message: WhatsAppMessage }) {
  if (message.status === 'FAILED') return <AlertTriangle className="size-3 text-rose-500" />
  if (message.status === 'READ') return <CheckCheck className="size-3 text-sky-300" />
  if (message.status === 'DELIVERED') return <CheckCheck className="size-3 text-white/70" />
  if (message.status === 'SENT') return <Check className="size-3 text-white/70" />
  return <Clock className="size-3 text-white/70" />
}

function MessageBubble({ message }: { message: WhatsAppMessage }) {
  const isOutbound = message.direction === 'OUTBOUND'
  const isMedia = message.messageType !== 'text' && message.messageType !== 'location'

  return (
    <div className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
          isOutbound ? 'rounded-br-sm bg-emerald-600 text-white' : 'rounded-bl-sm bg-white text-slate-700 ring-1 ring-slate-100',
        )}
      >
        {isMedia && (
          <div className={cn('mb-1 flex items-center gap-1.5 text-xs', isOutbound ? 'text-emerald-100' : 'text-slate-400')}>
            <FileWarning className="size-3.5" />
            <span className="capitalize">{message.messageType}</span>
          </div>
        )}
        <p className="whitespace-pre-wrap break-words">{message.textBody || '—'}</p>
        {message.status === 'FAILED' && message.errorMessage && (
          <p className={cn('mt-1 text-xs', isOutbound ? 'text-rose-100' : 'text-rose-600')}>{message.errorMessage}</p>
        )}
        <div className={cn('mt-1 flex items-center justify-end gap-1 text-[10px]', isOutbound ? 'text-emerald-100' : 'text-slate-400')}>
          {formatTime(message.waTimestamp ?? message.createdAt)}
          {isOutbound && <MessageStatusIcon message={message} />}
        </div>
      </div>
    </div>
  )
}

export function WhatsAppChatPanel({ leadId, className }: { leadId: string; className?: string }) {
  const { data: thread, isLoading } = useWhatsAppThread(leadId)
  const sendMessage = useSendWhatsAppMessage(leadId)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [thread?.messages.length])

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

  if (!thread) return null

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
        {!thread.withinServiceWindow && (
          <div className="mb-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <p>
              <span className="font-medium">24-hour window closed.</span> WhatsApp blocks free-form replies once 24
              hours have passed since the lead's last message. Ask them to message you again to reopen it.
            </p>
          </div>
        )}
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
            disabled={!thread.withinServiceWindow || sendMessage.isPending}
            placeholder={thread.withinServiceWindow ? 'Type a message…' : 'Reply unavailable — 24-hour window closed'}
            rows={1}
            className="h-10 max-h-28 flex-1 resize-none rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          />
          <Button
            size="icon"
            onClick={onSend}
            disabled={!thread.withinServiceWindow || !text.trim()}
            loading={sendMessage.isPending}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
