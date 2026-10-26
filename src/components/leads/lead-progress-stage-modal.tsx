import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/input'
import { Select, Textarea } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { LEAD_PROGRESS_STAGE_LABELS } from '@/lib/constants'
import { LeadProgressStage } from '@/types'
import { fromDateTimeParts, toDateTimeParts, VisitDateTimeFields, type DateTimeParts } from './visit-date-time-fields'

const STAGE_OPTIONS = Object.values(LeadProgressStage)

/** The next whole hour — a starting point for booking a visit. */
function nextHour(): Date {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return d
}

export function LeadProgressStageModal({
  open,
  onClose,
  onConfirm,
  loading,
  initialStage,
  initialNote,
  initialVisitAt,
}: {
  open: boolean
  onClose: () => void
  /**
   * `siteVisitAt` comes with "Site visit scheduled". "Site visit done" is
   * confirmed without saving anything — the caller opens the visit form.
   */
  onConfirm: (stage: LeadProgressStage, note?: string, siteVisitAt?: string) => void
  loading?: boolean
  initialStage?: LeadProgressStage | null
  initialNote?: string | null
  /** The lead's current site visit date, to start the booking from when it's still ahead. */
  initialVisitAt?: string | null
}) {
  const [stage, setStage] = useState<LeadProgressStage>(initialStage ?? LeadProgressStage.CONTACTED)
  const [note, setNote] = useState(initialNote ?? '')
  const [visitAt, setVisitAt] = useState<DateTimeParts>(() => toDateTimeParts(nextHour()))

  // Each time it opens, start from the lead as it is now.
  useEffect(() => {
    if (!open) return
    setStage(initialStage ?? LeadProgressStage.CONTACTED)
    setNote(initialNote ?? '')
    // A visit already booked starts from its time; a past one doesn't.
    const booked = initialVisitAt ? new Date(initialVisitAt) : null
    setVisitAt(toDateTimeParts(booked && booked.getTime() > Date.now() ? booked : nextHour()))
  }, [open, initialStage, initialNote, initialVisitAt])

  const isScheduling = stage === LeadProgressStage.SITE_VISIT_SCHEDULED
  const isVisitDone = stage === LeadProgressStage.SITE_VISIT_DONE
  const scheduledAt = isScheduling ? fromDateTimeParts(visitAt) : null

  const confirm = () => onConfirm(stage, note || undefined, scheduledAt?.toISOString())

  return (
    <Modal open={open} onClose={onClose} title="What stage is this lead at?" subtitle="This shows up on the lead's activity timeline" size="sm">
      <div className="flex flex-col gap-4">
        <Field label="Progress stage" required>
          <Select value={stage} onChange={(e) => setStage(e.target.value as LeadProgressStage)}>
            {STAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {LEAD_PROGRESS_STAGE_LABELS[s] ?? s}
              </option>
            ))}
          </Select>
        </Field>
        {stage === LeadProgressStage.OTHER && (
          <Field label="Describe the stage" required hint="Required when 'Other' is selected">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Waiting on loan approval" />
          </Field>
        )}
        {isScheduling && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-slate-500">When is the site visit booked for?</p>
            <VisitDateTimeFields value={visitAt} onChange={setVisitAt} />
          </div>
        )}
        {isVisitDone && (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Next, fill in the visit details and add a photo from the site.
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            loading={loading}
            disabled={(stage === LeadProgressStage.OTHER && !note.trim()) || (isScheduling && !scheduledAt)}
            onClick={confirm}
          >
            {isVisitDone ? 'Next' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
