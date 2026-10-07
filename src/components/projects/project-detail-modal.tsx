import type { ReactNode } from 'react'
import { Download, ExternalLink, FileText, Pencil } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonAnchor } from '@/components/ui/button-link'
import { WhatsAppGlyph } from '@/components/integrations/whatsapp-mark'
import { PlotSizeMode, type Project } from '@/types'
import { formatDate, formatEnumLabel, formatFileSize } from '@/lib/utils'
import { brochureUrl } from '@/lib/project-share'
import {
  formatEmCharges,
  formatGuidelineRate,
  formatPlc,
  formatPlotSize,
  formatProjectBudget,
  formatProjectPlotSizes,
  formatRate,
} from '@/lib/project-pricing'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>
    </section>
  )
}

function Item({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children || '—'}</dd>
    </div>
  )
}

export function ProjectDetailModal({
  project,
  onClose,
  onEdit,
  onShare,
}: {
  project: Project | null
  onClose: () => void
  /** Admins only — omitted for everyone else, who can view but not change projects. */
  onEdit?: (project: Project) => void
  onShare: (project: Project) => void
}) {
  return (
    <Modal
      open={!!project}
      onClose={onClose}
      title={project?.name ?? ''}
      subtitle={project ? [project.zone, project.location].filter(Boolean).join(' · ') : undefined}
      size="lg"
    >
      {project && (
        <div className="flex flex-col gap-5">
          <BrochureCard project={project} />

          <Section title="Basic info">
            <Item label="Zone / Area">{project.zone}</Item>
            <Item label="Location">{project.location}</Item>
            <Item label="Landmark">{project.landmark}</Item>
            <Item label="Property type">{formatEnumLabel(project.propertyType)}</Item>
            <Item label="Status">
              <Badge variant={project.isActive ? 'success' : 'neutral'}>{project.isActive ? 'Active' : 'Inactive'}</Badge>
            </Item>
          </Section>

          <Section title="Pricing">
            <Item label="Basic rate">{formatRate(project.basicRateMin, project.basicRateMax)}</Item>
            <Item label="E+M charges">{formatEmCharges(project)}</Item>
            <Item label="PLC">{formatPlc(project)}</Item>
            <Item label="Guideline rate">{formatGuidelineRate(project)}</Item>
          </Section>

          <Section title="Plot sizes & budget">
            <Item label={project.plotSizeMode === PlotSizeMode.RANGE ? 'Plot size range' : 'Plot sizes'} wide>
              {project.plotSizeMode === PlotSizeMode.LIST && project.plotSizes?.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {project.plotSizes.map((s) => (
                    <li key={s.id} className="rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-700">
                      {formatPlotSize(s)}
                    </li>
                  ))}
                </ul>
              ) : (
                formatProjectPlotSizes(project)
              )}
            </Item>
            <Item label={project.budgetIsManual ? 'Budget (manual)' : 'Budget'}>
              <span className="font-semibold">{formatProjectBudget(project)}</span>
            </Item>
          </Section>

          <Section title="Other">
            <Item label="Payment terms">{project.paymentTerms && formatEnumLabel(project.paymentTerms)}</Item>
            <Item label="Source">
              {[project.sourceAgentName, project.rateListDate && formatDate(project.rateListDate)].filter(Boolean).join(' · ')}
            </Item>
            <Item label="Remarks" wide>
              {project.remarks && <span className="whitespace-pre-line">{project.remarks}</span>}
            </Item>
            <Item label="Description" wide>
              {project.description && <span className="whitespace-pre-line">{project.description}</span>}
            </Item>
            <Item label="Active platforms" wide>
              {project.activePlatforms?.map(formatEnumLabel).join(', ')}
            </Item>
            <Item label="Lead keywords" wide>
              {project.whatsappKeywords?.join(', ')}
            </Item>
          </Section>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
            {onEdit && (
              <Button type="button" variant="secondary" onClick={() => onEdit(project)}>
                <Pencil className="size-4" />
                Edit
              </Button>
            )}
            <Button type="button" onClick={() => onShare(project)}>
              <WhatsAppGlyph />
              Send on WhatsApp
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function BrochureCard({ project }: { project: Project }) {
  const url = brochureUrl(project)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
        <FileText className="size-5" />
      </span>
      {url ? (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{project.brochureFileName ?? 'Brochure'}</p>
            <p className="text-xs text-slate-400">
              {formatFileSize(project.brochureSizeBytes)}
              {project.brochureUploadedAt && ` · added ${formatDate(project.brochureUploadedAt)}`}
            </p>
          </div>
          <div className="flex gap-2">
            <ButtonAnchor href={url} variant="secondary" size="sm">
              <ExternalLink className="size-3.5" />
              View
            </ButtonAnchor>
            <ButtonAnchor href={brochureUrl(project, true)!} variant="ghost" size="sm">
              <Download className="size-3.5" />
              Download
            </ButtonAnchor>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">No brochure uploaded yet.</p>
      )}
    </div>
  )
}
