import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Contact, Download } from 'lucide-react'
import { Tabs } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/ui/badge'
import { SpreadsheetTable, rowsForExport, type SheetColumn } from '@/components/ui/spreadsheet-table'
import { LeadStatusBadge } from '@/components/leads/lead-status-badge'
import { exportToCsv } from '@/lib/export-csv'
import { LEAD_PROGRESS_STAGE_LABELS, LEAD_TEMPERATURE_COLORS, LEAD_TEMPERATURE_LABELS } from '@/lib/constants'
import { formatCurrency, formatDate, formatDateTime, formatEnumLabel, formatLeadNumber } from '@/lib/utils'
import { LeadStatus, type EmployeeOverview } from '@/types'

type OverviewLead = EmployeeOverview['leads'][number]

const STATUS_FILTERS = ['ALL', ...Object.values(LeadStatus)] as const

/** Every lead currently assigned to one employee, Excel-style, with a status filter. */
export function UserLeadsTab({ leads, fullName }: { leads: OverviewLead[]; fullName: string }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('ALL')

  const visible = useMemo(() => (status === 'ALL' ? leads : leads.filter((l) => l.status === status)), [leads, status])

  const columns: SheetColumn<OverviewLead>[] = [
    { id: 'leadNumber', header: 'Lead ID', accessor: (l) => formatLeadNumber(l.leadNumber), sticky: true, minWidth: '110px' },
    { id: 'name', header: 'Name', accessor: (l) => l.fullName, minWidth: '170px' },
    { id: 'phone', header: 'Phone', accessor: (l) => l.phone, minWidth: '130px' },
    { id: 'status', header: 'Status', accessor: (l) => l.status, cell: (l) => <LeadStatusBadge status={l.status} />, minWidth: '120px' },
    {
      id: 'stage',
      header: 'Stage',
      accessor: (l) =>
        l.progressStage ? (l.progressStage === 'OTHER' ? l.progressStageNote : LEAD_PROGRESS_STAGE_LABELS[l.progressStage]) : null,
      minWidth: '160px',
    },
    {
      id: 'temperature',
      header: 'Temperature',
      accessor: (l) => (l.leadTemperature ? LEAD_TEMPERATURE_LABELS[l.leadTemperature] : null),
      cell: (l) =>
        l.leadTemperature ? (
          <StatusPill label={LEAD_TEMPERATURE_LABELS[l.leadTemperature]} className={LEAD_TEMPERATURE_COLORS[l.leadTemperature]} />
        ) : (
          '—'
        ),
      minWidth: '110px',
    },
    { id: 'project', header: 'Project', accessor: (l) => l.project?.name ?? null, minWidth: '160px' },
    { id: 'source', header: 'Source', accessor: (l) => formatEnumLabel(l.source), minWidth: '140px' },
    { id: 'assignedAt', header: 'Assigned', accessor: (l) => l.assignedAt, cell: (l) => formatDate(l.assignedAt), minWidth: '120px' },
    { id: 'lastContacted', header: 'Last contacted', accessor: (l) => l.lastContactedAt, cell: (l) => formatDateTime(l.lastContactedAt), minWidth: '160px' },
    { id: 'nextFollowUp', header: 'Next follow-up', accessor: (l) => l.nextFollowUpAt, cell: (l) => formatDateTime(l.nextFollowUpAt), minWidth: '160px' },
    { id: 'booking', header: 'Booking value', accessor: (l) => (l.bookingValue ? Number(l.bookingValue) : null), cell: (l) => formatCurrency(l.bookingValue), align: 'right', minWidth: '130px' },
    { id: 'updated', header: 'Last updated', accessor: (l) => l.updatedAt, cell: (l) => formatDateTime(l.updatedAt), minWidth: '160px' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          tabs={STATUS_FILTERS.map((s) => ({
            value: s,
            label: s === 'ALL' ? 'All' : formatEnumLabel(s),
            count: s === 'ALL' ? leads.length : leads.filter((l) => l.status === s).length,
          }))}
          active={status}
          onChange={(v) => setStatus(v as typeof status)}
        />
        <Button
          variant="secondary"
          disabled={visible.length === 0}
          onClick={() => exportToCsv(`leads-${fullName}`, columns.map((c) => c.header), rowsForExport(columns, visible))}
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      <SpreadsheetTable
        columns={columns}
        data={visible}
        rowKey={(l) => l.id}
        onRowClick={(l) => navigate({ to: '/leads/$leadId', params: { leadId: l.id } })}
        emptyIcon={Contact}
        emptyTitle="No leads here"
        emptyDescription={status === 'ALL' ? 'No leads are assigned to this user.' : 'No assigned leads in this status.'}
        maxHeight="60vh"
      />
    </div>
  )
}
