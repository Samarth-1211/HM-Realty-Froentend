import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Download, Sheet } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge, StatusPill } from '@/components/ui/badge'
import { SpreadsheetTable, rowsForExport, sortRows, type SheetColumn, type SheetSort } from '@/components/ui/spreadsheet-table'
import { useLeads } from '@/hooks/queries/use-leads'
import { useUsers } from '@/hooks/queries/use-users'
import { useAuthStore } from '@/store/auth-store'
import { exportToCsv } from '@/lib/export-csv'
import {
  lostLeadsLast,
  matchesLeadDateRange,
  matchesLeadStatusFilter,
  orderedDateRange,
  providedByLabel,
  uploadedByLabel,
} from '@/lib/lead-channel'
import { LeadChannelBadge } from '@/components/leads/lead-channel-badge'
import { LeadDateRangeFilter } from '@/components/leads/lead-date-range-filter'
import { LeadStatusFilter } from '@/components/leads/lead-status-filter'
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  LEAD_PROGRESS_STAGE_LABELS,
  LEAD_PURPOSE_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_TEMPERATURE_COLORS,
  LEAD_TEMPERATURE_LABELS,
  VISIT_STATUS_COLORS,
  VISIT_STATUS_LABELS,
} from '@/lib/constants'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatEnumLabel,
  formatLeadBudget,
  formatLeadNumber,
  formatLeadPhones,
  formatLeadPlotSize,
  toLocalDateKey,
  toLocalDateTimeKey,
} from '@/lib/utils'
import { BookingStatus, LeadSource, LeadTemperature, UserRole, type Lead } from '@/types'

function leadIdLabel(lead: Lead): string {
  return formatLeadNumber(lead.leadNumber)
}

function assigneeLabel(lead: Lead): string {
  return lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'
}

/** "Site visit scheduled", or the typed note for an "Other" stage; empty unless the lead is in progress. */
function progressStageLabel(lead: Lead): string {
  if (!lead.progressStage) return ''
  return lead.progressStage === 'OTHER' ? (lead.progressStageNote ?? 'Other') : LEAD_PROGRESS_STAGE_LABELS[lead.progressStage]
}

export function LeadSheetPage() {
  const navigate = useNavigate()
  const isManager = useAuthStore((s) => s.user?.role === UserRole.MANAGER)
  const { data: leads = [], isLoading } = useLeads()
  const { data: users = [] } = useUsers()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [temperature, setTemperature] = useState('')
  const [source, setSource] = useState('')
  const [executive, setExecutive] = useState('')
  const [bookingStatus, setBookingStatus] = useState('')
  const [sheet, setSheet] = useState('')
  // The days leads were received between — see LeadDateRangeFilter.
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  // Held here rather than in the table, so the export can follow the order on screen.
  const [sort, setSort] = useState<SheetSort>(null)

  // Every uploaded Excel sheet these leads came from, newest first.
  const sheets = useMemo(() => {
    const byId = new Map<string, NonNullable<Lead['importBatch']>>()
    for (const l of leads) if (l.importBatch) byId.set(l.importBatch.id, l.importBatch)
    return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [leads])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const matching = leads.filter((l) => {
      if (!matchesLeadStatusFilter(l, status)) return false
      if (temperature && l.leadTemperature !== temperature) return false
      if (source && l.source !== source) return false
      if (executive && l.assignedToId !== executive) return false
      if (bookingStatus && l.bookingStatus !== bookingStatus) return false
      if (sheet && l.importBatchId !== sheet) return false
      if (!matchesLeadDateRange(l, dateRange.from, dateRange.to)) return false
      if (q) {
        const haystack = `${l.fullName} ${formatLeadPhones(l)} ${l.project?.name ?? ''} ${leadIdLabel(l)}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
    return status ? matching : lostLeadsLast(matching)
  }, [leads, search, status, temperature, source, executive, bookingStatus, sheet, dateRange])

  const executiveOptions = useMemo(
    () => users.filter((u) => u.role === 'PRESALES' || u.role === 'POSTSALES' || u.role === 'AGENT'),
    [users],
  )

  const columns: SheetColumn<Lead>[] = [
    { id: 'leadId', header: 'Lead ID', accessor: leadIdLabel, sticky: true, minWidth: '110px' },
    // Dates sort on the stored timestamp; the file gets them in local time, as on screen, in a form Excel reads as a date.
    { id: 'leadDate', header: 'Lead Date', accessor: (l) => l.createdAt, exportValue: (l) => toLocalDateKey(l.createdAt), cell: (l) => formatDate(l.createdAt), minWidth: '110px' },
    { id: 'customerName', header: 'Customer Name', accessor: (l) => l.fullName, minWidth: '160px' },
    { id: 'mobile', header: 'Mobile No.', accessor: formatLeadPhones, minWidth: '120px' },
    { id: 'source', header: 'Lead Source', accessor: (l) => l.source, cell: (l) => formatEnumLabel(l.source), minWidth: '140px' },
    {
      id: 'providedBy',
      header: 'Provided By',
      accessor: providedByLabel,
      cell: (l) => (
        <span className="flex flex-col items-start gap-0.5">
          <LeadChannelBadge lead={l} />
          {uploadedByLabel(l) && <span className="text-xs text-slate-500">{uploadedByLabel(l)}</span>}
        </span>
      ),
      minWidth: '190px',
    },
    { id: 'executive', header: 'Assigned Executive', accessor: assigneeLabel, minWidth: '160px' },
    { id: 'location', header: 'Interested Location', accessor: (l) => l.city ?? '', minWidth: '150px' },
    { id: 'project', header: 'Project', accessor: (l) => l.project?.name ?? '', minWidth: '140px' },
    { id: 'budget', header: 'Budget (₹)', accessor: (l) => Number(l.budgetMax ?? l.budgetMin ?? 0), cell: formatLeadBudget, align: 'right', minWidth: '170px' },
    // A plot size range sorts on its low end; the file gets the whole range.
    { id: 'plotSize', header: 'Plot Size (Sq Ft)', accessor: (l) => l.plotSizeSqFt, exportValue: (l) => (l.plotSizeSqFt != null ? formatLeadPlotSize(l) : null), cell: formatLeadPlotSize, align: 'right', minWidth: '140px' },
    { id: 'purpose', header: 'Purpose', accessor: (l) => l.purpose ?? '', cell: (l) => (l.purpose ? LEAD_PURPOSE_LABELS[l.purpose] : '—'), minWidth: '110px' },
    {
      id: 'stage',
      header: 'Lead Stage',
      accessor: (l) => l.status,
      cell: (l) => <StatusPill label={formatEnumLabel(l.status)} className={LEAD_STATUS_COLORS[l.status]} />,
      minWidth: '130px',
    },
    { id: 'progressStage', header: 'Progress Stage', accessor: progressStageLabel, cell: (l) => progressStageLabel(l) || '—', minWidth: '170px' },
    {
      id: 'temperature',
      header: 'Lead Temperature',
      accessor: (l) => l.leadTemperature ?? '',
      cell: (l) => (l.leadTemperature ? <Badge className={LEAD_TEMPERATURE_COLORS[l.leadTemperature]}>{LEAD_TEMPERATURE_LABELS[l.leadTemperature]}</Badge> : '—'),
      minWidth: '140px',
    },
    { id: 'lastContact', header: 'Last Contact Date', accessor: (l) => l.lastContactedAt, exportValue: (l) => toLocalDateTimeKey(l.lastContactedAt), cell: (l) => formatDateTime(l.lastContactedAt), minWidth: '160px' },
    { id: 'nextFollowUp', header: 'Next Follow-up Date', accessor: (l) => l.nextFollowUpAt, exportValue: (l) => toLocalDateTimeKey(l.nextFollowUpAt), cell: (l) => formatDateTime(l.nextFollowUpAt), minWidth: '160px' },
    { id: 'siteVisitDate', header: 'Site Visit Date', accessor: (l) => l.siteVisitDate, exportValue: (l) => toLocalDateKey(l.siteVisitDate), cell: (l) => formatDate(l.siteVisitDate), minWidth: '130px' },
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
    // The file is named after the chosen lead dates, or today's date when no range is set.
    const [start, end] = orderedDateRange(dateRange.from, dateRange.to)
    const fileLabel =
      start && end ? `${start}-to-${end}` : start ? `from-${start}` : end ? `up-to-${end}` : toLocalDateKey(new Date().toISOString())
    exportToCsv(
      `lead-sheet-${fileLabel}`,
      columns.map((c) => c.header),
      // Same rows, in the same order, as the table shows.
      rowsForExport(columns, sortRows(columns, filtered, sort)),
    )
  }

  return (
    <div>
      <PageHeader
        title="Lead Sheet"
        description={`${
          isManager ? 'Every lead held by you and your team' : 'Every lead across the organization'
        }, spreadsheet-style — sort any column, filter, and export.`}
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
          <LeadStatusFilter
            allLabel="All stages"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="lg:max-w-[200px]"
          />
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
          {sheets.length > 0 && (
            <Select value={sheet} onChange={(e) => setSheet(e.target.value)} className="lg:max-w-[220px]">
              <option value="">All Excel sheets</option>
              {sheets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.fileName} · {formatDate(b.createdAt)}
                </option>
              ))}
            </Select>
          )}
          <LeadDateRangeFilter from={dateRange.from} to={dateRange.to} onChange={setDateRange} />
        </div>

        <div className="p-4">
          <SpreadsheetTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            rowKey={(l) => l.id}
            sort={sort}
            onSortChange={setSort}
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
