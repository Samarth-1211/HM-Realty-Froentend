import { TargetMetric, type TargetProgress } from '@/types'

export const TARGET_METRIC_LABELS: Record<TargetMetric, string> = {
  CALLS: 'Calls',
  CONVERSIONS: 'Conversions',
}

/** What the actual is counted from. */
export const TARGET_METRIC_HINTS: Record<TargetMetric, string> = {
  CALLS: 'Counts calls logged as daily activities this month.',
  CONVERSIONS: 'Counts assigned leads marked Converted this month.',
}

/** Actual as a whole percentage of the target (can pass 100). */
export function targetPercent(progress: Pick<TargetProgress, 'actualValue' | 'targetValue'>): number {
  if (!progress.targetValue) return 0
  return Math.round(((progress.actualValue ?? 0) / progress.targetValue) * 100)
}

/** A calendar month targets are set for. */
export interface TargetPeriod {
  year: number
  month: number
}

export function currentPeriod(): TargetPeriod {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
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
