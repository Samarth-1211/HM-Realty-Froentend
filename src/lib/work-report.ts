/**
 * The end-of-day work report: counters filled in with +/- at check-out.
 * Keys match the backend's work-report.constants.ts (and what is stored in
 * Attendance.checkOutCounts) — add new ones, never rename.
 */
export const WORK_REPORT_GROUPS = [
  {
    title: 'Calls',
    items: [
      { key: 'outgoingCalls', label: 'Total outgoing calls' },
      { key: 'incomingCalls', label: 'Total calls attended (incoming)' },
      { key: 'notPickingCalls', label: 'NPC (not picking calls)' },
      { key: 'notInterested', label: 'Not interested clients' },
      { key: 'interested', label: 'Interested / potential clients' },
    ],
  },
  {
    title: 'Site visits',
    items: [
      { key: 'siteVisitsScheduled', label: 'Total site visits scheduled' },
      { key: 'siteVisitsCompleted', label: 'Total site visits completed' },
      { key: 'siteVisitsPending', label: 'Pending / rescheduled site visits' },
    ],
  },
  {
    title: 'Meetings and connections',
    items: [
      { key: 'officeMeetings', label: 'Total office meetings attended' },
      { key: 'clientMeetings', label: 'Total client meetings' },
      { key: 'realtorConnections', label: 'Total realtor connections' },
      { key: 'brokerMeetings', label: 'Total broker / channel partner meetings' },
    ],
  },
  {
    title: 'Other',
    items: [
      { key: 'otherActivities', label: 'Other business activities' },
      { key: 'newLeads', label: 'New leads generated' },
      { key: 'dealsClosed', label: 'Deals / bookings closed' },
    ],
  },
] as const

export type WorkReportKey = (typeof WORK_REPORT_GROUPS)[number]['items'][number]['key']
export type WorkReportCounts = Partial<Record<WorkReportKey, number>>

export const WORK_REPORT_MAX_COUNT = 9999

export const WORK_REPORT_ITEMS: { key: WorkReportKey; label: string }[] = WORK_REPORT_GROUPS.flatMap((g) => [...g.items])

export const emptyWorkReportCounts = (): Record<WorkReportKey, number> =>
  Object.fromEntries(WORK_REPORT_ITEMS.map((i) => [i.key, 0])) as Record<WorkReportKey, number>

export function totalWorkReportCount(counts: WorkReportCounts | null | undefined): number {
  return Object.values(counts ?? {}).reduce<number>((sum, n) => sum + (typeof n === 'number' ? n : 0), 0)
}

/** The counters that were actually used (above 0), in form order. */
export function reportedWorkItems(counts: WorkReportCounts | null | undefined) {
  return WORK_REPORT_ITEMS.flatMap((item) => {
    const count = counts?.[item.key] ?? 0
    return count > 0 ? [{ ...item, count }] : []
  })
}

/** "Total outgoing calls 42 · Total client meetings 2" — for tables and exports. */
export function workReportText(counts: WorkReportCounts | null | undefined): string {
  return reportedWorkItems(counts)
    .map((i) => `${i.label} ${i.count}`)
    .join(' · ')
}
