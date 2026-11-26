import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn, formatDateTime } from '@/lib/utils'
import {
  formatTargetValue,
  TARGET_METRIC_LABELS,
  TARGET_STATUS_LABELS,
  TARGET_STATUS_VARIANTS,
} from './target-utils'
import type { TargetProgress } from '@/types'

/**
 * One target: type and period, done vs target with a bar, its status and
 * — on the right — whatever actions the caller passes in.
 */
export function TargetRow({
  target,
  showPerson = false,
  actions,
}: {
  target: TargetProgress
  showPerson?: boolean
  actions?: ReactNode
}) {
  const barColor =
    target.status === 'COMPLETED'
      ? 'bg-emerald-500'
      : target.status === 'NOT_COMPLETED' || target.behind
        ? 'bg-rose-500'
        : 'bg-brand-600'

  return (
    <div className="flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {showPerson && <span className="text-sm font-semibold text-slate-900">{target.fullName}</span>}
          <span className={cn('text-sm', showPerson ? 'text-slate-600' : 'font-semibold text-slate-900')}>
            {TARGET_METRIC_LABELS[target.metric]}
          </span>
          <span className="text-xs text-slate-400">{target.periodLabel}</span>
          <Badge variant={TARGET_STATUS_VARIANTS[target.status]}>{TARGET_STATUS_LABELS[target.status]}</Badge>
          {target.behind && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
              <AlertTriangle className="size-3.5" />
              Falling behind
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-slate-100">
            <div className={cn('h-full rounded-full', barColor)} style={{ width: `${Math.min(100, target.percent)}%` }} />
          </div>
          <span className="shrink-0 text-xs tabular-nums text-slate-600">
            <b className="font-semibold text-slate-900">{formatTargetValue(target.metric, target.actualValue)}</b> /{' '}
            {formatTargetValue(target.metric, target.targetValue)} · {target.percent}%
          </span>
        </div>
        {target.lastWarnedAt && (
          <p className="mt-1 text-[11px] text-amber-700">Warned on {formatDateTime(target.lastWarnedAt)}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>}
    </div>
  )
}
