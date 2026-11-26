import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { Button } from '@/components/ui/button'
import { useLeads } from '@/hooks/queries/use-leads'
import { useAddTargetProgress } from '@/hooks/queries/use-targets'
import { formatLeadNumber } from '@/lib/utils'
import { formatTargetValue, TARGET_AMOUNT_METRICS, TARGET_METRIC_LABELS } from './target-utils'
import { TargetMetric, type TargetProgress } from '@/types'

/**
 * "Add progress" on one of your own targets for today: the leads you worked
 * on (required) and a note — plus, for Calls and Sales amount, how many / how much.
 */
export function AddProgressModal({ target, onClose }: { target: TargetProgress | null; onClose: () => void }) {
  const add = useAddTargetProgress()
  const { data: leads = [], isLoading: leadsLoading } = useLeads({}, !!target)
  const [leadIds, setLeadIds] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (target) {
      setLeadIds([])
      setAmount('')
      setNote('')
      setError(null)
    }
  }, [target])

  const leadLabels = useMemo(
    () => new Map(leads.map((l) => [l.id, `${formatLeadNumber(l.leadNumber)} · ${l.fullName}`])),
    [leads],
  )

  if (!target) return null
  const takesAmount = TARGET_AMOUNT_METRICS.includes(target.metric)
  const isSales = target.metric === TargetMetric.SALES_AMOUNT

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const n = Number(amount)
    if (takesAmount && (!Number.isInteger(n) || n < 1)) {
      return setError(isSales ? 'Enter the amount sold, in whole rupees.' : 'Enter how many calls you made.')
    }
    if (leadIds.length === 0) return setError('Pick at least one lead you worked on.')
    setError(null)
    add.mutate(
      { id: target.id, payload: { leadIds, amount: takesAmount ? n : undefined, note: note.trim() || undefined } },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add progress"
      subtitle={`${TARGET_METRIC_LABELS[target.metric]} · ${target.periodLabel} — ${formatTargetValue(target.metric, target.actualValue)} of ${formatTargetValue(target.metric, target.targetValue)} done`}
      size="md"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {takesAmount ? (
          <Field
            label={isSales ? 'Amount sold today (₹)' : 'Calls made'}
            required
            hint={
              isSales
                ? 'In whole rupees.'
                : 'Calls from your check-out report count too — for each day the higher of the two numbers counts, not both.'
            }
          >
            <Input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={isSales ? '500000' : '12'}
              autoFocus
            />
          </Field>
        ) : (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            The CRM counts {TARGET_METRIC_LABELS[target.metric].toLowerCase()} itself (and from your check-out report). Add the
            leads behind them here.
          </p>
        )}

        <Field label="Leads you worked on" required hint="Pick every lead this work was done on.">
          <MultiSelect
            options={leads.map((l) => l.id)}
            value={leadIds}
            onChange={setLeadIds}
            formatLabel={(id) => leadLabels.get(id) ?? id}
            placeholder={leadsLoading ? 'Loading leads…' : 'Select leads…'}
            searchable
            searchPlaceholder="Search by name or LD number…"
            emptyLabel="You have no leads to pick from"
          />
        </Field>

        <Field label="Note" hint="Optional">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={2} />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={add.isPending}>
            Add progress
          </Button>
        </div>
      </form>
    </Modal>
  )
}
