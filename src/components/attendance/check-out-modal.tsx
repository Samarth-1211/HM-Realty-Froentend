import { useMemo, useState, type FormEvent } from 'react'
import { LogOut } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/input'
import { Textarea } from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { Button } from '@/components/ui/button'
import { useCheckOut } from '@/hooks/queries/use-attendance'
import { useLeads } from '@/hooks/queries/use-leads'
import { formatLeadNumber } from '@/lib/utils'

const SUMMARY_MAX_LENGTH = 5000

/**
 * Check-out requires an end-of-day work report: a mandatory summary of what
 * was done, plus (optionally) every lead that work was done on.
 */
export function CheckOutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const checkOut = useCheckOut()
  const { data: leads = [], isLoading: leadsLoading } = useLeads()
  const [summary, setSummary] = useState('')
  const [leadIds, setLeadIds] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const leadLabels = useMemo(
    () => new Map(leads.map((l) => [l.id, `${formatLeadNumber(l.leadNumber)} · ${l.fullName}`])),
    [leads],
  )

  const handleClose = () => {
    setSummary('')
    setLeadIds([])
    setSubmitted(false)
    onClose()
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const trimmed = summary.trim()
    if (!trimmed) return
    checkOut.mutate({ summary: trimmed, leadIds: leadIds.length > 0 ? leadIds : undefined }, { onSuccess: handleClose })
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Check out for today"
      subtitle="Submit your end-of-day work report to check out."
      size="lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field
          label="Summary of today's work"
          required
          error={submitted && !summary.trim() ? 'A summary of the work you did today is required to check out' : undefined}
          hint={`${summary.length}/${SUMMARY_MAX_LENGTH}`}
        >
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            error={submitted && !summary.trim()}
            maxLength={SUMMARY_MAX_LENGTH}
            rows={6}
            autoFocus
            placeholder="e.g. Called 6 leads, did a site visit at Sunrise Meadows with the Sharma family, sent brochures to 3 new enquiries on WhatsApp…"
          />
        </Field>

        <Field label="Leads you worked on" hint="Optional — pick every lead today's work was done on.">
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

        <p className="text-xs text-slate-400">
          You won't be able to log any more activity against today's attendance after checking out.
        </p>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={checkOut.isPending}>
            <LogOut className="size-4" />
            Submit report & check out
          </Button>
        </div>
      </form>
    </Modal>
  )
}
