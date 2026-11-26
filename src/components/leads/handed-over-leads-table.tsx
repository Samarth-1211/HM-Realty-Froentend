import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Send } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { LeadNextStep, LeadProjectsCell, LeadStageBadge } from '@/components/leads/lead-cells'
import { leadProjects } from '@/lib/lead-view'
import { formatDateTime, formatLeadNumber, formatLeadPhones } from '@/lib/utils'
import type { HandedOverLead } from '@/types'

const PAGE_SIZE = 10

/**
 * "Assigned by me": the leads the user handed to someone else, to keep track
 * of them — who has each one now, where it stands, what's next and the latest
 * thing that happened. Opening one shows the whole lead, view-only unless it's
 * still in the user's own team.
 */
export function HandedOverLeadsTable({ leads, isLoading }: { leads: HandedOverLead[]; isLoading: boolean }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return leads
    return leads.filter((l) =>
      `${l.fullName} ${formatLeadPhones(l)} ${formatLeadNumber(l.leadNumber)} ${leadProjects(l)
        .map((p) => p.name)
        .join(' ')} ${l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : ''}`
        .toLowerCase()
        .includes(query),
    )
  }, [leads, q])
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)))
  const paged = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const columns: Column<HandedOverLead>[] = [
    {
      key: 'lead',
      header: 'Lead',
      render: (l) => (
        <div className="whitespace-nowrap">
          <p className="font-medium text-slate-800">{l.fullName}</p>
          <p className="text-xs text-slate-400">
            {formatLeadNumber(l.leadNumber)} · {l.phone}
          </p>
        </div>
      ),
    },
    { key: 'stage', header: 'Stage', render: (l) => <LeadStageBadge lead={l} /> },
    { key: 'next', header: 'Next follow-up', render: (l) => <LeadNextStep lead={l} /> },
    {
      key: 'with',
      header: 'Now with',
      render: (l) =>
        l.assignedTo ? (
          <span className="whitespace-nowrap text-slate-700">
            {l.assignedTo.firstName} {l.assignedTo.lastName}
          </span>
        ) : (
          <span className="text-slate-400">Unassigned</span>
        ),
    },
    {
      key: 'latest',
      header: 'Latest activity',
      render: (l) =>
        l.lastActivity ? (
          <div className="max-w-[320px]">
            <p className="line-clamp-2 text-xs text-slate-600" title={l.lastActivity.description}>
              {l.lastActivity.description}
            </p>
            <p className="text-[11px] text-slate-400">{formatDateTime(l.lastActivity.createdAt)}</p>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    { key: 'project', header: 'Project', render: (l) => <LeadProjectsCell lead={l} /> },
    {
      key: 'handed',
      header: 'Handed over',
      render: (l) => <span className="whitespace-nowrap text-slate-400">{formatDateTime(l.handedOverAt)}</span>,
    },
  ]

  return (
    <Card>
      <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          placeholder="Search name, phone, project, who has it…"
          className="sm:max-w-[280px]"
        />
        <p className="text-xs text-slate-500">
          Leads you handed to someone else. You can open them to follow their progress; only their new owner can change them.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={paged}
        isLoading={isLoading}
        rowKey={(l) => l.id}
        onRowClick={(l) => navigate({ to: '/leads/$leadId', params: { leadId: l.id } })}
        emptyIcon={Send}
        emptyTitle={q ? 'No handed-over leads match' : 'You haven’t handed any leads over yet'}
        emptyDescription="When you assign or reassign a lead to someone else, it shows up here so you can keep track of it."
      />
      {filtered.length > 0 && (
        <Pagination page={current} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      )}
    </Card>
  )
}
