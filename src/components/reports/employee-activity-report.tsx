import { useMemo, useState } from 'react'
import { Download, ListChecks } from 'lucide-react'
import { format, startOfWeek, startOfMonth } from 'date-fns'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { StatusPill } from '@/components/ui/badge'
import { SpreadsheetTable, rowsForExport, type SheetColumn } from '@/components/ui/spreadsheet-table'
import { useActivityReport } from '@/hooks/queries/use-activities'
import { useUsers } from '@/hooks/queries/use-users'
import { useAuthStore } from '@/store/auth-store'
import { exportToCsv } from '@/lib/export-csv'
import { ASSIGNER_ROLES, ATTENDANCE_STATUS_COLORS, ATTENDANCE_STATUS_LABELS, EMPLOYEE_MODULE_ROLES } from '@/lib/constants'
import { formatDateTime, formatLeadNumber } from '@/lib/utils'
import { AttendanceStatus, type ActivityReportDay } from '@/types'

type Granularity = 'DAILY' | 'WEEKLY' | 'MONTHLY'

const GRANULARITY_TABS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
] as const

const CHECKED_IN_STATUSES: AttendanceStatus[] = [AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY, AttendanceStatus.ON_SITE_VISIT]

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function defaultRange(granularity: Granularity): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  if (granularity === 'DAILY') from.setDate(to.getDate() - 13)
  else if (granularity === 'WEEKLY') from.setDate(to.getDate() - 7 * 11)
  else from.setMonth(to.getMonth() - 11)
  return { from: toDateInput(from), to: toDateInput(to) }
}

interface ReportRow {
  key: string
  periodLabel: string
  daysPresent: number
  daysAbsent: number
  daysOnLeave: number
  totalActivities: number
  activityBreakdown: string
  leadsTouched: number
  leadsReported: number
  leadsWorkedOn: string
  workSummary: string
  checkInAt: string | null
  checkOutAt: string | null
  details: string
  attendanceStatus: AttendanceStatus | null
}

function summarizeDays(key: string, periodLabel: string, days: ActivityReportDay[]): ReportRow {
  const daysPresent = days.filter((d) => d.attendance && CHECKED_IN_STATUSES.includes(d.attendance.status)).length
  const daysAbsent = days.filter((d) => d.attendance?.status === AttendanceStatus.ABSENT).length
  const daysOnLeave = days.filter((d) => d.attendance?.status === AttendanceStatus.ON_LEAVE).length

  const allActivities = days.flatMap((d) => d.activities)
  const typeCounts = new Map<string, number>()
  const leadIds = new Set<string>()
  for (const a of allActivities) {
    typeCounts.set(a.type, (typeCounts.get(a.type) ?? 0) + 1)
    if (a.leadId) leadIds.add(a.leadId)
  }
  const activityBreakdown =
    [...typeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `${count} ${type.replace(/_/g, ' ').toLowerCase()}`)
      .join(', ') || '—'

  const reportedLeads = new Map<string, string>()
  for (const d of days) {
    for (const { lead } of d.attendance?.workedLeads ?? []) {
      reportedLeads.set(lead.id, `${formatLeadNumber(lead.leadNumber)} ${lead.fullName}`)
    }
  }

  const details =
    allActivities
      .map((a) => `${format(new Date(a.occurredAt), 'HH:mm')} ${a.type.replace(/_/g, ' ')}${a.description ? ` — ${a.description}` : ''}${a.lead ? ` (${a.lead.fullName})` : ''}`)
      .join(' | ') || '—'

  return {
    key,
    periodLabel,
    daysPresent,
    daysAbsent,
    daysOnLeave,
    totalActivities: allActivities.length,
    activityBreakdown,
    leadsTouched: leadIds.size,
    leadsReported: reportedLeads.size,
    leadsWorkedOn: [...reportedLeads.values()].join(', ') || '—',
    workSummary: days.length === 1 ? (days[0].attendance?.checkOutSummary ?? '—') : '—',
    checkInAt: days.length === 1 ? (days[0].attendance?.checkInAt ?? null) : null,
    checkOutAt: days.length === 1 ? (days[0].attendance?.checkOutAt ?? null) : null,
    details: days.length === 1 ? details : '—',
    attendanceStatus: days.length === 1 ? (days[0].attendance?.status ?? null) : null,
  }
}

function aggregate(days: ActivityReportDay[], granularity: Granularity): ReportRow[] {
  if (granularity === 'DAILY') {
    return days.map((d) => summarizeDays(d.date, format(new Date(d.date), 'dd MMM yyyy (EEE)'), [d]))
  }

  const buckets = new Map<string, { label: string; days: ActivityReportDay[] }>()
  for (const d of days) {
    const date = new Date(d.date)
    const bucketStart = granularity === 'WEEKLY' ? startOfWeek(date, { weekStartsOn: 1 }) : startOfMonth(date)
    const key = bucketStart.toISOString()
    const label = granularity === 'WEEKLY' ? `Week of ${format(bucketStart, 'dd MMM yyyy')}` : format(bucketStart, 'MMMM yyyy')
    const bucket = buckets.get(key) ?? { label, days: [] }
    bucket.days.push(d)
    buckets.set(key, bucket)
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { label, days: bucketDays }]) => summarizeDays(key, label, bucketDays))
}

/**
 * `fixedEmployeeId` locks the report to one employee and hides the picker —
 * used when it's embedded in that employee's detail page.
 */
export function EmployeeActivityReport({ fixedEmployeeId }: { fixedEmployeeId?: string } = {}) {
  const authUser = useAuthStore((s) => s.user)
  const canPickEmployee = !fixedEmployeeId && !!authUser && ASSIGNER_ROLES.includes(authUser.role)
  const { data: users } = useUsers(canPickEmployee)

  const [granularity, setGranularity] = useState<Granularity>('DAILY')
  const [range, setRange] = useState(() => defaultRange('DAILY'))
  const [pickedEmployeeId, setEmployeeId] = useState('')
  const employeeId = fixedEmployeeId ?? pickedEmployeeId

  const employeeOptions = useMemo(
    () => (users ?? []).filter((u) => EMPLOYEE_MODULE_ROLES.includes(u.role)),
    [users],
  )

  const { data: report, isLoading } = useActivityReport({
    employeeId: employeeId || undefined,
    from: range.from,
    to: range.to,
  })

  const rows = useMemo(() => aggregate(report?.days ?? [], granularity), [report, granularity])

  const isDaily = granularity === 'DAILY'

  const columns: SheetColumn<ReportRow>[] = [
    { id: 'period', header: granularity === 'DAILY' ? 'Date' : granularity === 'WEEKLY' ? 'Week' : 'Month', accessor: (r) => r.periodLabel, sticky: true, minWidth: '170px' },
    ...(isDaily
      ? ([
          {
            id: 'attendance',
            header: 'Attendance',
            accessor: (r: ReportRow) => r.attendanceStatus ?? '',
            cell: (r: ReportRow) =>
              r.attendanceStatus ? (
                <StatusPill label={ATTENDANCE_STATUS_LABELS[r.attendanceStatus]} className={ATTENDANCE_STATUS_COLORS[r.attendanceStatus]} />
              ) : (
                <span className="text-slate-400">No record</span>
              ),
            minWidth: '130px',
          },
          { id: 'checkIn', header: 'Check-in', accessor: (r: ReportRow) => r.checkInAt, cell: (r: ReportRow) => formatDateTime(r.checkInAt), minWidth: '150px' },
          { id: 'checkOut', header: 'Check-out', accessor: (r: ReportRow) => r.checkOutAt, cell: (r: ReportRow) => formatDateTime(r.checkOutAt), minWidth: '150px' },
        ] as SheetColumn<ReportRow>[])
      : ([
          { id: 'daysPresent', header: 'Days Present', accessor: (r: ReportRow) => r.daysPresent, align: 'right', minWidth: '110px' },
          { id: 'daysAbsent', header: 'Days Absent', accessor: (r: ReportRow) => r.daysAbsent, align: 'right', minWidth: '110px' },
          { id: 'daysOnLeave', header: 'Days on Leave', accessor: (r: ReportRow) => r.daysOnLeave, align: 'right', minWidth: '110px' },
        ] as SheetColumn<ReportRow>[])),
    { id: 'totalActivities', header: 'Total Activities', accessor: (r) => r.totalActivities, align: 'right', minWidth: '130px' },
    { id: 'breakdown', header: 'Activity Breakdown', accessor: (r) => r.activityBreakdown, minWidth: '260px' },
    { id: 'leadsTouched', header: 'Leads Touched', accessor: (r) => r.leadsTouched, align: 'right', minWidth: '120px' },
    ...(isDaily
      ? ([
          { id: 'workSummary', header: 'Day Summary (check-out)', accessor: (r: ReportRow) => r.workSummary, minWidth: '320px' },
          { id: 'leadsWorkedOn', header: 'Leads Worked On', accessor: (r: ReportRow) => r.leadsWorkedOn, minWidth: '260px' },
          { id: 'details', header: 'Details', accessor: (r: ReportRow) => r.details, minWidth: '320px' },
        ] as SheetColumn<ReportRow>[])
      : ([
          { id: 'leadsReported', header: 'Leads Reported at Check-out', accessor: (r: ReportRow) => r.leadsReported, align: 'right', minWidth: '140px' },
        ] as SheetColumn<ReportRow>[])),
  ]

  const handleExport = () => {
    exportToCsv(
      `employee-activity-${granularity.toLowerCase()}-${report?.employee.fullName ?? 'me'}-${range.from}-to-${range.to}`,
      columns.map((c) => c.header),
      rowsForExport(columns, rows),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {canPickEmployee && (
            <Select value={pickedEmployeeId} onChange={(e) => setEmployeeId(e.target.value)} className="max-w-[220px]">
              <option value="">Myself</option>
              {employeeOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </Select>
          )}
          <Tabs
            tabs={[...GRANULARITY_TABS]}
            active={granularity}
            onChange={(v) => {
              const g = v as Granularity
              setGranularity(g)
              setRange(defaultRange(g))
            }}
          />
          <Input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
          <span className="text-sm text-slate-400">to</span>
          <Input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
        </div>
        <Button variant="secondary" onClick={handleExport} disabled={rows.length === 0}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      <SpreadsheetTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        rowKey={(r) => r.key}
        emptyIcon={ListChecks}
        emptyTitle="No activity in this range"
        emptyDescription="Try a wider date range."
        maxHeight="60vh"
      />
    </div>
  )
}

