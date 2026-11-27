import { CalendarClock, Eye, MapPin } from 'lucide-react'
import { StatusPill } from '@/components/ui/badge'
import { LEAD_STATUS_COLORS } from '@/lib/constants'
import { bookedVisitAt, leadProjects, leadStageLabel } from '@/lib/lead-view'
import { cn, formatDateTime } from '@/lib/utils'
import { LeadStatus, type Lead } from '@/types'

/** One badge for where the lead stands: "In Progress · Site visit done", or just the status. */
export function LeadStageBadge({ lead }: { lead: Pick<Lead, 'status' | 'progressStage' | 'progressStageNote'> }) {
  return <StatusPill label={leadStageLabel(lead)} className={cn('whitespace-nowrap', LEAD_STATUS_COLORS[lead.status] ?? '')} />
}

const OPEN_STATUSES: string[] = [LeadStatus.NEW, LeadStatus.ASSIGNED, LeadStatus.IN_PROGRESS]

/** The next follow-up (red once it's overdue on an open lead) and, when one is booked, the site visit. */
export function LeadNextStep({ lead }: { lead: Pick<Lead, 'status' | 'nextFollowUpAt' | 'siteVisitDate' | 'visitStatus'> }) {
  const visitAt = bookedVisitAt(lead)
  if (!lead.nextFollowUpAt && !visitAt) return <span className="text-slate-400">—</span>
  const overdue =
    !!lead.nextFollowUpAt && OPEN_STATUSES.includes(lead.status) && new Date(lead.nextFollowUpAt).getTime() < Date.now()
  return (
    <div className="flex flex-col gap-0.5 whitespace-nowrap text-xs">
      {lead.nextFollowUpAt && (
        <span className={cn('flex items-center gap-1', overdue ? 'font-medium text-rose-600' : 'text-slate-700')}>
          <CalendarClock className="size-3.5 shrink-0" />
          {formatDateTime(lead.nextFollowUpAt)}
          {overdue && ' · overdue'}
        </span>
      )}
      {visitAt && (
        <span className="flex items-center gap-1 text-violet-700">
          <MapPin className="size-3.5 shrink-0" />
          Visit {formatDateTime(visitAt)}
        </span>
      )}
    </div>
  )
}

/** "Vimal Shri +2" — the main project, and how many more the lead is interested in (all named on hover). */
export function LeadProjectsCell({ lead }: { lead: Pick<Lead, 'project' | 'interestedProjects'> }) {
  const projects = leadProjects(lead)
  if (projects.length === 0) return <span className="text-slate-400">—</span>
  const [first, ...rest] = projects
  return (
    <span className="whitespace-nowrap text-slate-600" title={projects.map((p) => p.name).join(', ')}>
      {first.name}
      {rest.length > 0 && (
        <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">+{rest.length}</span>
      )}
    </span>
  )
}

/** Marks a lead the viewer can follow but not work on. */
/** The lead's latest remark, up to two lines; the whole of it on hover. */
export function LeadRemarkCell({ lead }: { lead: Pick<Lead, 'remarks'> }) {
  const remark = lead.remarks?.trim()
  if (!remark) return <span className="text-slate-400">—</span>
  return (
    <p className="line-clamp-2 min-w-40 max-w-64 whitespace-pre-line text-sm text-slate-600" title={remark}>
      {remark}
    </p>
  )
}

export function ViewOnlyTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500',
        className,
      )}
      title="You can follow this lead, but not change it"
    >
      <Eye className="size-3" />
      View only
    </span>
  )
}
