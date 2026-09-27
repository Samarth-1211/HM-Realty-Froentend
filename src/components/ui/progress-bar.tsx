import { cn } from '@/lib/utils'

/**
 * A thin progress line with a caption, for uploads and other long-running
 * work. Pass `value={null}` while the amount of work left isn't known yet —
 * the bar then sweeps instead of filling.
 */
export function ProgressBar({
  value,
  label,
  detail,
  tone = 'brand',
  className,
}: {
  /** 0–100, or null for "working on it". */
  value: number | null
  label?: string
  /** Right-hand caption; defaults to the percentage. */
  detail?: string
  tone?: 'brand' | 'success' | 'danger'
  className?: string
}) {
  const percent = value === null ? null : Math.max(0, Math.min(100, Math.round(value)))
  const fill = { brand: 'bg-brand-600', success: 'bg-emerald-500', danger: 'bg-rose-500' }[tone]

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || detail || percent !== null) && (
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="truncate font-medium text-slate-600">{label}</span>
          <span className="shrink-0 tabular-nums text-slate-400">{detail ?? (percent !== null ? `${percent}%` : '')}</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
      >
        {percent === null ? (
          <div className={cn('h-full w-1/3 animate-progress-indeterminate rounded-full', fill)} />
        ) : (
          <div
            className={cn('h-full rounded-full transition-[width] duration-300 ease-out', fill)}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
    </div>
  )
}
