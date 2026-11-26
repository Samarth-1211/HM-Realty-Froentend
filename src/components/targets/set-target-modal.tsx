import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSetTarget, useUpdateTarget } from '@/hooks/queries/use-targets'
import {
  formatTargetValue,
  TARGET_METRIC_HINTS,
  TARGET_METRIC_LABELS,
  TARGET_METRICS,
  TARGET_PERIOD_LABELS,
  todayKey,
} from './target-utils'
import { TargetMetric, TargetPeriodType, type TargetProgress } from '@/types'

const PERIOD_TYPES: TargetPeriodType[] = [
  TargetPeriodType.DAY,
  TargetPeriodType.WEEK,
  TargetPeriodType.MONTH,
  TargetPeriodType.CUSTOM,
]

/**
 * Set a new target for someone (type, period, value), or — given an existing
 * target — change just its value.
 */
export function SetTargetModal({
  open,
  onClose,
  employee,
  existing,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  employee: { userId: string; fullName: string } | null
  /** Edit this target's value instead of setting a new one. */
  existing?: TargetProgress | null
  /** The day the period starts from by default ("2026-11-26"). */
  defaultDate?: string
}) {
  const setTarget = useSetTarget()
  const updateTarget = useUpdateTarget()

  const [metric, setMetric] = useState<TargetMetric>(TargetMetric.CALLS)
  const [periodType, setPeriodType] = useState<TargetPeriodType>(TargetPeriodType.MONTH)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const start = defaultDate ?? todayKey()
    setMetric(existing?.metric ?? TargetMetric.CALLS)
    setPeriodType(existing?.periodType ?? TargetPeriodType.MONTH)
    setStartDate(existing?.startDate ?? start)
    setEndDate(existing?.endDate ?? start)
    setValue(existing ? String(existing.targetValue) : '')
    setError(null)
  }, [open, existing, defaultDate])

  const isSales = metric === TargetMetric.SALES_AMOUNT
  const pending = setTarget.isPending || updateTarget.isPending

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!employee) return
    const targetValue = Number(value)
    if (!Number.isInteger(targetValue) || targetValue < 1) {
      setError(isSales ? 'Enter the target amount in whole rupees.' : 'Enter a whole number of at least 1.')
      return
    }

    if (existing) {
      updateTarget.mutate({ id: existing.id, targetValue }, { onSuccess: onClose })
      return
    }

    if (!startDate) return setError('Choose the period.')
    if (periodType === TargetPeriodType.CUSTOM) {
      if (!endDate) return setError('Choose the last day.')
      if (endDate < startDate) return setError('The last day cannot be before the first day.')
    }
    setError(null)
    setTarget.mutate(
      {
        userId: employee.userId,
        metric,
        targetValue,
        periodType,
        startDate,
        endDate: periodType === TargetPeriodType.CUSTOM ? endDate : undefined,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? 'Change target' : 'Set target'}
      subtitle={
        employee
          ? existing
            ? `${employee.fullName} — ${TARGET_METRIC_LABELS[existing.metric]}, ${existing.periodLabel}`
            : `For ${employee.fullName}`
          : undefined
      }
      size="sm"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {!existing && (
          <>
            <Field label="Target for" required hint={TARGET_METRIC_HINTS[metric]}>
              <Select value={metric} onChange={(e) => setMetric(e.target.value as TargetMetric)}>
                {TARGET_METRICS.map((m) => (
                  <option key={m} value={m}>
                    {TARGET_METRIC_LABELS[m]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Period" required>
              <div className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1">
                {PERIOD_TYPES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriodType(p)}
                    className={cn(
                      'rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                      periodType === p ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                    )}
                  >
                    {p === TargetPeriodType.CUSTOM ? 'Custom' : TARGET_PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>
            </Field>

            {periodType === TargetPeriodType.MONTH ? (
              <Field label="Month" required>
                <Input
                  type="month"
                  value={startDate.slice(0, 7)}
                  onChange={(e) => setStartDate(e.target.value ? `${e.target.value}-01` : '')}
                />
              </Field>
            ) : periodType === TargetPeriodType.CUSTOM ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="From" required>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Field>
                <Field label="To" required>
                  <Input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
                </Field>
              </div>
            ) : (
              <Field
                label={periodType === TargetPeriodType.WEEK ? 'Week' : 'Day'}
                required
                hint={periodType === TargetPeriodType.WEEK ? 'Pick any day — the target covers its Monday to Sunday.' : undefined}
              >
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
            )}
          </>
        )}

        <Field
          label={isSales ? 'Target amount (₹)' : 'Target'}
          required
          hint={
            existing
              ? `${formatTargetValue(existing.metric, existing.actualValue)} done so far.`
              : isSales
                ? 'In whole rupees, e.g. 2500000 for ₹25 lakh.'
                : undefined
          }
        >
          <Input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={isSales ? '2500000' : '100'}
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {existing ? 'Save' : 'Set target'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
