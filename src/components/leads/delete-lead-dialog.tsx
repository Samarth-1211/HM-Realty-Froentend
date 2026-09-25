import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useDeleteLead } from '@/hooks/queries/use-leads'
import { formatEnumLabel, formatLeadNumber } from '@/lib/utils'
import type { Lead } from '@/types'

/**
 * Two-step confirmation before an Admin permanently deletes a lead: a
 * warning spelling out what will be lost, then a second dialog that only
 * unlocks once "delete" is typed (the word the backend also requires).
 * Mount it only while a lead is selected so each opening starts at step one.
 */
export function DeleteLeadDialog({
  lead,
  onClose,
  onDeleted,
}: {
  lead: Lead
  onClose: () => void
  onDeleted?: () => void
}) {
  const [step, setStep] = useState<'warn' | 'confirm'>('warn')
  const remove = useDeleteLead()

  const leadLabel = `${lead.fullName} (${formatLeadNumber(lead.leadNumber)})`
  const assignee = lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'no one'

  if (step === 'warn') {
    return (
      <ConfirmDialog
        key="warn"
        open
        onClose={onClose}
        title={`Delete ${lead.fullName}?`}
        description={`${leadLabel} is ${formatEnumLabel(lead.status)} and assigned to ${assignee}. Deleting it permanently removes the lead, its activity timeline and its WhatsApp chat. Tasks linked to it are kept but unlinked.`}
        confirmLabel="Continue"
        variant="danger"
        onConfirm={() => setStep('confirm')}
      />
    )
  }

  return (
    <ConfirmDialog
      key="confirm"
      open
      onClose={onClose}
      title="Are you absolutely sure?"
      description={`This cannot be undone. ${leadLabel} will be permanently deleted from the CRM.`}
      confirmLabel="Delete lead"
      variant="danger"
      requireTypedConfirmation="delete"
      loading={remove.isPending}
      onConfirm={() =>
        remove.mutate(lead.id, {
          onSuccess: () => {
            onClose()
            onDeleted?.()
          },
        })
      }
    />
  )
}
