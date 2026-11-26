import { TargetMetric, TargetPeriodType, type TargetProgress, type TargetStatus } from '@/types'
import type { WorkReportCounts, WorkReportKey } from '@/lib/work-report'

export const TARGET_METRIC_LABELS: Record<TargetMetric, string> = {
  CALLS: 'Calls',
  SITE_VISITS: 'Site visits',
  MEETINGS: 'Meetings',
  NEW_LEADS: 'New leads',
  BOOKINGS: 'Bookings / deals',
  CONVERSIONS: 'Conversions',
  SALES_AMOUNT: 'Sales amount (₹)',
}

/** The order target types are offered in. */
export const TARGET_METRICS: TargetMetric[] = [
  TargetMetric.CALLS,
  TargetMetric.SITE_VISITS,
  TargetMetric.MEETINGS,
  TargetMetric.NEW_LEADS,
  TargetMetric.BOOKINGS,
  TargetMetric.CONVERSIONS,
  TargetMetric.SALES_AMOUNT,
]

/** Where the number comes from — matches the backend's TargetsService.countDays. */
export const TARGET_METRIC_HINTS: Record<TargetMetric, string> = {
  CALLS: 'Counts "Total outgoing calls" from the check-out report, or calls added with "Add progress" — the higher of the two each day.',
  SITE_VISITS: 'Counts "Site visits completed" from the check-out report, or site visits saved on leads — the higher each day.',
  MEETINGS: 'Counts client + broker / channel partner meetings from the check-out report, or meetings logged as activities — the higher each day.',
  NEW_LEADS: 'Counts "New leads generated" from the check-out report, or leads they added (not Excel uploads) — the higher each day.',
  BOOKINGS: 'Counts "Deals / bookings closed" from the check-out report, or their leads moved to Converted — the higher each day.',
  CONVERSIONS: 'Counts their leads moved to Converted.',
  SALES_AMOUNT: 'Counts the rupee amounts added with "Add progress".',
}

/** The check-out report counters each target type adds up — matches the backend's TARGET_REPORT_KEYS. */
export const TARGET_REPORT_KEYS: Record<TargetMetric, WorkReportKey[]> = {
  CALLS: ['outgoingCalls'],
  SITE_VISITS: ['siteVisitsCompleted'],
  MEETINGS: ['clientMeetings', 'brokerMeetings'],
  NEW_LEADS: ['newLeads'],
  BOOKINGS: ['dealsClosed'],
  CONVERSIONS: [],
  SALES_AMOUNT: [],
}

/** Target types where "Add progress" also takes a number. */
export const TARGET_AMOUNT_METRICS: TargetMetric[] = [TargetMetric.CALLS, TargetMetric.SALES_AMOUNT]

/** Do these check-out counts add to a target of this type? */
export function countsFeedTarget(metric: TargetMetric, counts: WorkReportCounts): boolean {
  return TARGET_REPORT_KEYS[metric].some((key) => (counts[key] ?? 0) > 0)
}

/** "40", or "₹1,25,000" for a sales amount. */
export function formatTargetValue(metric: TargetMetric, value: number): string {
  return metric === TargetMetric.SALES_AMOUNT ? `₹${value.toLocaleString('en-IN')}` : value.toLocaleString('en-IN')
}

export const TARGET_PERIOD_LABELS: Record<TargetPeriodType, string> = {
  DAY: 'Day',
  WEEK: 'Week',
  MONTH: 'Month',
  CUSTOM: 'Custom dates',
}

export const TARGET_STATUS_LABELS: Record<TargetStatus, string> = {
  COMPLETED: 'Completed',
  NOT_COMPLETED: 'Not completed',
  IN_PROGRESS: 'In progress',
  UPCOMING: 'Upcoming',
}

export const TARGET_STATUS_VARIANTS: Record<TargetStatus, 'success' | 'danger' | 'brand' | 'neutral'> = {
  COMPLETED: 'success',
  NOT_COMPLETED: 'danger',
  IN_PROGRESS: 'brand',
  UPCOMING: 'neutral',
}

/** Is the target running today (so progress can be added to it)? */
export function isRunningToday(target: Pick<TargetProgress, 'startDate' | 'endDate'>): boolean {
  const today = todayKey()
  return target.startDate <= today && today <= target.endDate
}

// ---------------------------------------------------------------------------
// Dates — "YYYY-MM-DD" strings in the business timezone (India).
// ---------------------------------------------------------------------------

const BUSINESS_TIMEZONE = 'Asia/Kolkata'

/** Today in India, e.g. "2026-11-26". */
export function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TIMEZONE }).format(new Date())
}

/** A calendar month the Targets page shows. */
export interface TargetPeriod {
  year: number
  month: number
}

export function currentPeriod(): TargetPeriod {
  const [year, month] = todayKey().split('-').map(Number)
  return { year, month }
}

/** "October 2026" */
export function formatPeriod({ year, month }: TargetPeriod): string {
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

/** The month `by` months before (negative) or after this one. */
export function shiftPeriod({ year, month }: TargetPeriod, by: number): TargetPeriod {
  const d = new Date(year, month - 1 + by, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

/** The month as a from–to range for the target lists. */
export function periodRange({ year, month }: TargetPeriod): { from: string; to: string } {
  const pad = (n: number) => String(n).padStart(2, '0')
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(lastDay)}` }
}

/** "26 Nov 2026" from "2026-11-26". */
export function formatDayKey(key: string): string {
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(`${key}T00:00:00Z`),
  )
}
