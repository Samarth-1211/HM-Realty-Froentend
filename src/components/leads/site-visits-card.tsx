import { useState } from 'react'
import { ImageOff, MapPin } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { useSiteVisitPhotoUrl, useSiteVisits } from '@/hooks/queries/use-leads'
import { formatDateTime } from '@/lib/utils'
import type { LeadSiteVisit } from '@/types'

/** The lead's recorded site visits, latest first. Hidden until there's one. */
export function SiteVisitsCard({ leadId }: { leadId: string }) {
  const { data: visits = [] } = useSiteVisits(leadId)
  const [viewing, setViewing] = useState<LeadSiteVisit | null>(null)

  if (visits.length === 0) return null

  return (
    <Card>
      <CardHeader title="Site visits" subtitle="Recorded when the lead is moved to Site visit done" />
      <CardBody>
        <ul className="grid gap-3 md:grid-cols-2">
          {visits.map((visit) => (
            <li key={visit.id} className="flex gap-3 rounded-xl border border-slate-100 p-3">
              <PhotoThumb leadId={leadId} visit={visit} onOpen={() => setViewing(visit)} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <MapPin className="size-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{visit.projectName}</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(visit.visitedAt)}</p>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
                  <dt className="text-slate-400">Client</dt>
                  <dd className="truncate text-slate-700">{visit.clientName}</dd>
                  <dt className="text-slate-400">Client by</dt>
                  <dd className="truncate text-slate-700">{visit.clientBy}</dd>
                  <dt className="text-slate-400">Visit by</dt>
                  <dd className="truncate text-slate-700">{visit.visitBy}</dd>
                </dl>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Recorded by {visit.createdBy.firstName} {visit.createdBy.lastName}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardBody>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.projectName ?? 'Site visit'}
        subtitle={viewing ? `${viewing.clientName} · ${formatDateTime(viewing.visitedAt)}` : undefined}
        size="lg"
      >
        {viewing && <FullPhoto leadId={leadId} visit={viewing} />}
      </Modal>
    </Card>
  )
}

function PhotoThumb({ leadId, visit, onOpen }: { leadId: string; visit: LeadSiteVisit; onOpen: () => void }) {
  const { url, isError } = useSiteVisitPhotoUrl(leadId, visit.id)
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!url}
      title="View photo"
      className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      {url ? (
        <img src={url} alt={`Site visit at ${visit.projectName}`} className="size-full object-cover" />
      ) : isError ? (
        <ImageOff className="size-5 text-slate-300" />
      ) : (
        <span className="size-full animate-pulse bg-slate-200" />
      )}
    </button>
  )
}

function FullPhoto({ leadId, visit }: { leadId: string; visit: LeadSiteVisit }) {
  const { url, isError } = useSiteVisitPhotoUrl(leadId, visit.id)
  if (isError) return <p className="py-10 text-center text-sm text-slate-400">The photo couldn’t be loaded.</p>
  if (!url) return <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
  return <img src={url} alt={`Site visit at ${visit.projectName}`} className="max-h-[70vh] w-full rounded-xl object-contain" />
}
