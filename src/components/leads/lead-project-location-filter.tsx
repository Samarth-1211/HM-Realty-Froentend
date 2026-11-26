import { useMemo } from 'react'
import { Building2, MapPin } from 'lucide-react'
import { Select } from '@/components/ui/select'
import {
  countLeadsByLocation,
  countLeadsByProject,
  matchesLeadLocation,
  matchesLeadProject,
  type LeadCount,
} from '@/lib/lead-view'
import { cn } from '@/lib/utils'
import type { Lead } from '@/types'

type LeadWithProjects = Pick<Lead, 'project' | 'interestedProjects'>

/**
 * Lead counts per project and per location, each following every other
 * filter — the project counts respect the chosen location and vice versa.
 * `leads` are the leads after all the other filters.
 */
export function useLeadProjectLocationCounts(leads: LeadWithProjects[], project: string, location: string) {
  return useMemo(
    () => ({
      projects: countLeadsByProject(leads.filter((l) => matchesLeadLocation(l, location))),
      locations: countLeadsByLocation(leads.filter((l) => matchesLeadProject(l, project))),
    }),
    [leads, project, location],
  )
}

/** The chosen value stays in the list (with 0) even when no lead matches it any more. */
function withSelected(counts: LeadCount[], selected: string, label: string): LeadCount[] {
  if (!selected || counts.some((c) => c.key === selected)) return counts
  return [...counts, { key: selected, label, count: 0 }]
}

export function ProjectFilterSelect({
  counts,
  value,
  selectedLabel,
  onChange,
  className,
}: {
  counts: LeadCount[]
  value: string
  /** Name of the chosen project, for when no visible lead has it. */
  selectedLabel?: string
  onChange: (projectId: string) => void
  className?: string
}) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      title="Leads interested in a project — as their main project or an extra one"
    >
      <option value="">All projects</option>
      {withSelected(counts, value, selectedLabel ?? 'Chosen project').map((c) => (
        <option key={c.key} value={c.key}>
          {c.label} ({c.count.toLocaleString('en-IN')})
        </option>
      ))}
    </Select>
  )
}

export function LocationFilterSelect({
  counts,
  value,
  onChange,
  className,
}: {
  counts: LeadCount[]
  value: string
  onChange: (location: string) => void
  className?: string
}) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      title="Leads interested in a project at this location"
    >
      <option value="">All locations</option>
      {withSelected(counts, value, value).map((c) => (
        <option key={c.key} value={c.key}>
          {c.label} ({c.count.toLocaleString('en-IN')})
        </option>
      ))}
    </Select>
  )
}

/**
 * The counts as a strip of chips under the filters — "Vimal Shri 42 · Iris
 * Dreams 10 | Ujjain 120 · Dewas 31". Clicking one filters to it; clicking
 * the chosen one clears it.
 */
export function LeadCountsBar({
  projects,
  locations,
  project,
  location,
  onProjectChange,
  onLocationChange,
}: {
  projects: LeadCount[]
  locations: LeadCount[]
  project: string
  location: string
  onProjectChange: (projectId: string) => void
  onLocationChange: (location: string) => void
}) {
  if (projects.length === 0 && locations.length === 0) return null
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3 text-xs lg:flex-row lg:items-start lg:gap-6">
      {locations.length > 0 && (
        <ChipRow
          icon={MapPin}
          title="By location"
          counts={locations}
          selected={location}
          onSelect={(key) => onLocationChange(key === location ? '' : key)}
        />
      )}
      {projects.length > 0 && (
        <ChipRow
          icon={Building2}
          title="By project"
          counts={projects}
          selected={project}
          onSelect={(key) => onProjectChange(key === project ? '' : key)}
        />
      )}
    </div>
  )
}

function ChipRow({
  icon: Icon,
  title,
  counts,
  selected,
  onSelect,
}: {
  icon: typeof MapPin
  title: string
  counts: LeadCount[]
  selected: string
  onSelect: (key: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 flex items-center gap-1 font-medium text-slate-500">
        <Icon className="size-3.5" />
        {title}
      </span>
      {counts.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onSelect(c.key)}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ring-1 ring-inset transition-colors',
            selected === c.key
              ? 'bg-brand-600 text-white ring-brand-600'
              : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-100',
          )}
          title={selected === c.key ? 'Show every lead again' : `Show only ${c.label}`}
        >
          {c.label}
          <span className={cn('tabular-nums', selected === c.key ? 'text-white/80' : 'text-slate-400')}>
            {c.count.toLocaleString('en-IN')}
          </span>
        </button>
      ))}
    </div>
  )
}
