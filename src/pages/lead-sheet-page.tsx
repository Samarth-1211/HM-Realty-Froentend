import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Download, Sheet } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge, StatusPill } from '@/components/ui/badge'
import { SpreadsheetTable, rowsForExport, type SheetColumn } from '@/components/ui/spreadsheet-table'
import { useLeads } from '@/hooks/queries/use-leads'
import { useUsers } from '@/hooks/queries/use-users'
import { exportToCsv } from '@/lib/export-csv'
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  LEAD_PURPOSE_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_TEMPERATURE_COLORS,
  LEAD_TEMPERATURE_LABELS,
  VISIT_STATUS_COLORS,
  VISIT_STATUS_LABELS,
} from '@/lib/constants'
import { formatCurrency, formatDate, formatDateTime, formatEnumLabel } from '@/lib/utils'
import { BookingStatus, LeadSource, LeadStatus, LeadTemperature, type Lead } from '@/types'

function leadIdLabel(lead: Lead): string {
  return `LD-${String(lead.leadNumber).padStart(6, '0')}`
}

function assigneeLabel(lead: Lead): string {
  return lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'
}

function budgetLabel(lead: Lead): string {
  if (!lead.budgetMin && !lead.budgetMax) return '—'
  return `${formatCurrency(lead.budgetMin)} – ${formatCurrency(lead.budgetMax)}`
}

export function LeadSheetPage() {
  const navigate = useNavigate()
  const { data: leads = [], isLoading } = useLeads()
  const { data: users = [] } = useUsers()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [temperature, setTemperature] = useState('')
  const [source, setSource] = useState('')
  const [executive, setExecutive] = useState('')
  const [bookingStatus, setBookingStatus] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter((l) => {
      if (status && l.status !== status) return false
      if (temperature && l.leadTemperature !== temperature) return false
      if (source && l.source !== source) return false
      if (executive && l.assignedToId !== executive) return false
      if (bookingStatus && l.bookingStatus !== bookingStatus) return false
      if (q) {
        const haystack = `${l.fullName} ${l.phone} ${l.project?.name ?? ''} ${leadIdLabel(l)}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [leads, search, status, temperature, source, executive, bookingStatus])

  const executiveOptions = useMemo(
    () => users.filter((u) => u.role === 'PRESALES' || u.role === 'POSTSALES' || u.role === 'AGENT'),
    [users],
  )

  const columns: SheetColumn<Lead>[] = [
    { id: 'leadId', header: 'Lead ID', accessor: leadIdLabel, sticky: true, minWidth: '110px' },
    { id: 'leadDate', header: 'Lead Date', accessor: (l) => l.createdAt, cell: (l) => formatDate(l.createdAt), minWidth: '110px' },
    { id: 'customerName', header: 'Customer Name', accessor: (l) => l.fullName, minWidth: '160px' },
    { id: 'mobile', header: 'Mobile No.', accessor: (l) => l.phone, minWidth: '120px' },
    { id: 'source', header: 'Lead Source', accessor: (l) => l.source, cell: (l) => formatEnumLabel(l.source), minWidth: '140px' },
    { id: 'executive', header: 'Assigned Executive', accessor: assigneeLabel, minWidth: '160px' },
    { id: 'location', header: 'Interested Location', accessor: (l) => l.city ?? '', minWidth: '150px' },
    { id: 'project', header: 'Project', accessor: (l) => l.project?.name ?? '', minWidth: '140px' },
    { id: 'budget', header: 'Budget (₹)', accessor: (l) => Number(l.budgetMax ?? l.budgetMin ?? 0), cell: budgetLabel, align: 'right', minWidth: '170px' },
    { id: 'plotSize', header: 'Plot Size (Sq Ft)', accessor: (l) => l.plotSizeSqFt, align: 'right', minWidth: '140px' },
    { id: 'purpose', header: 'Purpose', accessor: (l) => l.purpose ?? '', cell: (l) => (l.purpose ? LEAD_PURPOSE_LABELS[l.purpose] : '—'), minWidth: '110px' },
    {
      id: 'stage',
      header: 'Lead Stage',
      accessor: (l) => l.status,
      cell: (l) => <StatusPill label={formatEnumLabel(l.status)} className={LEAD_STATUS_COLORS[l.status]} />,
      minWidth: '130px',
    },
    {
      id: 'temperature',
      header: 'Lead Temperature',
      accessor: (l) => l.leadTemperature ?? '',
      cell: (l) => (l.leadTemperature ? <Badge className={LEAD_TEMPERATURE_COLORS[l.leadTemperature]}>{LEAD_TEMPERATURE_LABELS[l.leadTemperature]}</Badge> : '—'),
      minWidth: '140px',
    },
    { id: 'lastContact', header: 'Last Contact Date', accessor: (l) => l.lastContactedAt, cell: (l) => formatDateTime(l.lastContactedAt), minWidth: '160px' },
    { id: 'nextFollowUp', header: 'Next Follow-up Date', accessor: (l) => l.nextFollowUpAt, cell: (l) => formatDateTime(l.nextFollowUpAt), minWidth: '160px' },
    { id: 'siteVisitDate', header: 'Site Visit Date', accessor: (l) => l.siteVisitDate, cell: (l) => formatDate(l.siteVisitDate), minWidth: '130px' },
    {
      id: 'visitStatus',
      header: 'Visit Status',
      accessor: (l) => l.visitStatus ?? '',
      cell: (l) => (l.visitStatus ? <Badge className={VISIT_STATUS_COLORS[l.visitStatus]}>{VISIT_STATUS_LABELS[l.visitStatus]}</Badge> : '—'),
      minWidth: '130px',
    },
    { id: 'mainObjection', header: 'Main Objection', accessor: (l) => l.mainObjection ?? '', minWidth: '180px' },
    { id: 'bookingProbability', header: 'Booking Probability %', accessor: (l) => l.bookingProbability, cell: (l) => (l.bookingProbability != null ? `${l.bookingProbability}%` : '—'), align: 'right', minWidth: '150px' },
    {
      id: 'bookingStatus',
      header: 'Booking Status',
      accessor: (l) => l.bookingStatus ?? '',
      cell: (l) => (l.bookingStatus ? <Badge className={BOOKING_STATUS_COLORS[l.bookingStatus]}>{BOOKING_STATUS_LABELS[l.bookingStatus]}</Badge> : '—'),
      minWidth: '130px',
    },
    { id: 'bookingValue', header: 'Booking Value (₹)', accessor: (l) => Number(l.bookingValue ?? 0), cell: (l) => (l.bookingValue ? formatCurrency(l.bookingValue) : '—'), align: 'right', minWidth: '150px' },
    { id: 'lostNurture', header: 'Lost/Nurture Reason', accessor: (l) => l.lostNurtureReason ?? '', minWidth: '180px' },
    { id: 'remarks', header: 'Remarks', accessor: (l) => l.remarks ?? '', minWidth: '200px' },
  ]

  const handleExport = () => {
    exportToCsv(
      `lead-sheet-${new Date().toISOString().slice(0, 10)}`,
      columns.map((c) => c.header),
      rowsForExport(columns, filtered),
    )
  }

  return (
    <div>
      <PageHeader
        title="Lead Sheet"
        description="Every lead across the organization, spreadsheet-style — sort any column, filter, and export."
        actions={
          <Button variant="secondary" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:flex-wrap">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, project, lead ID…"
            className="lg:max-w-[240px]"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="lg:max-w-[150px]">
            <option value="">All stages</option>
            {Object.values(LeadStatus).map((s) => (
              <option key={s} value={s}>
                {formatEnumLabel(s)}
              </option>
            ))}
          </Select>
          <Select value={temperature} onChange={(e) => setTemperature(e.target.value)} className="lg:max-w-[140px]">
            <option value="">All temperatures</option>
            {Object.values(LeadTemperature).map((t) => (
              <option key={t} value={t}>
                {LEAD_TEMPERATURE_LABELS[t]}
              </option>
            ))}
          </Select>
          <Select value={source} onChange={(e) => setSource(e.target.value)} className="lg:max-w-[170px]">
            <option value="">All sources</option>
            {Object.values(LeadSource).map((s) => (
              <option key={s} value={s}>
                {formatEnumLabel(s)}
              </option>
            ))}
          </Select>
          <Select value={executive} onChange={(e) => setExecutive(e.target.value)} className="lg:max-w-[180px]">
            <option value="">All executives</option>
            {executiveOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </Select>
          <Select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)} className="lg:max-w-[150px]">
            <option value="">All bookings</option>
            {Object.values(BookingStatus).map((b) => (
              <option key={b} value={b}>
                {BOOKING_STATUS_LABELS[b]}
              </option>
            ))}
          </Select>
        </div>

        <div className="p-4">
          <SpreadsheetTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            rowKey={(l) => l.id}
            onRowClick={(l) => navigate({ to: '/leads/$leadId', params: { leadId: l.id } })}
            emptyIcon={Sheet}
            emptyTitle="No leads match these filters"
            emptyDescription="Try clearing a filter or the search box."
          />
        </div>
      </Card>
    </div>
  )
}
