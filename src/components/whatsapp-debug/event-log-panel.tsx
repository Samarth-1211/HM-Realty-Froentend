import { Fragment, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import { Toggle } from '@/components/ui/toggle'
import { Spinner } from '@/components/ui/spinner'
import { useWebhookEvent, useWebhookEvents } from '@/hooks/queries/use-whatsapp-debug'
import { extractErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import type { WebhookEventFilter, WebhookEventRow } from '@/api/whatsapp-debug.api'
import { JsonView } from './json-view'

const FILTERS: { value: WebhookEventFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'messages', label: 'Messages' },
  { value: 'statuses', label: 'Statuses' },
  { value: 'errors', label: 'Errors' },
  { value: 'invalid-signature', label: 'Invalid signature' },
]

const STATUS_VARIANT: Record<WebhookEventRow['processingStatus'], 'success' | 'warning' | 'danger' | 'neutral'> = {
  PROCESSED: 'success',
  PENDING: 'warning',
  IGNORED: 'neutral',
  FAILED: 'danger',
}

function time(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

function EventPayload({ id, showFull }: { id: string; showFull: boolean }) {
  const { data, isLoading, error } = useWebhookEvent(id)
  if (isLoading) return <Spinner />
  if (error) return <p className="text-xs text-rose-600">{extractErrorMessage(error)}</p>
  return <JsonView value={data?.rawPayload} mask={!showFull} />
}

export function EventLogPanel() {
  const [filter, setFilter] = useState<WebhookEventFilter>('all')
  const [paused, setPaused] = useState(false)
  const [showFull, setShowFull] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const { data: events, isLoading, error } = useWebhookEvents(filter, paused)

  return (
    <Card>
      <CardHeader
        title="Live webhook event log"
        subtitle={`Latest 100 POSTs from Meta${paused ? ' — paused' : ', refreshing every 3 s'}. Click a row for the raw payload.`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Toggle checked={showFull} onChange={setShowFull} label="Show full numbers" />
            <Button variant="outline" size="sm" onClick={() => setPaused((p) => !p)}>
              {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              {paused ? 'Resume' : 'Pause'}
            </Button>
          </div>
        }
      />
      <CardBody className="flex flex-col gap-4">
        <Tabs tabs={FILTERS} active={filter} onChange={(v) => setFilter(v as WebhookEventFilter)} />

        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{extractErrorMessage(error)}</p>
        ) : isLoading ? (
          <Spinner />
        ) : !events?.length ? (
          <p className="py-8 text-center text-sm text-slate-400">
            {filter === 'all'
              ? 'No webhook has reached this server yet. Once Meta is configured, every POST shows up here within seconds.'
              : 'No events match this filter.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-xs">
              <thead className="text-slate-400">
                <tr className="border-b border-slate-100">
                  <th className="py-2 pr-3 font-medium">Time</th>
                  <th className="py-2 pr-3 font-medium">Event</th>
                  <th className="py-2 pr-3 font-medium">phone_number_id</th>
                  <th className="py-2 pr-3 font-medium">Signature</th>
                  <th className="py-2 pr-3 font-medium">Processing</th>
                  <th className="py-2 font-medium">Error / note</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <Fragment key={e.id}>
                    <tr
                      onClick={() => setExpanded((cur) => (cur === e.id ? null : e.id))}
                      className={cn('cursor-pointer border-b border-slate-50 hover:bg-slate-50', expanded === e.id && 'bg-slate-50')}
                    >
                      <td className="whitespace-nowrap py-2 pr-3 text-slate-600">{time(e.receivedAt)}</td>
                      <td className="py-2 pr-3 font-medium text-slate-700">{e.eventType}</td>
                      <td className="py-2 pr-3 font-mono text-slate-500">{e.phoneNumberId ?? '—'}</td>
                      <td className="py-2 pr-3">
                        {e.signatureValid === true ? (
                          <span className="text-emerald-600">valid</span>
                        ) : e.signatureValid === false ? (
                          <span className="font-medium text-rose-600">invalid</span>
                        ) : (
                          <span className="text-amber-600">not checked</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge variant={STATUS_VARIANT[e.processingStatus]} className="px-2 py-0.5 text-[10px]">
                          {e.processingStatus.toLowerCase()}
                        </Badge>
                      </td>
                      <td className="max-w-xs truncate py-2 text-slate-500" title={e.errorMessage ?? undefined}>
                        {e.errorMessage ?? '—'}
                      </td>
                    </tr>
                    {expanded === e.id && (
                      <tr>
                        <td colSpan={6} className="pb-4 pt-2">
                          {e.errorMessage && <p className="mb-2 whitespace-pre-wrap text-xs text-slate-600">{e.errorMessage}</p>}
                          <EventPayload id={e.id} showFull={showFull} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
