import type { Dispatch, SetStateAction } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  WORK_REPORT_GROUPS,
  WORK_REPORT_MAX_COUNT,
  type WorkReportKey,
} from '@/lib/work-report'

type Counts = Record<WorkReportKey, number>

/**
 * The end-of-day report form: the label on the left, a number on the right
 * that goes up/down with the + and − buttons (or can be typed straight in).
 */
export function WorkReportCounters({
  value,
  onChange,
  disabled,
}: {
  value: Counts
  onChange: Dispatch<SetStateAction<Counts>>
  disabled?: boolean
}) {
  const clamp = (n: number) => Math.min(WORK_REPORT_MAX_COUNT, Math.max(0, Math.floor(n) || 0))
  const set = (key: WorkReportKey, n: number) => onChange((prev) => ({ ...prev, [key]: clamp(n) }))
  const nudge = (key: WorkReportKey, delta: number) => onChange((prev) => ({ ...prev, [key]: clamp(prev[key] + delta) }))

  return (
    <div className="flex flex-col gap-4">
      {WORK_REPORT_GROUPS.map((group) => (
        <section key={group.title}>
          <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{group.title}</h3>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {group.items.map((item) => {
              const count = value[item.key]
              return (
                <li key={item.key} className="flex items-center justify-between gap-3 px-3 py-2">
                  <label htmlFor={`wr-${item.key}`} className={cn('text-sm', count > 0 ? 'font-medium text-slate-800' : 'text-slate-600')}>
                    {item.label}
                  </label>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Decrease ${item.label}`}
                      disabled={disabled || count === 0}
                      onClick={() => nudge(item.key, -1)}
                      className="flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="size-4" />
                    </button>
                    <input
                      id={`wr-${item.key}`}
                      inputMode="numeric"
                      value={count}
                      disabled={disabled}
                      onChange={(e) => set(item.key, Number(e.target.value.replace(/\D/g, '')))}
                      onFocus={(e) => e.target.select()}
                      className={cn(
                        'h-8 w-14 rounded-md border border-slate-200 text-center text-sm tabular-nums outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
                        count > 0 && 'border-brand-200 bg-brand-50 font-semibold text-brand-700',
                      )}
                    />
                    <button
                      type="button"
                      aria-label={`Increase ${item.label}`}
                      disabled={disabled || count >= WORK_REPORT_MAX_COUNT}
                      onClick={() => nudge(item.key, 1)}
                      className="flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
