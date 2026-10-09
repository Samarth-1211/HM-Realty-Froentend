import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useAssignablePeople } from '@/hooks/queries/use-assignable-people'
import { useAssignLead, useBulkAssignLeads } from '@/hooks/queries/use-leads'
import { useAuthStore } from '@/store/auth-store'
import type { Lead } from '@/types'

/**
 * Assign one lead (`lead`) or a whole selection (`leads`) to someone.
 *
 * Hot leads from platforms are auto-assigned to a Manager, but after that
 * they move like any other lead: an Admin can hand any lead to anyone in the
 * organization, across teams; a Manager to themselves, their own team, or
 * another Manager.
 */
export function AssignLeadModal({
  open,
  onClose,
  lead,
  leads,
  onHandedOver,
  onAssigned,
}: {
  open: boolean
  onClose: () => void
  lead?: Lead | null
  /** Bulk mode: every selected lead goes to the one person picked. */
  leads?: Lead[]
  /** A Manager passed the lead to another Manager — it's no longer theirs to see. */
  onHandedOver?: () => void
  /** Bulk mode: called once the selection has been assigned. */
  onAssigned?: () => void
}) {
  const [selected, setSelected] = useState('')
  const currentUser = useAuthStore((s) => s.user)
  const targets = leads ?? (lead ? [lead] : [])
  const isBulk = !!leads
  const { groups, peerIds } = useAssignablePeople(open)
  const assign = useAssignLead()
  const bulkAssign = useBulkAssignLeads()

  // Each opening starts with nobody picked, so a previous pick isn't reused for another lead.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setSelected('')
  }

  if (targets.length === 0 || !currentUser) return null

  const isHandover = peerIds.has(selected)
  const pending = assign.isPending || bulkAssign.isPending

  const submit = () => {
    if (isBulk) {
      bulkAssign.mutate(
        { leadIds: targets.map((l) => l.id), assignedToId: selected },
        {
          onSuccess: () => {
            onClose()
            onAssigned?.()
          },
        },
      )
      return
    }
    assign.mutate(
      { id: targets[0].id, assignedToId: selected, handover: isHandover },
      {
        onSuccess: () => {
          onClose()
          if (isHandover) onHandedOver?.()
        },
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isBulk ? `Assign ${targets.length.toLocaleString('en-IN')} lead${targets.length === 1 ? '' : 's'}` : 'Assign lead'}
      subtitle={isBulk ? undefined : targets[0].fullName}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">{isBulk ? 'Select who takes these leads…' : 'Select who takes this lead…'}</option>
          {groups.map(
            (group) =>
              group.candidates.length > 0 && (
                <optgroup key={group.label} label={group.label}>
                  {group.candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              ),
          )}
        </Select>
        {isHandover && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {isBulk ? 'The leads move' : 'The lead moves'} to that manager, and you and your team will no longer see{' '}
            {isBulk ? 'them' : 'it'}.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!selected} loading={pending} onClick={submit}>
            {isHandover ? 'Hand over' : 'Assign'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
