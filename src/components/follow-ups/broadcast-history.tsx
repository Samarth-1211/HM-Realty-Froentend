import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CheckCheck, FileText, History, Loader2, MessageSquareReply, OctagonX, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { StatusPill } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Tabs } from '@/components/ui/tabs'
import { useBroadcast, useBroadcastRecipients, useBroadcasts, useCancelBroadcast } from '@/hooks/queries/use-follow-ups'
import { extractErrorMessage } from '@/lib/api-client'
import { cn, formatDateTime, formatLeadNumber } from '@/lib/utils'
import type { BroadcastRecipient, BroadcastStats, BroadcastStatus } from '@/api/follow-ups.api'

const STATUS_STYLES: Record<BroadcastStatus, { label: string; className: string }> = {
  QUEUED: { label: 'Queued', className: 'bg-slate-100 text-slate-600 ring-slate-500/20' },
  SENDING: { label: 'Sending…', className: 'bg-sky-100 text-sky-700 ring-sky-600/20' },
  COMPLETED: { label: 'Sent', className: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20' },
  CANCELLED: { label: 'Stopped', className: 'bg-amber-100 text-amber-700 ring-amber-600/20' },
  FAILED: { label: 'Stopped by an error', className: 'bg-rose-100 text-rose-700 ring-rose-600/20' },
}

/** "project_follow_up" → "Project follow up". */
const prettyTemplate = (name: string) => {
  const words = name.replace(/_/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function BroadcastHistory({ openId, onOpen }: { openId: string | null; onOpen: (id: string | null) => void }) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useBroadcasts(page)

  return (
    <>
      <Card>
        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Spinner className="size-7" />
          </div>
        ) : !data?.items.length ? (
          <div className="p-4">
            <EmptyState
              icon={History}
              title="No follow-ups sent yet"
              description="Pick leads on the “Send follow-ups” tab and send them a WhatsApp message — it shows up here with delivery, read and reply counts."
            />
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {data.items.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(b.id)}
                    className="flex w-full flex-col gap-3 px-5 py-4 text-left hover:bg-brand-50/40 md:flex-row md:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-800">{prettyTemplate(b.templateName)}</p>
                        <StatusPill label={STATUS_STYLES[b.status].label} className={STATUS_STYLES[b.status].className} />
                        {b.attachBrochure && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <FileText className="size-3.5" /> Brochure
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDateTime(b.createdAt)} · by {b.createdBy.firstName} {b.createdBy.lastName}
                        {b.project ? ` · ${b.project.name}` : ''}
                      </p>
                    </div>
                    <StatsRow stats={b.stats} />
                  </button>
                </li>
              ))}
            </ul>
            <Pagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
          </>
        )}
      </Card>
      <BroadcastDetailModal id={openId} onClose={() => onOpen(null)} />
    </>
  )
}

function StatsRow({ stats, large }: { stats: BroadcastStats; large?: boolean }) {
  const items = [
    { label: 'Sent', value: stats.sent, icon: Send, color: 'text-slate-700' },
    { label: 'Delivered', value: stats.delivered, icon: CheckCheck, color: 'text-slate-700' },
    { label: 'Read', value: stats.read, icon: CheckCheck, color: 'text-sky-600' },
    { label: 'Replied', value: stats.replied, icon: MessageSquareReply, color: 'text-emerald-600' },
    { label: 'Failed', value: stats.failed, icon: OctagonX, color: stats.failed ? 'text-rose-600' : 'text-slate-400' },
  ]
  return (
    <div className={cn('grid shrink-0 grid-cols-5 gap-2', large ? 'gap-3' : 'md:w-[400px]')}>
      {items.map((i) => (
        <div key={i.label} className={cn('rounded-lg bg-slate-50 px-2 py-1.5 text-center', large && 'py-3')}>
          <p className={cn('flex items-center justify-center gap-1 font-bold tabular-nums', i.color, large ? 'text-xl' : 'text-sm')}>
            <i.icon className={large ? 'size-4' : 'size-3.5'} />
            {i.value.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500">{i.label}</p>
        </div>
      ))}
    </div>
  )
}

type RecipientTab = 'all' | 'read' | 'replied' | 'failed' | 'skipped' | 'pending'

const recipientMatches: Record<RecipientTab, (r: BroadcastRecipient) => boolean> = {
  all: () => true,
  read: (r) => r.messageStatus === 'READ',
  replied: (r) => r.replied,
  failed: (r) => r.status === 'FAILED' || (r.status === 'SENT' && r.messageStatus === 'FAILED'),
  skipped: (r) => r.status === 'SKIPPED',
  pending: (r) => r.status === 'PENDING' || r.status === 'SENDING',
}

function recipientState(r: BroadcastRecipient): { label: string; className: string } {
  if (r.status === 'SKIPPED') return { label: 'Left out', className: 'bg-slate-100 text-slate-600 ring-slate-500/20' }
  if (r.status === 'PENDING' || r.status === 'SENDING') return { label: 'Waiting', className: 'bg-sky-50 text-sky-700 ring-sky-600/20' }
  if (r.status === 'FAILED' || r.messageStatus === 'FAILED') return { label: 'Failed', className: 'bg-rose-100 text-rose-700 ring-rose-600/20' }
  if (r.replied) return { label: 'Replied', className: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20' }
  if (r.messageStatus === 'READ') return { label: 'Read', className: 'bg-sky-100 text-sky-700 ring-sky-600/20' }
  if (r.messageStatus === 'DELIVERED') return { label: 'Delivered', className: 'bg-slate-100 text-slate-700 ring-slate-500/20' }
  return { label: 'Sent', className: 'bg-slate-100 text-slate-700 ring-slate-500/20' }
}

function BroadcastDetailModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: broadcast } = useBroadcast(id)
  const live = broadcast?.status === 'QUEUED' || broadcast?.status === 'SENDING'
  const { data: recipients = [], isLoading, refetch } = useBroadcastRecipients(id, live)
  // The list catches up as soon as the counts move (e.g. the last message went out).
  const statsKey = broadcast ? `${broadcast.status}:${Object.values(broadcast.stats).join(',')}` : ''
  useEffect(() => {
    if (statsKey) void refetch()
  }, [statsKey, refetch])
  const cancel = useCancelBroadcast()
  const [tab, setTab] = useState<RecipientTab>('all')
  const [confirmStop, setConfirmStop] = useState(false)

  const counts = useMemo(
    () => Object.fromEntries((Object.keys(recipientMatches) as RecipientTab[]).map((t) => [t, recipients.filter(recipientMatches[t]).length])),
    [recipients],
  ) as Record<RecipientTab, number>
  const visible = recipients.filter(recipientMatches[tab])

  const tabs = (
    [
      ['all', 'All'],
      ['pending', 'Waiting'],
      ['read', 'Read'],
      ['replied', 'Replied'],
      ['failed', 'Failed'],
      ['skipped', 'Left out'],
    ] as [RecipientTab, string][]
  )
    .filter(([t]) => t === 'all' || counts[t] > 0)
    .map(([value, label]) => ({ value, label, count: counts[value] }))

  return (
    <Modal
      open={!!id}
      onClose={() => {
        setTab('all')
        onClose()
      }}
      size="xl"
      title={broadcast ? prettyTemplate(broadcast.templateName) : 'Follow-up'}
      subtitle={broadcast ? `${formatDateTime(broadcast.createdAt)} · by ${broadcast.createdBy.firstName} ${broadcast.createdBy.lastName}` : undefined}
    >
      {!broadcast ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spinner className="size-7" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <StatusPill label={STATUS_STYLES[broadcast.status].label} className={STATUS_STYLES[broadcast.status].className} />
            {live && (
              <span className="inline-flex items-center gap-1.5 text-xs text-sky-700">
                <Loader2 className="size-3.5 animate-spin" />
                {broadcast.stats.pending.toLocaleString('en-IN')} still to go
              </span>
            )}
            <span className="text-xs text-slate-500">
              {broadcast.attachBrochure ? 'With brochure' : 'No brochure'} ·{' '}
              {broadcast.project ? broadcast.project.name : 'each lead’s own project'}
              {broadcast.nextFollowUpInDays ? ` · next follow-up set ${broadcast.nextFollowUpInDays} day(s) later` : ''}
            </span>
            {live && (
              <Button variant="danger" size="sm" className="ml-auto" onClick={() => setConfirmStop(true)}>
                Stop sending
              </Button>
            )}
          </div>

          {broadcast.lastError && (
            <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-inset ring-rose-200">
              <span className="font-semibold">Stopped:</span> {broadcast.lastError}
            </p>
          )}

          <StatsRow stats={broadcast.stats} large />

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="mb-1 text-xs font-medium text-slate-500">Template text</p>
            <p className="whitespace-pre-wrap text-[13px] text-slate-600">{broadcast.templateBody}</p>
          </div>

          <Tabs tabs={tabs} active={tab} onChange={(v) => setTab(v as RecipientTab)} />

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2">Lead</th>
                    <th className="px-3 py-2">WhatsApp</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => {
                    const state = recipientState(r)
                    return (
                      <tr key={r.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-2">
                          <Link
                            to="/leads/$leadId"
                            params={{ leadId: r.lead.id }}
                            className="font-medium text-slate-800 hover:text-brand-700 hover:underline"
                          >
                            {r.lead.fullName}
                          </Link>
                          <p className="text-xs text-slate-400">{formatLeadNumber(r.lead.leadNumber)}</p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">{r.toPhone ? `+${r.toPhone}` : r.lead.phone}</td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <StatusPill label={state.label} className={state.className} />
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500">
                          {r.skipReason ?? r.errorMessage ?? (r.sentAt ? `Sent ${formatDateTime(r.sentAt)}` : '')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmStop}
        onClose={() => setConfirmStop(false)}
        title="Stop this follow-up?"
        description="Leads who haven’t got it yet won’t be sent it. Messages already sent stay sent."
        confirmLabel="Stop sending"
        variant="danger"
        loading={cancel.isPending}
        onConfirm={() =>
          cancel.mutate(broadcast!.id, {
            onSuccess: () => {
              toast.success('Follow-up stopped')
              setConfirmStop(false)
            },
            onError: (err) => toast.error(extractErrorMessage(err)),
          })
        }
      />
    </Modal>
  )
}

