import { useState } from 'react'
import { Filter, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { Toggle } from '@/components/ui/toggle'
import { Button } from '@/components/ui/button'
import { NO_PROJECT, UNASSIGNED, type FollowUpDue, type FollowUpFilters } from '@/api/follow-ups.api'
import {
  BOOKING_STATUS_LABELS,
  LEAD_PROGRESS_STAGE_LABELS,
  LEAD_PURPOSE_LABELS,
  LEAD_TEMPERATURE_LABELS,
  VISIT_STATUS_LABELS,
} from '@/lib/constants'
import { cn, formatEnumLabel } from '@/lib/utils'
import {
  BookingStatus,
  LeadProgressStage,
  LeadPurpose,
  LeadSource,
  LeadStatus,
  LeadTemperature,
  VisitStatus,
} from '@/types'

const LAKH = 100_000

const FOLLOW_UP_DUE_LABELS: Record<FollowUpDue, string> = {
  OVERDUE: 'Overdue',
  TODAY: 'Due today',
  NEXT_7_DAYS: 'Due in the next 7 days',
  NOT_SET: 'No follow-up date set',
}

/** Filters that live behind "More filters" — counted on the button so nothing is hidden by surprise. */
const MORE_KEYS: (keyof FollowUpFilters)[] = [
  'progressStages',
  'temperatures',
  'assignedToIds',
  'sources',
  'purposes',
  'visitStatuses',
  'bookingStatuses',
  'notContactedForDays',
  'noFollowUpSentForDays',
  'nextFollowUpFrom',
  'nextFollowUpTo',
  'createdFrom',
  'createdTo',
  'budgetMin',
  'budgetMax',
  'city',
  'unitType',
  'whatsappChat',
  'includeOptedOut',
]

const isSet = (v: unknown) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '' && v !== false)

export function countActiveFilters(filters: FollowUpFilters) {
  return Object.values(filters).filter(isSet).length
}

export function FollowUpFiltersPanel({
  value,
  onChange,
  projects,
  people,
  showAssignee,
}: {
  value: FollowUpFilters
  onChange: (next: FollowUpFilters) => void
  projects: { id: string; name: string }[]
  /** Who leads can be assigned to — for the "Assigned to" filter (Admins and Managers only). */
  people: { id: string; label: string }[]
  showAssignee: boolean
}) {
  const moreCount = MORE_KEYS.filter((k) => isSet(value[k])).length
  const [showMore, setShowMore] = useState(moreCount > 0)

  const set = <K extends keyof FollowUpFilters>(key: K, v: FollowUpFilters[K] | '' | undefined) => {
    const next = { ...value }
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0) || v === false) delete next[key]
    else next[key] = v as FollowUpFilters[K]
    onChange(next)
  }
  const num = (raw: string, scale = 1) => (raw.trim() === '' || Number.isNaN(Number(raw)) ? undefined : Number(raw) * scale)

  const projectName = new Map(projects.map((p) => [p.id, p.name]))
  const personName = new Map(people.map((p) => [p.id, p.label]))

  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          value={value.q ?? ''}
          onChange={(e) => set('q', e.target.value)}
          placeholder="Search name, phone, lead ID…"
          leftIcon={<Search className="size-4" />}
        />
        <MultiSelect
          options={[...projects.map((p) => p.id), NO_PROJECT]}
          value={value.projectIds ?? []}
          onChange={(v) => set('projectIds', v)}
          placeholder="All projects"
          formatLabel={(id) => (id === NO_PROJECT ? 'No project' : projectName.get(id) ?? 'Unknown project')}
          searchable={projects.length > 8}
          searchPlaceholder="Find a project…"
        />
        <MultiSelect
          options={Object.values(LeadStatus)}
          value={value.statuses ?? []}
          onChange={(v) => set('statuses', v as LeadStatus[])}
          placeholder="All statuses"
          formatLabel={formatEnumLabel}
        />
        <Select value={value.followUpDue ?? ''} onChange={(e) => set('followUpDue', e.target.value as FollowUpDue)}>
          <option value="">Any follow-up date</option>
          {Object.entries(FOLLOW_UP_DUE_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {showMore && (
        <div className="grid gap-3 rounded-xl bg-slate-50/70 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterField label="Stage">
            <MultiSelect
              options={Object.values(LeadProgressStage)}
              value={value.progressStages ?? []}
              onChange={(v) => set('progressStages', v as LeadProgressStage[])}
              placeholder="Any stage"
              formatLabel={(s) => LEAD_PROGRESS_STAGE_LABELS[s] ?? s}
            />
          </FilterField>
          <FilterField label="Temperature">
            <MultiSelect
              options={Object.values(LeadTemperature)}
              value={value.temperatures ?? []}
              onChange={(v) => set('temperatures', v as LeadTemperature[])}
              placeholder="Hot, warm or cold"
              formatLabel={(s) => LEAD_TEMPERATURE_LABELS[s] ?? s}
            />
          </FilterField>
          {showAssignee && (
            <FilterField label="Assigned to">
              <MultiSelect
                options={[...people.map((p) => p.id), UNASSIGNED]}
                value={value.assignedToIds ?? []}
                onChange={(v) => set('assignedToIds', v)}
                placeholder="Anyone"
                formatLabel={(id) => (id === UNASSIGNED ? 'Unassigned' : personName.get(id) ?? 'Someone else')}
                searchable
                searchPlaceholder="Find a person…"
              />
            </FilterField>
          )}
          <FilterField label="Source">
            <MultiSelect
              options={Object.values(LeadSource)}
              value={value.sources ?? []}
              onChange={(v) => set('sources', v as LeadSource[])}
              placeholder="Any source"
              formatLabel={formatEnumLabel}
              searchable
            />
          </FilterField>
          <FilterField label="Purpose">
            <MultiSelect
              options={Object.values(LeadPurpose)}
              value={value.purposes ?? []}
              onChange={(v) => set('purposes', v as LeadPurpose[])}
              placeholder="Any purpose"
              formatLabel={(s) => LEAD_PURPOSE_LABELS[s] ?? s}
            />
          </FilterField>
          <FilterField label="Site visit">
            <MultiSelect
              options={Object.values(VisitStatus)}
              value={value.visitStatuses ?? []}
              onChange={(v) => set('visitStatuses', v as VisitStatus[])}
              placeholder="Any visit status"
              formatLabel={(s) => VISIT_STATUS_LABELS[s] ?? s}
            />
          </FilterField>
          <FilterField label="Booking">
            <MultiSelect
              options={Object.values(BookingStatus)}
              value={value.bookingStatuses ?? []}
              onChange={(v) => set('bookingStatuses', v as BookingStatus[])}
              placeholder="Any booking status"
              formatLabel={(s) => BOOKING_STATUS_LABELS[s] ?? s}
            />
          </FilterField>
          <FilterField label="WhatsApp chat">
            <Select
              value={value.whatsappChat ?? ''}
              onChange={(e) => set('whatsappChat', e.target.value as FollowUpFilters['whatsappChat'])}
            >
              <option value="">With or without a chat</option>
              <option value="HAS_CHAT">Has messaged us on WhatsApp</option>
              <option value="NO_CHAT">Never messaged us on WhatsApp</option>
            </Select>
          </FilterField>
          <FilterField label="Not contacted for">
            <Select
              value={value.notContactedForDays ?? ''}
              onChange={(e) => set('notContactedForDays', num(e.target.value))}
            >
              <option value="">Any time</option>
              {[3, 7, 15, 30, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d}+ days (or never)
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="No WhatsApp follow-up in">
            <Select
              value={value.noFollowUpSentForDays ?? ''}
              onChange={(e) => set('noFollowUpSentForDays', num(e.target.value))}
            >
              <option value="">Don’t check</option>
              {[1, 3, 7, 15, 30].map((d) => (
                <option key={d} value={d}>
                  The last {d} day{d === 1 ? '' : 's'}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Next follow-up between" wide>
            <DateRange
              from={value.nextFollowUpFrom}
              to={value.nextFollowUpTo}
              onChange={(from, to) => onChange(withRange(value, 'nextFollowUpFrom', from, 'nextFollowUpTo', to))}
            />
          </FilterField>
          <FilterField label="Lead added between" wide>
            <DateRange
              from={value.createdFrom}
              to={value.createdTo}
              onChange={(from, to) => onChange(withRange(value, 'createdFrom', from, 'createdTo', to))}
            />
          </FilterField>
          <FilterField label="Budget (₹ lakh)">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                inputMode="decimal"
                placeholder="From"
                value={value.budgetMin != null ? value.budgetMin / LAKH : ''}
                onChange={(e) => set('budgetMin', num(e.target.value, LAKH))}
              />
              <Input
                type="number"
                min={0}
                inputMode="decimal"
                placeholder="To"
                value={value.budgetMax != null ? value.budgetMax / LAKH : ''}
                onChange={(e) => set('budgetMax', num(e.target.value, LAKH))}
              />
            </div>
          </FilterField>
          <FilterField label="City">
            <Input value={value.city ?? ''} onChange={(e) => set('city', e.target.value)} placeholder="Any city" />
          </FilterField>
          <FilterField label="Unit type">
            <Input value={value.unitType ?? ''} onChange={(e) => set('unitType', e.target.value)} placeholder="e.g. 3BHK, plot" />
          </FilterField>
          <div className="flex items-end pb-2">
            <Toggle
              checked={!!value.includeOptedOut}
              onChange={(v) => set('includeOptedOut', v)}
              label="Show leads who opted out"
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setShowMore((s) => !s)}>
          <Filter className="size-4" />
          {showMore ? 'Fewer filters' : 'More filters'}
          {moreCount > 0 && (
            <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[11px] text-brand-700">{moreCount}</span>
          )}
        </Button>
        {countActiveFilters(value) > 0 && (
          <Button variant="ghost" size="sm" onClick={() => onChange({})}>
            <X className="size-4" />
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  )
}

function FilterField({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', wide && 'sm:col-span-2')}>
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </div>
  )
}

function DateRange({
  from,
  to,
  onChange,
}: {
  from?: string
  to?: string
  onChange: (from: string | undefined, to: string | undefined) => void
}) {
  return (
    <div className="grid grid-cols-2 items-center gap-2">
      <Input type="date" value={from ?? ''} max={to} onChange={(e) => onChange(e.target.value || undefined, to)} />
      <Input type="date" value={to ?? ''} min={from} onChange={(e) => onChange(from, e.target.value || undefined)} />
    </div>
  )
}

function withRange(
  value: FollowUpFilters,
  fromKey: 'nextFollowUpFrom' | 'createdFrom',
  from: string | undefined,
  toKey: 'nextFollowUpTo' | 'createdTo',
  to: string | undefined,
): FollowUpFilters {
  const next = { ...value, [fromKey]: from, [toKey]: to }
  if (!from) delete next[fromKey]
  if (!to) delete next[toKey]
  return next
}
