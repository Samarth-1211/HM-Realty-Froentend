import { useState } from 'react'
import { AlertTriangle, Clock, FileStack, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusPill } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useDeleteTemplate, useManagedTemplates } from '@/hooks/queries/use-follow-ups'
import { extractErrorMessage } from '@/lib/api-client'
import { formatDateTime } from '@/lib/utils'
import { WhatsAppBubble } from './send-follow-up-modal'
import { TEMPLATE_LANGUAGES, TemplateEditorModal } from './template-editor-modal'
import type { ManagedTemplate } from '@/api/follow-ups.api'
import type { Project } from '@/types'

const STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Waiting for WhatsApp', className: 'bg-amber-100 text-amber-800 ring-amber-600/20' },
  IN_APPEAL: { label: 'In appeal', className: 'bg-amber-100 text-amber-800 ring-amber-600/20' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20' },
  REJECTED: { label: 'Rejected', className: 'bg-rose-100 text-rose-700 ring-rose-600/20' },
  PAUSED: { label: 'Paused', className: 'bg-orange-100 text-orange-700 ring-orange-600/20' },
  DISABLED: { label: 'Disabled', className: 'bg-slate-200 text-slate-600 ring-slate-500/20' },
  FLAGGED: { label: 'Flagged', className: 'bg-orange-100 text-orange-700 ring-orange-600/20' },
  DELETED: { label: 'Deleted on WhatsApp', className: 'bg-slate-200 text-slate-600 ring-slate-500/20' },
}
const statusStyle = (s: string) => STATUS[s] ?? { label: s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' '), className: 'bg-slate-100 text-slate-600 ring-slate-500/20' }

type Filter = 'all' | 'waiting' | 'approved' | 'needs-work'
const FILTERS: Record<Filter, (t: ManagedTemplate) => boolean> = {
  all: () => true,
  waiting: (t) => t.status === 'PENDING' || t.status === 'IN_APPEAL',
  approved: (t) => t.status === 'APPROVED',
  'needs-work': (t) => ['REJECTED', 'PAUSED', 'DISABLED', 'FLAGGED'].includes(t.status),
}

const languageLabel = (code: string) => TEMPLATE_LANGUAGES.find((l) => l.code === code)?.label ?? code
const pretty = (name: string) => {
  const words = name.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function TemplatesTab({ projects }: { projects: Project[] }) {
  const { data, isLoading, isError, error, refetch, isFetching } = useManagedTemplates(true)
  const remove = useDeleteTemplate()
  const [filter, setFilter] = useState<Filter>('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<ManagedTemplate | null>(null)
  const [deleting, setDeleting] = useState<ManagedTemplate | null>(null)

  const items = data?.items ?? []
  const counts = Object.fromEntries((Object.keys(FILTERS) as Filter[]).map((f) => [f, items.filter(FILTERS[f]).length])) as Record<Filter, number>
  const visible = items.filter(FILTERS[filter])

  const openEditor = (t: ManagedTemplate | null) => {
    setEditing(t)
    setEditorOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-xl">
          <Tabs
            tabs={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'waiting', label: 'Waiting', count: counts.waiting },
              { value: 'approved', label: 'Approved', count: counts.approved },
              { value: 'needs-work', label: 'Rejected / paused', count: counts['needs-work'] },
            ]}
            active={filter}
            onChange={(v) => setFilter(v as Filter)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => refetch()} loading={isFetching && !isLoading} title="Ask WhatsApp for the latest statuses">
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button onClick={() => openEditor(null)}>
            <Plus className="size-4" />
            New template
          </Button>
        </div>
      </div>

      {data?.metaError && (
        <p className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
          <AlertTriangle className="size-4 shrink-0" /> {data.metaError}
        </p>
      )}

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Spinner className="size-7" />
        </div>
      ) : isError ? (
        <Card className="p-4">
          <EmptyState icon={AlertTriangle} title="Templates couldn’t be loaded" description={extractErrorMessage(error)} />
        </Card>
      ) : !visible.length ? (
        <Card className="p-4">
          <EmptyState
            icon={FileStack}
            title={items.length ? 'Nothing here' : 'No templates yet'}
            description="WhatsApp only lets you message leads who haven’t written to you in the last 24 hours with a template it has approved. Write one and submit it — it’s usually approved within minutes."
            action={
              <Button onClick={() => openEditor(null)}>
                <Plus className="size-4" />
                New template
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((t) => {
            const style = statusStyle(t.status)
            const canFix = !!t.crm && ['REJECTED', 'PAUSED'].includes(t.status)
            return (
              <Card key={`${t.metaTemplateId ?? t.name}-${t.language}`} className="flex flex-col gap-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800" title={t.name}>
                      {pretty(t.name)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {languageLabel(t.language)}
                      {t.category ? ` · ${t.category.charAt(0) + t.category.slice(1).toLowerCase()}` : ''}
                      {t.crm && t.crm.requestedCategory !== t.category && t.category
                        ? ` (asked for ${t.crm.requestedCategory.toLowerCase()})`
                        : ''}
                      {!t.crm && ' · made in WhatsApp Manager'}
                    </p>
                  </div>
                  <StatusPill label={style.label} className={style.className} />
                </div>

                {t.rejectionReason && (
                  <p className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800">
                    <span className="font-semibold">Why:</span> {t.rejectionReason}
                  </p>
                )}

                {t.template ? (
                  <WhatsAppBubble
                    template={t.template}
                    valueFor={(key) => {
                      const v = key.split(':')[1]
                      return t.crm?.variables?.[v]?.sample || `{{${v}}}`
                    }}
                    brochureName={t.template.brochureSlot ? 'Project brochure' : null}
                  />
                ) : t.crm ? (
                  <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-[13px] text-slate-600">{t.crm.body}</p>
                ) : null}

                {t.crm && (
                  <ul className="flex flex-col gap-1 text-xs text-slate-500">
                    <li className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      Submitted {formatDateTime(t.crm.submittedAt)} by {t.crm.submittedBy.firstName} {t.crm.submittedBy.lastName}
                    </li>
                    {t.crm.approvedAt && (
                      <li className="flex items-center gap-1.5 text-emerald-700">
                        <Clock className="size-3.5" />
                        Approved {formatDateTime(t.crm.approvedAt)}
                      </li>
                    )}
                    {t.status !== 'APPROVED' && t.status !== 'PENDING' && t.crm.statusUpdatedAt && (
                      <li className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {style.label} {formatDateTime(t.crm.statusUpdatedAt)}
                      </li>
                    )}
                    {t.status === 'PENDING' && <li>WhatsApp is reviewing it — this page updates by itself.</li>}
                  </ul>
                )}

                {t.template && !t.template.supported && t.status === 'APPROVED' && (
                  <p className="text-xs text-slate-400">Can’t be sent from Follow-ups: {t.template.unsupportedReason}</p>
                )}

                <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                  {canFix && (
                    <Button variant="secondary" size="sm" onClick={() => openEditor(t)}>
                      <Pencil className="size-3.5" />
                      Fix and resubmit
                    </Button>
                  )}
                  {t.metaTemplateId && !t.missingOnWhatsApp && (
                    <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50" onClick={() => setDeleting(t)}>
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <TemplateEditorModal open={editorOpen} onClose={() => setEditorOpen(false)} editing={editing} projects={projects} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete “${deleting ? pretty(deleting.name) : ''}”?`}
        description="It’s removed from your WhatsApp account and can’t be sent any more. WhatsApp won’t let you reuse this name for 30 days."
        confirmLabel="Delete template"
        variant="danger"
        loading={remove.isPending}
        onConfirm={() =>
          deleting?.metaTemplateId &&
          remove.mutate(deleting.metaTemplateId, {
            onSuccess: () => {
              toast.success('Template deleted')
              setDeleting(null)
            },
            onError: (err) => toast.error(extractErrorMessage(err)),
          })
        }
      />
    </div>
  )
}
