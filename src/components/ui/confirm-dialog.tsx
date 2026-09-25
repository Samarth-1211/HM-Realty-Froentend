import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './modal'
import { Button } from './button'
import { Field, Input } from './input'
import { Textarea } from './select'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  variant?: 'primary' | 'danger'
  requireReason?: boolean
  reasonLabel?: string
  /** The exact word (case-insensitive) the user must type before the confirm button unlocks, e.g. "delete". */
  requireTypedConfirmation?: string
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  loading,
  ...options
}: ConfirmOptions & {
  open: boolean
  onClose: () => void
  onConfirm: (reason?: string) => void
  loading?: boolean
}) {
  const [reason, setReason] = useState('')
  const [typedConfirmation, setTypedConfirmation] = useState('')

  const confirmationSatisfied =
    !options.requireTypedConfirmation ||
    typedConfirmation.trim().toLowerCase() === options.requireTypedConfirmation.trim().toLowerCase()

  return (
    <Modal open={open} onClose={onClose} title={options.title} size="sm" level="elevated">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className={
              options.variant === 'danger'
                ? 'flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600'
                : 'flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600'
            }
          >
            <AlertTriangle className="size-5" />
          </div>
          {options.description && <p className="pt-2 text-sm text-slate-500">{options.description}</p>}
        </div>
        {options.requireReason && (
          <Field label={options.reasonLabel ?? 'Reason'}>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add a short note…"
              maxLength={255}
            />
          </Field>
        )}
        {options.requireTypedConfirmation && (
          <Field label={`Type "${options.requireTypedConfirmation}" to confirm`}>
            <Input
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              placeholder={options.requireTypedConfirmation}
              autoComplete="off"
              autoFocus
            />
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={options.variant === 'danger' ? 'danger' : 'primary'}
            loading={loading}
            disabled={!confirmationSatisfied}
            onClick={() => onConfirm(reason || undefined)}
          >
            {options.confirmLabel ?? 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
