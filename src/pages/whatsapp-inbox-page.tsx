import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { PageLoader } from '@/components/ui/spinner'
import { LeadStatusBadge } from '@/components/leads/lead-status-badge'
import { WhatsAppChatPanel } from '@/components/leads/whatsapp-chat-panel'
import { WhatsAppDemoPreview } from '@/components/leads/whatsapp-demo-preview'
import { WhatsAppMark } from '@/components/integrations/whatsapp-mark'
import { useWhatsAppInbox } from '@/hooks/queries/use-whatsapp-chat'
import { useWhatsAppIntegration } from '@/hooks/queries/use-whatsapp-integration'
import { useAuthStore } from '@/store/auth-store'
import { UserRole } from '@/types'
import { cn } from '@/lib/utils'

function relativeSnippetTime(value: string | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const isToday = date.toDateString() === new Date().toDateString()
  return isToday
    ? new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(date)
    : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(date)
}

export function WhatsAppInboxPage() {
  const user = useAuthStore((s) => s.user)
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN

  const { data: integration, isLoading: integrationLoading } = useWhatsAppIntegration()
  const { data: inbox, isLoading: inboxLoading } = useWhatsAppInbox()
  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>()

  useEffect(() => {
    if (!selectedLeadId && inbox && inbox.length > 0) {
      setSelectedLeadId(inbox[0].id)
    }
  }, [inbox, selectedLeadId])

  const isLoading = integrationLoading || inboxLoading

  if (isLoading) return <PageLoader label="Loading WhatsApp conversations…" />

  const isConnected = integration?.status === 'CONNECTED'
  const hasConversations = !!inbox && inbox.length > 0

  return (
    <div>
      <PageHeader title="WhatsApp Inbox" description="Every lead conversation that came in over WhatsApp, in one place." />

      {!hasConversations && !isConnected ? (
        <WhatsAppDemoPreview canEdit={canEdit} />
      ) : !hasConversations ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white py-16 text-center">
          <MessageCircle className="size-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No WhatsApp conversations yet</p>
          <p className="max-w-sm text-xs text-slate-400">
            Once someone messages your connected WhatsApp number, the conversation will show up here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-100 sm:grid-cols-[300px_1fr]" style={{ height: '36rem' }}>
          <div className="flex flex-col overflow-y-auto border-b border-slate-100 sm:border-b-0 sm:border-r">
            {inbox!.map((item) => {
              const isActive = item.id === selectedLeadId
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedLeadId(item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50',
                    isActive && 'bg-brand-50 hover:bg-brand-50',
                  )}
                >
                  <WhatsAppMark size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-700">{item.fullName}</p>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {relativeSnippetTime(item.lastMessage?.createdAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-400">
                      {item.lastMessage?.direction === 'OUTBOUND' ? 'You: ' : ''}
                      {item.lastMessage?.textBody || '—'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex min-h-0 flex-col">
            {selectedLeadId ? (
              <>
                <ChatHeader leadId={selectedLeadId} inbox={inbox!} />
                <WhatsAppChatPanel leadId={selectedLeadId} className="h-auto min-h-0 flex-1 rounded-none border-0" />
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                Select a conversation to view it
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ChatHeader({ leadId, inbox }: { leadId: string; inbox: { id: string; fullName: string; phone: string; status: string; assignedTo: { firstName: string; lastName: string } | null }[] }) {
  const lead = inbox.find((i) => i.id === leadId)
  if (!lead) return null

  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">{lead.fullName}</p>
        <p className="text-xs text-slate-400">
          {lead.phone}
          {lead.assignedTo ? ` · ${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : ''}
        </p>
      </div>
      <LeadStatusBadge status={lead.status} />
    </div>
  )
}
