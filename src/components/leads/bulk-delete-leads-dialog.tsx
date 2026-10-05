import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useBulkDeleteLeads, useDeleteImportLeads } from '@/hooks/queries/use-leads'
import { useAuthStore } from '@/store/auth-store'
import { canManageLeadRecord } from '@/lib/lead-channel'
import { UserRole, type Lead } from '@/types'

/** Every lead from one uploaded sheet — `count` is how many of them the caller can see. */
export interface SheetToDelete {
  id: string
  fileName: string
  count: number
}

const leadsLabel = (n: number) => `${n.toLocaleString('en-IN')} lead${n === 1 ? '' : 's'}`

/**
 * Two-step confirmation before deleting many leads at once — a selection
 * (`leads`) or everything from one uploaded Excel sheet (`sheet`): a warning
 * spelling out what will be lost, then a second dialog that only unlocks
 * once "delete" is typed. Leads the user can't delete are left out (and the
 * backend checks again). Mount it only while open so each opening starts at
 * step one.
 */
export function BulkDeleteLeadsDialog({
  leads,
  sheet,
  onClose,
  onDeleted,
}: {
  leads?: Lead[]
  sheet?: SheetToDelete
  onClose: () => void
  onDeleted?: () => void
}) {
  const [step, setStep] = useState<'warn' | 'confirm'>('warn')
  const currentUser = useAuthStore((s) => s.user)
  const bulkDelete = useBulkDeleteLeads()
  const deleteSheet = useDeleteImportLeads()
  const isManager = currentUser?.role === UserRole.MANAGER

  const deletable = (leads ?? []).filter((l) => canManageLeadRecord(currentUser, l))
  const notDeletable = (leads?.length ?? 0) - deletable.length
  const count = sheet ? sheet.count : deletable.length

  if (!sheet && deletable.length === 0) {
    return (
      <ConfirmDialog
        open
        onClose={onClose}
        title="Nothing you can delete"
        description="None of the selected leads can be deleted by you — Managers can only delete leads that were added manually or uploaded from Excel in their own team. Ask an Admin to delete the others."
        confirmLabel="OK"
        onConfirm={onClose}
      />
    )
  }

  const what = sheet ? `every lead from “${sheet.fileName}”` : leadsLabel(count)

  if (step === 'warn') {
    return (
      <ConfirmDialog
        key="warn"
        open
        onClose={onClose}
        title={sheet ? `Delete all leads from ${sheet.fileName}?` : `Delete ${leadsLabel(count)}?`}
        description={[
          `This permanently removes ${what}${sheet ? ` (${leadsLabel(count)}${isManager ? ' in your team' : ''})` : ''}, with their activity timelines and WhatsApp chats. Tasks linked to them are kept but unlinked.`,
          sheet && isManager ? 'Leads from this sheet in other teams are not affected.' : '',
          sheet ? 'The upload stays in the upload history.' : '',
          notDeletable > 0
            ? `${leadsLabel(notDeletable)} in your selection can’t be deleted by you and will be skipped.`
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
        confirmLabel="Continue"
        variant="danger"
        onConfirm={() => setStep('confirm')}
      />
    )
  }

  const done = {
    onSuccess: () => {
      onClose()
      onDeleted?.()
    },
  }

  return (
    <ConfirmDialog
      key="confirm"
      open
      onClose={onClose}
      title="Are you absolutely sure?"
      description={`This cannot be undone. ${sheet ? `Every lead from ${sheet.fileName}` : leadsLabel(count)} will be permanently deleted from the CRM.`}
      confirmLabel={sheet ? 'Delete sheet’s leads' : `Delete ${leadsLabel(count)}`}
      variant="danger"
      requireTypedConfirmation="delete"
      loading={bulkDelete.isPending || deleteSheet.isPending}
      onConfirm={() =>
        sheet ? deleteSheet.mutate(sheet.id, done) : bulkDelete.mutate(deletable.map((l) => l.id), done)
      }
    />
  )
}
