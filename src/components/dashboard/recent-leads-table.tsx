import { Contact } from 'lucide-react'
import type { Lead } from '@/types'
import { DataTable, type Column } from '@/components/ui/data-table'
import { LeadStatusBadge } from '@/components/leads/lead-status-badge'
import { formatDateTime, formatEnumLabel } from '@/lib/utils'

export function RecentLeadsTable({ leads, isLoading }: { leads: Lead[]; isLoading?: boolean }) {
  const columns: Column<Lead>[] = [
    {
      key: 'name',
      header: 'Lead',
      render: (l) => (
        <div>
          <p className="font-medium text-slate-800">{l.fullName}</p>
          <p className="text-xs text-slate-400">{l.phone}</p>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (l) => <span className="text-slate-500">{formatEnumLabel(l.source)}</span>,
    },
    { key: 'status', header: 'Status', render: (l) => <LeadStatusBadge status={l.status} /> },
    {
      key: 'created',
      header: 'Received',
      render: (l) => <span className="text-slate-400">{formatDateTime(l.createdAt)}</span>,
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={leads}
      isLoading={isLoading}
      rowKey={(l) => l.id}
      emptyIcon={Contact}
      emptyTitle="No leads yet"
      emptyDescription="New leads will show up here as soon as they come in."
    />
  )
}
