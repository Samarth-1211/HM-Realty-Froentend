import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useUsers } from '@/hooks/queries/use-users'
import { useAssignLead } from '@/hooks/queries/use-leads'
import { STAFF_ROLES } from '@/lib/constants'
import type { Lead } from '@/types'

export function AssignLeadModal({
  open,
  onClose,
  lead,
}: {
  open: boolean
  onClose: () => void
  lead: Lead | null
}) {
  const [selected, setSelected] = useState('')
  const { data: users } = useUsers(open)
  const assign = useAssignLead()

  if (!lead) return null
  const candidates = (users ?? []).filter((u) => STAFF_ROLES.includes(u.role) && u.isActive)

  return (
    <Modal open={open} onClose={onClose} title="Assign lead" subtitle={lead.fullName} size="sm">
      <div className="flex flex-col gap-4">
        <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Select a team member…</option>
          {candidates.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName} ({u.role})
            </option>
          ))}
        </Select>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            loading={assign.isPending}
            onClick={() => assign.mutate({ id: lead.id, assignedToId: selected }, { onSuccess: onClose })}
          >
            Assign
          </Button>
        </div>
      </div>
    </Modal>
  )
}
