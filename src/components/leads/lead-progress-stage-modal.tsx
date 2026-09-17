import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/input'
import { Select, Textarea } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { LEAD_PROGRESS_STAGE_LABELS } from '@/lib/constants'
import { LeadProgressStage } from '@/types'

const STAGE_OPTIONS = Object.values(LeadProgressStage)

export function LeadProgressStageModal({
  open,
  onClose,
  onConfirm,
  loading,
  initialStage,
  initialNote,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (stage: LeadProgressStage, note?: string) => void
  loading?: boolean
  initialStage?: LeadProgressStage | null
  initialNote?: string | null
}) {
  const [stage, setStage] = useState<LeadProgressStage>(initialStage ?? LeadProgressStage.CONTACTED)
  const [note, setNote] = useState(initialNote ?? '')

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
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            loading={loading}
            disabled={stage === LeadProgressStage.OTHER && !note.trim()}
            onClick={() => onConfirm(stage, note || undefined)}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}
