import { useMemo, useState } from 'react'
import { format, startOfMonth } from 'date-fns'
import { CalendarDays, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/ui/badge'
import { SpreadsheetTable, rowsForExport, type SheetColumn } from '@/components/ui/spreadsheet-table'
import { WorkedLeadChips } from '@/components/attendance/work-report'
import { useEmployeeAttendance } from '@/hooks/queries/use-attendance'
import { exportToCsv } from '@/lib/export-csv'
import { ATTENDANCE_STATUS_COLORS, ATTENDANCE_STATUS_LABELS } from '@/lib/constants'
import { formatDate, formatLeadNumber, formatTime } from '@/lib/utils'
import { AttendanceStatus, type Attendance } from '@/types'

const WORKED_STATUSES: AttendanceStatus[] = [AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY, AttendanceStatus.ON_SITE_VISIT]

function minutesWorked(a: Attendance): number | null {
  if (!a.checkInAt || !a.checkOutAt) return null
  return Math.max(0, Math.round((new Date(a.checkOutAt).getTime() - new Date(a.checkInAt).getTime()) / 60_000))
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '—'
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
}

/** Check-in / check-out history for one employee, with each day's check-out work report. */
export function UserAttendanceTab({ userId, fullName }: { userId: string; fullName: string }) {
  const [range, setRange] = useState(() => ({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  }))
  const { data: records = [], isLoading } = useEmployeeAttendance(userId, range)

  const stats = useMemo(() => {
    const count = (status: AttendanceStatus) => records.filter((r) => r.status === status).length
    const worked = records.map(minutesWorked).filter((m): m is number => m !== null)
    return {
      daysWorked: records.filter((r) => WORKED_STATUSES.includes(r.status)).length,
      halfDays: count(AttendanceStatus.HALF_DAY),
      onLeave: count(AttendanceStatus.ON_LEAVE),
      absent: count(AttendanceStatus.ABSENT),
      avgMinutes: worked.length > 0 ? Math.round(worked.reduce((a, b) => a + b, 0) / worked.length) : null,
      reportsSubmitted: records.filter((r) => r.checkOutSummary).length,
    }
  }, [records])

  const columns: SheetColumn<Attendance>[] = [
    { id: 'date', header: 'Date', accessor: (r) => r.date.slice(0, 10), cell: (r) => formatDate(r.date), sticky: true, minWidth: '120px' },
    {
      id: 'status',
      header: 'Status',
      accessor: (r) => ATTENDANCE_STATUS_LABELS[r.status] ?? r.status,
      cell: (r) => <StatusPill label={ATTENDANCE_STATUS_LABELS[r.status] ?? r.status} className={ATTENDANCE_STATUS_COLORS[r.status] ?? ''} />,
      minWidth: '130px',
    },
    { id: 'checkIn', header: 'Check-in', accessor: (r) => (r.checkInAt ? formatTime(r.checkInAt) : null), minWidth: '100px' },
    { id: 'checkOut', header: 'Check-out', accessor: (r) => (r.checkOutAt ? formatTime(r.checkOutAt) : null), minWidth: '100px' },
    { id: 'hours', header: 'Hours', accessor: (r) => minutesWorked(r), cell: (r) => formatDuration(minutesWorked(r)), align: 'right', minWidth: '90px' },
    {
      id: 'summary',
      header: 'Day summary',
      accessor: (r) => r.checkOutSummary ?? '',
      cell: (r) =>
        r.checkOutSummary ? (
          <p className="max-w-md whitespace-pre-line text-slate-700">{r.checkOutSummary}</p>
        ) : (
          <span className="text-slate-300">{r.checkInAt && !r.checkOutAt ? 'Not checked out' : '—'}</span>
        ),
      sortable: false,
      minWidth: '320px',
    },
    {
      id: 'leads',
      header: 'Leads worked on',
      accessor: (r) => (r.workedLeads ?? []).map(({ lead }) => `${formatLeadNumber(lead.leadNumber)} ${lead.fullName}`).join(', '),
      cell: (r) => (r.workedLeads?.length ? <WorkedLeadChips workedLeads={r.workedLeads} /> : <span className="text-slate-300">—</span>),
      sortable: false,
      minWidth: '260px',
    },
    { id: 'notes', header: 'Check-in notes', accessor: (r) => r.notes ?? '', sortable: false, minWidth: '200px' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
          <span className="text-sm text-slate-400">to</span>
          <Input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
        </div>
        <Button
          variant="secondary"
          disabled={records.length === 0}
          onClick={() =>
            exportToCsv(
              `attendance-${fullName}-${range.from}-to-${range.to}`,
              columns.map((c) => c.header),
              rowsForExport(columns, records),
            )
          }
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label="Days worked" value={stats.daysWorked} />
        <MiniStat label="Half days" value={stats.halfDays} />
        <MiniStat label="On leave" value={stats.onLeave} />
        <MiniStat label="Absent" value={stats.absent} />
        <MiniStat label="Avg. hours / day" value={formatDuration(stats.avgMinutes)} />
        <MiniStat label="Day reports" value={stats.reportsSubmitted} />
      </div>

      <SpreadsheetTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        emptyIcon={CalendarDays}
        emptyTitle="No attendance in this range"
        emptyDescription="Try a wider date range."
        maxHeight="60vh"
      />
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-slate-900">{value}</p>
    </div>
  )
}
