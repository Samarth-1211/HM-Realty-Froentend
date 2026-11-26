import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/input'
import { Textarea } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useWarnTarget } from '@/hooks/queries/use-targets'
import { formatTargetValue, TARGET_METRIC_LABELS } from './target-utils'
import type { TargetProgress } from '@/types'

/** Sends the employee a warning notification about one target, with an optional message. */
export function WarnTargetModal({ target, onClose }: { target: TargetProgress | null; onClose: () => void }) {
  const warn = useWarnTarget()
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (target) setMessage('')
  }, [target])

  if (!target) return null

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    warn.mutate({ id: target.id, message: message.trim() || undefined }, { onSuccess: onClose })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Send a warning to ${target.fullName}`}
      subtitle={`${TARGET_METRIC_LABELS[target.metric]} · ${target.periodLabel} — ${formatTargetValue(target.metric, target.actualValue)} of ${formatTargetValue(target.metric, target.targetValue)} done`}
      size="sm"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Message" hint="Optional — they get it as a notification, with the target's numbers added.">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="e.g. Please pick up the pace — we need these calls done by Friday."
            autoFocus
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={warn.isPending}>
            Send warning
          </Button>
        </div>
      </form>
    </Modal>
  )
}
