import { Link } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
import { cn, formatLeadNumber } from '@/lib/utils'
import type { WorkedLead } from '@/types'

/** A day's check-out work report: the summary text plus the leads it covered. */
export function WorkReport({
  summary,
  workedLeads = [],
  className,
}: {
  summary: string | null
  workedLeads?: WorkedLead[]
  className?: string
}) {
  if (!summary && workedLeads.length === 0) return null

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {summary && (
        <p className="flex items-start gap-1.5 whitespace-pre-line text-xs text-slate-600">
          <FileText className="mt-0.5 size-3 shrink-0 text-slate-400" />
          {summary}
        </p>
      )}
      {workedLeads.length > 0 && <WorkedLeadChips workedLeads={workedLeads} />}
    </div>
  )
}

export function WorkedLeadChips({ workedLeads }: { workedLeads: WorkedLead[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {workedLeads.map(({ lead }) => (
        <Link
          key={lead.id}
          to="/leads/$leadId"
          params={{ leadId: lead.id }}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20 hover:bg-brand-100"
        >
          {formatLeadNumber(lead.leadNumber)} · {lead.fullName}
        </Link>
      ))}
    </div>
  )
}
