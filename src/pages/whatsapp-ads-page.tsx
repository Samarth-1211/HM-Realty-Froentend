import type { ReactNode } from 'react'
import { ExternalLink, Info, Megaphone } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { useWhatsAppAds, useMapWhatsAppAd } from '@/hooks/queries/use-whatsapp-ads'
import { useProjects } from '@/hooks/queries/use-projects'
import { useLeadAllocationSettings } from '@/hooks/queries/use-lead-allocation'
import { formatDateTime } from '@/lib/utils'
import type { WhatsAppAdSource } from '@/types'

export function WhatsAppAdsPage() {
  const { data: ads, isLoading } = useWhatsAppAds()
  const { data: projects } = useProjects()
  const { data: settings } = useLeadAllocationSettings()
  const mapAd = useMapWhatsAppAd()

  const unlinked = (ads ?? []).filter((ad) => !ad.projectId)
  const unlinkedCount = unlinked.length
  // Only the leads held back by an unlinked ad — a linked ad's lead can be waiting too, when its project's managers are away.
  const waitingCount = unlinked.reduce((sum, ad) => sum + ad.waitingLeadCount, 0)
  /** The ad whose project is being saved right now — its dropdown is locked meanwhile. */
  const savingId = mapAd.isPending ? mapAd.variables?.id : null

  const columns: Column<WhatsAppAdSource>[] = [
    {
      key: 'ad',
      header: 'Ad',
      className: 'max-w-80',
      render: (ad) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-800" title={ad.headline ?? undefined}>
            {ad.headline ?? 'Ad without a headline'}
          </p>
          {ad.body && (
            <p className="truncate text-xs text-slate-500" title={ad.body}>
              {ad.body}
            </p>
          )}
          <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
            <span>Ad ID {ad.adId}</span>
            {ad.sourceUrl && (
              <a
                href={ad.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 font-medium text-brand-600 hover:underline"
              >
                View ad
                <ExternalLink className="size-3" />
              </a>
            )}
          </p>
        </div>
      ),
    },
    {
      key: 'project',
      header: 'Project',
      className: 'w-64 min-w-48',
      render: (ad) => {
        // A linked project stays selectable even after it was made inactive.
        const options = (projects ?? []).filter((p) => p.isActive || p.id === ad.projectId)
        return (
          <Select
            aria-label={`Project for ${ad.headline ?? `ad ${ad.adId}`}`}
            value={ad.projectId ?? ''}
            disabled={savingId === ad.id}
            onChange={(e) => mapAd.mutate({ id: ad.id, projectId: e.target.value || null })}
          >
            <option value="">Not linked</option>
            {options.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (ad) =>
        !ad.projectId ? (
          <Badge variant="warning">Needs a project</Badge>
        ) : ad.mappedBy ? (
          <Badge variant="success">
            Linked by {ad.mappedBy.firstName} {ad.mappedBy.lastName}
          </Badge>
        ) : (
          <span title="The ad's own wording names this project">
            <Badge variant="success">Linked automatically</Badge>
          </span>
        ),
    },
    {
      key: 'leads',
      header: 'Leads',
      render: (ad) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-medium text-slate-700">{ad.leadCount}</span>
          {ad.waitingLeadCount > 0 && <Badge variant="warning">{ad.waitingLeadCount} waiting</Badge>}
        </div>
      ),
    },
    {
      key: 'lastSeen',
      header: 'Last lead',
      render: (ad) => <span className="whitespace-nowrap text-slate-500">{formatDateTime(ad.lastSeenAt)}</span>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="WhatsApp Ads"
        description="Click-to-WhatsApp ads that have sent you leads. Link each ad to the project it advertises so its leads are tagged with that project and go to its managers."
      />

      {settings && settings.mode !== 'PROJECT_WISE' && (
        <Notice tone="sky">
          Project-wise routing for WhatsApp leads is off, so leads are tagged with their project but still rotate across all
          managers. Turn it on under <span className="font-semibold">Lead allocation</span> on the{' '}
          <Link to="/dashboard" className="font-semibold underline">
            Dashboard
          </Link>{' '}
          to send each project’s leads to its own managers.
        </Notice>
      )}

      {unlinkedCount > 0 && (
        <Notice tone="amber">
          {unlinkedCount === 1 ? '1 ad is' : `${unlinkedCount} ads are`} not linked to a project yet
          {waitingCount > 0 && ` — ${waitingCount === 1 ? '1 lead is' : `${waitingCount} leads are`} waiting unassigned`}. Pick a
          project for each one below; waiting leads are handed out as soon as you do.
        </Notice>
      )}

      <Card>
        <DataTable
          columns={columns}
          data={ads ?? []}
          isLoading={isLoading}
          rowKey={(ad) => ad.id}
          rowClassName={(ad) => !ad.projectId && 'bg-amber-50/40'}
          emptyIcon={Megaphone}
          emptyTitle="No ads yet"
          emptyDescription="An ad appears here the first time someone taps it and sends you a WhatsApp message."
        />
      </Card>
    </div>
  )
}

function Notice({ tone, children }: { tone: 'sky' | 'amber'; children: ReactNode }) {
  const tones = { sky: 'bg-sky-50 text-sky-800', amber: 'bg-amber-50 text-amber-800' }
  return (
    <div className={`mb-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${tones[tone]}`}>
      <Info className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  )
}
