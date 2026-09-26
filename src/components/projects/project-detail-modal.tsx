import type { ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlotSizeMode, type Project } from '@/types'
import { formatDate, formatEnumLabel } from '@/lib/utils'
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
}: {
  project: Project | null
  onClose: () => void
  onEdit: (project: Project) => void
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
          </Section>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button type="button" onClick={() => onEdit(project)}>
              <Pencil className="size-4" />
              Edit
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
