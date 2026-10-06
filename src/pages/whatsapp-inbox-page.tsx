import { type ReactNode, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft, Bug, Camera, FileText, Info, MessageCircle, Mic, RotateCw, Search, Video, X } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { PageLoader } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { LeadStatusBadge } from '@/components/leads/lead-status-badge'
import { MessageTicks, WhatsAppChatPanel } from '@/components/leads/whatsapp-chat-panel'
import { WhatsAppAvatar } from '@/components/leads/whatsapp-avatar'
import { WhatsAppContactInfo } from '@/components/leads/whatsapp-contact-info'
import { WhatsAppDemoPreview } from '@/components/leads/whatsapp-demo-preview'
import { WhatsAppMark } from '@/components/integrations/whatsapp-mark'
import { useWhatsAppInbox } from '@/hooks/queries/use-whatsapp-chat'
import type { WhatsAppInboxItem } from '@/api/whatsapp-chat.api'
import { useWhatsAppIntegration } from '@/hooks/queries/use-whatsapp-integration'
import { useAuthStore } from '@/store/auth-store'
import { APP_NAME } from '@/lib/constants'
import { waListTime, whatsappDisplayName } from '@/lib/whatsapp-format'
import { UserRole } from '@/types'
import { cn, formatEnumLabel } from '@/lib/utils'

type ChatFilter = 'all' | 'unread'

const MEDIA_PREVIEWS: Record<string, { icon: typeof Camera; label: string }> = {
  image: { icon: Camera, label: 'Photo' },
  video: { icon: Video, label: 'Video' },
  audio: { icon: Mic, label: 'Audio' },
  document: { icon: FileText, label: 'Document' },
}

const digits = (value: string) => value.replace(/\D/g, '')

function matchesSearch(item: WhatsAppInboxItem, search: string) {
  const term = search.trim().toLowerCase()
  if (!term) return true
  if (item.fullName.toLowerCase().includes(term)) return true
  return !!digits(term) && digits(item.phone).includes(digits(term))
}

export function WhatsAppInboxPage() {
  const user = useAuthStore((s) => s.user)
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN

  const { data: integration, isLoading: integrationLoading } = useWhatsAppIntegration()
  const { data: inbox, isLoading: inboxLoading, isError: inboxError, refetch, isFetching } = useWhatsAppInbox()
  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>()
  const [infoOpen, setInfoOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ChatFilter>('all')

  if (integrationLoading || inboxLoading) return <PageLoader label="Loading WhatsApp conversations…" />

  const isConnected = integration?.status === 'CONNECTED'
  const hasConversations = !!inbox && inbox.length > 0

  if (inboxError || !hasConversations) {
    return (
      <div>
        <PageHeader
          title="WhatsApp Inbox"
          description="Every lead conversation that came in over WhatsApp, in one place."
          actions={
            canEdit && (
              <ButtonLink to="/admin/whatsapp-debug" variant="outline" size="sm">
                <Bug className="size-3.5" />
                Debug console
              </ButtonLink>
            )
          }
        />
        {inboxError ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white py-16 text-center">
            <AlertTriangle className="size-8 text-rose-300" />
            <p className="text-sm font-medium text-slate-600">Couldn't load WhatsApp conversations</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()} loading={isFetching}>
              <RotateCw className="size-3.5" />
              Retry
            </Button>
          </div>
        ) : !isConnected ? (
          <WhatsAppDemoPreview canEdit={canEdit} />
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white py-16 text-center">
            <MessageCircle className="size-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No WhatsApp conversations yet</p>
            <p className="max-w-sm text-xs text-slate-400">
              Once someone messages your connected WhatsApp number, the conversation will show up here automatically.
            </p>
          </div>
        )}
      </div>
    )
  }

  // A chat that leaves the inbox (its lead was reassigned away) closes itself.
  const selected = inbox.find((item) => item.id === selectedLeadId)
  const unreadChats = inbox.filter((item) => item.unreadCount > 0).length
  const visible = inbox.filter((item) => matchesSearch(item, search) && (filter === 'all' || item.unreadCount > 0))

  const openChat = (leadId: string) => {
    setSelectedLeadId(leadId)
    setInfoOpen(false)
  }

  return (
    <div className="flex h-[calc(100dvh-11.25rem)] min-h-[30rem] overflow-hidden rounded-xl border border-wa-line bg-white font-wa shadow-sm lg:h-[calc(100dvh-7.25rem)]">
      {/* Chat list — on phones it gives way to the open chat. */}
      <aside
        className={cn(
          'w-full shrink-0 flex-col border-wa-line md:flex md:w-[340px] md:border-r xl:w-[380px]',
          selected ? 'hidden' : 'flex',
        )}
      >
        <div className="flex h-[60px] shrink-0 items-center justify-between px-4">
          <h2 className="text-[22px] font-bold text-wa-ink">Chats</h2>
          {canEdit && (
            <Link
              to="/admin/whatsapp-debug"
              title="Debug console"
              aria-label="Debug console"
              className="flex size-10 items-center justify-center rounded-full text-wa-icon transition-colors hover:bg-wa-panel"
            >
              <Bug className="size-5" />
            </Link>
          )}
        </div>

        <div className="px-3">
          <label className="flex h-9 items-center gap-3 rounded-lg bg-wa-panel px-3">
            <Search className="size-4 shrink-0 text-wa-icon" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or number"
              aria-label="Search chats"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-wa-ink placeholder:text-wa-muted focus:outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="text-wa-icon">
                <X className="size-4" />
              </button>
            )}
          </label>
        </div>

        <div className="flex gap-2 px-3 py-2">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </FilterChip>
          <FilterChip active={filter === 'unread'} onClick={() => setFilter('unread')}>
            Unread{unreadChats > 0 ? ` ${unreadChats}` : ''}
          </FilterChip>
        </div>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-wa-muted">
              {search.trim() ? 'No chats found' : 'No unread chats'}
            </p>
          ) : (
            visible.map((item) => (
              <ChatRow key={item.id} item={item} active={item.id === selected?.id} onOpen={() => openChat(item.id)} />
            ))
          )}
        </div>
      </aside>

      <section className={cn('relative min-w-0 flex-1 md:flex', selected ? 'flex' : 'hidden')}>
        {selected ? (
          <>
            <div className="flex min-w-0 flex-1 flex-col">
              <ChatHeader
                item={selected}
                isOwnChat={selected.assignedTo?.id === user?.id}
                onBack={() => setSelectedLeadId(undefined)}
                onOpenInfo={() => setInfoOpen(true)}
              />
              <WhatsAppChatPanel leadId={selected.id} className="h-auto min-h-0 flex-1 rounded-none border-0" />
            </div>
            {/* Beside the chat on very wide screens; over it everywhere else. */}
            {infoOpen && (
              <div className="absolute inset-0 z-10 animate-fade-in border-wa-line 2xl:static 2xl:w-[360px] 2xl:shrink-0 2xl:border-l">
                <WhatsAppContactInfo leadId={selected.id} summary={selected} onClose={() => setInfoOpen(false)} />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-wa-panel px-8 text-center">
            <WhatsAppMark size="lg" className="rounded-full" />
            <h2 className="text-[28px] font-light text-wa-ink">WhatsApp Inbox</h2>
            <p className="max-w-sm text-sm leading-5 text-wa-muted">
              Pick a chat on the left to read it and reply to your lead without leaving {APP_NAME}.
            </p>
            {integration?.displayPhoneNumber && (
              <p className="text-[13px] text-wa-muted">Connected number: {integration.displayPhoneNumber}</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full px-3 py-1 text-sm transition-colors',
        active ? 'bg-wa-out text-wa-green-dark' : 'bg-wa-panel text-wa-icon hover:bg-wa-line',
      )}
    >
      {children}
    </button>
  )
}

function LastMessagePreview({ message }: { message: WhatsAppInboxItem['lastMessage'] }) {
  if (!message) return <span className="truncate">No messages yet</span>
  const media = MEDIA_PREVIEWS[message.messageType]
  const fallback = message.messageType === 'text' ? '' : formatEnumLabel(message.messageType)

  return (
    <>
      {message.direction === 'OUTBOUND' && <MessageTicks status={message.status} />}
      {media && <media.icon className="size-4 shrink-0" />}
      <span className="truncate">{message.textBody || media?.label || fallback}</span>
    </>
  )
}

function ChatRow({ item, active, onOpen }: { item: WhatsAppInboxItem; active: boolean; onOpen: () => void }) {
  const unread = item.unreadCount > 0
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-center gap-3 pl-3 text-left transition-colors hover:bg-wa-hover',
        active && 'bg-wa-panel hover:bg-wa-panel',
      )}
    >
      <WhatsAppAvatar className="size-[49px]" />
      <div className="flex h-[72px] min-w-0 flex-1 flex-col justify-center gap-0.5 border-b border-wa-line pr-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className={cn('truncate text-[17px] leading-[21px] text-wa-ink', unread && 'font-medium')}>
            {whatsappDisplayName(item)}
          </span>
          <span className={cn('shrink-0 text-xs', unread ? 'font-medium text-wa-green' : 'text-wa-muted')}>
            {waListTime(item.lastMessage?.createdAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className={cn('flex min-w-0 items-center gap-1 text-sm leading-5', unread ? 'text-wa-ink' : 'text-wa-muted')}>
            <LastMessagePreview message={item.lastMessage} />
          </span>
          {unread && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-wa-unread px-1.5 text-xs font-medium text-white">
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function ChatHeader({
  item,
  isOwnChat,
  onBack,
  onOpenInfo,
}: {
  item: WhatsAppInboxItem
  isOwnChat: boolean
  onBack: () => void
  onOpenInfo: () => void
}) {
  // Managers and Admins read other people's chats — say whose this one is.
  const owner = isOwnChat
    ? null
    : item.assignedTo
      ? `Assigned to ${item.assignedTo.firstName} ${item.assignedTo.lastName}`
      : 'Unassigned'

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-2 bg-wa-panel px-2 sm:px-4">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to chats"
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-wa-icon hover:bg-wa-line md:hidden"
      >
        <ArrowLeft className="size-5" />
      </button>
      <button type="button" onClick={onOpenInfo} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <WhatsAppAvatar className="size-10" />
        <span className="min-w-0">
          <span className="block truncate text-base leading-[21px] text-wa-ink">{whatsappDisplayName(item)}</span>
          <span className="block truncate text-[13px] leading-5 text-wa-muted">
            {owner ? `${owner} · ` : ''}click here for contact info
          </span>
        </span>
      </button>
      <span className="hidden shrink-0 sm:block">
        <LeadStatusBadge status={item.status} />
      </span>
      <button
        type="button"
        onClick={onOpenInfo}
        aria-label="Contact info"
        title="Contact info"
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-wa-icon transition-colors hover:bg-wa-line"
      >
        <Info className="size-5" />
      </button>
    </header>
  )
}
