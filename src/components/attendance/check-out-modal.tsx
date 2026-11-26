import { useMemo, useState, type FormEvent } from 'react'
import { LogOut } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/input'
import { Textarea } from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { Button } from '@/components/ui/button'
import { WorkReportCounters } from '@/components/attendance/work-report-counters'
import { useCheckOut } from '@/hooks/queries/use-attendance'
import { useLeads } from '@/hooks/queries/use-leads'
import { useMyTargets } from '@/hooks/queries/use-targets'
import { countsFeedTarget, TARGET_METRIC_LABELS, todayKey } from '@/components/targets/target-utils'
import { formatLeadNumber } from '@/lib/utils'
import { emptyWorkReportCounts, totalWorkReportCount } from '@/lib/work-report'

const SUMMARY_MAX_LENGTH = 5000

/**
 * Check-out asks for an end-of-day work report: how many of each thing was
 * done (calls, site visits, meetings…) using +/- counters, plus an optional
 * note and, optionally, every lead that work was done on.
 */
export function CheckOutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const checkOut = useCheckOut()
  const { data: leads = [], isLoading: leadsLoading } = useLeads()
  const [counts, setCounts] = useState(emptyWorkReportCounts)
  const [summary, setSummary] = useState('')
  const [leadIds, setLeadIds] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const leadLabels = useMemo(
    () => new Map(leads.map((l) => [l.id, `${formatLeadNumber(l.leadNumber)} · ${l.fullName}`])),
    [leads],
  )

  const today = todayKey()
  const { data: todaysTargets = [] } = useMyTargets({ from: today, to: today }, open)
  const fedTargets = todaysTargets.filter((t) => countsFeedTarget(t.metric, counts))
  const leadsRequired = fedTargets.length > 0

  const total = totalWorkReportCount(counts)
  const empty = total === 0 && !summary.trim()
  const missingLeads = leadsRequired && leadIds.length === 0

  const handleClose = () => {
    setCounts(emptyWorkReportCounts())
    setSummary('')
    setLeadIds([])
    setSubmitted(false)
    onClose()
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (empty || missingLeads) return
    checkOut.mutate(
      {
        counts: total > 0 ? counts : undefined,
        summary: summary.trim() || undefined,
        leadIds: leadIds.length > 0 ? leadIds : undefined,
      },
      { onSuccess: handleClose },
    )
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Check out for today"
      subtitle="Tell us what you got done today — tap + for each one."
      size="lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <WorkReportCounters value={counts} onChange={setCounts} disabled={checkOut.isPending} />

        <Field
          label="Anything else to add?"
          hint={`Optional — ${summary.length}/${SUMMARY_MAX_LENGTH}`}
        >
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={SUMMARY_MAX_LENGTH}
            rows={3}
            placeholder="e.g. Family wants a second visit on Saturday…"
          />
        </Field>

        <Field
          label="Leads you worked on"
          required={leadsRequired}
          hint={
            leadsRequired
              ? `Required — today's counts go toward your ${fedTargets
                  .map((t) => TARGET_METRIC_LABELS[t.metric].toLowerCase())
                  .join(', ')} target.`
              : "Optional — pick every lead today's work was done on."
          }
        >
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

        {submitted && empty && (
          <p className="text-sm text-red-600">Add at least one count (or a note) about today's work to check out.</p>
        )}
        {submitted && !empty && missingLeads && (
          <p className="text-sm text-red-600">Pick the leads you worked on — today's counts go toward your targets.</p>
        )}

        <p className="text-xs text-slate-400">
          You won't be able to log any more activity against today's attendance after checking out.
        </p>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500">{total > 0 ? `${total} in total` : ''}</p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={checkOut.isPending}>
              <LogOut className="size-4" />
              Submit report & check out
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
